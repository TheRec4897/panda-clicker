'use strict';

const express = require('express');
const Stripe = require('stripe');
const { Pool } = require('pg');

const PRODUCTS = [
  {
    id: 'cosmetic-sakura',
    name: 'Fleur de sakura',
    description: 'Un accessoire décoratif permanent pour ton panda.',
    category: 'Cosmétique',
    priceMinor: 0.99,
    currency: 'eur',
    repeatable: false,
    kind: 'cosmetic',
    amount: 'sakura'
  },
  {
    id: 'auto-click-1',
    name: 'Patte automatique',
    description: 'Ajoute 1 clic automatique par seconde, de façon permanente.',
    category: 'Clics automatiques',
    priceMinor: 1.99,
    currency: 'eur',
    repeatable: true,
    maxPurchases: 10,
    kind: 'auto-click',
    amount: 1
  },
  {
    id: 'production-double',
    name: 'Bénédiction du panda',
    description: 'Double définitivement la production de bambou.',
    category: 'Multiplicateur',
    priceMinor: 2.99,
    currency: 'eur',
    repeatable: false,
    kind: 'multiplier',
    amount: 1
  },
  {
    id: 'jade-100',
    name: 'Petit sachet de jade',
    description: 'Ajoute 100 jade à ta réserve.',
    category: 'Jade',
    priceMinor: 3.99,
    currency: 'eur',
    repeatable: true,
    kind: 'jade',
    amount: 100
  },
  {
    id: 'jade-600',
    name: 'Coffre de jade',
    description: 'Ajoute 600 jade à ta réserve.',
    category: 'Jade',
    priceMinor: 7.99,
    currency: 'eur',
    repeatable: true,
    kind: 'jade',
    amount: 600
  }
];

const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
const INSTALL_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error('Variable d’environnement requise absente : ' + name);
  return value;
}

function requiredHttpsUrl(name) {
  let url;
  try {
    url = new URL(requiredEnvironment(name));
  } catch (error) {
    throw new Error('URL HTTPS invalide pour ' + name);
  }
  if (url.protocol !== 'https:') throw new Error(name + ' doit être une URL HTTPS.');
  return url.href;
}

function createApp(stripe, pool, successUrl, cancelUrl) {
  const app = express();

  app.get('/health', (_request, response) => response.json({ ok: true }));

  app.get('/api/products', (_request, response) => {
    response.json({
      products: PRODUCTS.map(({ id, name, description, category, priceMinor, currency, repeatable, maxPurchases }) => ({
          id, name, description, category, priceMinor, currency, repeatable, maxPurchases
      }))
    });
  });

  app.post('/api/checkout', express.json({ limit: '8kb' }), async (request, response, next) => {
    try {
      const { installId, productId } = request.body || {};
      if (typeof installId !== 'string' || !INSTALL_ID_PATTERN.test(installId)) {
        return response.status(400).json({ error: 'Identifiant d’installation invalide.' });
      }
      const product = PRODUCT_BY_ID.get(productId);
      if (!product) return response.status(400).json({ error: 'Produit inconnu.' });

      if (product.maxPurchases) {
        const purchases = await pool.query(
          'SELECT COUNT(*)::int AS quantity FROM paid_orders WHERE install_id = $1 AND product_id = $2',
          [installId, product.id]
        );
        if (purchases.rows[0].quantity >= product.maxPurchases) {
          return response.status(409).json({ error: 'La limite d’achat de cet article est atteinte.' });
        }
      }

      if (!product.repeatable) {
        const owned = await pool.query(
          'SELECT 1 FROM paid_orders WHERE install_id = $1 AND product_id = $2 LIMIT 1',
          [installId, product.id]
        );
        if (owned.rowCount) {
          return response.status(409).json({ error: 'Cet article a déjà été acheté sur cette installation.' });
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: product.priceMinor,
            product_data: { name: product.name, description: product.description }
          }
        }],
        client_reference_id: installId,
        metadata: { install_id: installId, product_id: product.id },
        success_url: successUrl,
        cancel_url: cancelUrl
      });
      response.json({ url: session.url });
    } catch (error) {
      next(error);
    }
  });

  const recordPaidOrder = async (session) => {
    if (session.payment_status !== 'paid') return;
    const installId = session.metadata && session.metadata.install_id;
    const productId = session.metadata && session.metadata.product_id;
    if (!INSTALL_ID_PATTERN.test(installId || '') || !PRODUCT_BY_ID.has(productId)) {
      throw new Error('Métadonnées de paiement invalides pour la session ' + session.id);
    }
    await pool.query(
      'INSERT INTO paid_orders (session_id, install_id, product_id) VALUES ($1, $2, $3) ON CONFLICT (session_id) DO NOTHING',
      [session.id, installId, productId]
    );
  };

  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        request.headers['stripe-signature'],
        requiredEnvironment('STRIPE_WEBHOOK_SECRET')
      );
    } catch (error) {
      console.error('Signature Stripe invalide :', error.message);
      return response.status(400).send('Signature invalide');
    }

    try {
      if (event.type === 'checkout.session.completed'
          || event.type === 'checkout.session.async_payment_succeeded') {
        await recordPaidOrder(event.data.object);
      }
      response.json({ received: true });
    } catch (error) {
      console.error('Impossible d’enregistrer le paiement Stripe :', error);
      response.status(500).json({ error: 'Enregistrement du paiement impossible.' });
    }
  });

  app.get('/api/entitlements', async (request, response, next) => {
    try {
      const installId = request.query.installId;
      if (typeof installId !== 'string' || !INSTALL_ID_PATTERN.test(installId)) {
        return response.status(400).json({ error: 'Identifiant d’installation invalide.' });
      }
      const result = await pool.query(
        'SELECT product_id, COUNT(*)::int AS quantity FROM paid_orders WHERE install_id = $1 GROUP BY product_id',
        [installId]
      );
      const counts = new Map(result.rows.map((row) => [row.product_id, row.quantity]));
      response.json({
        jadeGranted: (counts.get('jade-100') || 0) * 100 + (counts.get('jade-600') || 0) * 600,
        autoClicks: counts.get('auto-click-1') || 0,
        multiplierCount: counts.get('production-double') || 0,
        cosmetics: counts.get('cosmetic-sakura') ? ['sakura'] : []
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    console.error('Erreur du service de paiement :', error);
    response.status(500).json({ error: 'Erreur interne du service de paiement.' });
  });

  return app;
}

async function start() {
  const stripe = new Stripe(requiredEnvironment('STRIPE_SECRET_KEY'));
  const pool = new Pool({ connectionString: requiredEnvironment('DATABASE_URL') });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS paid_orders (
      session_id TEXT PRIMARY KEY,
      install_id UUID NOT NULL,
      product_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS paid_orders_install_id_idx ON paid_orders (install_id)');

  const successUrl = requiredHttpsUrl('PAYMENT_SUCCESS_URL');
  const cancelUrl = process.env.PAYMENT_CANCEL_URL
    ? requiredHttpsUrl('PAYMENT_CANCEL_URL')
    : successUrl;
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || '0.0.0.0';
  const server = createApp(stripe, pool, successUrl, cancelUrl).listen(port, host, () => {
    console.info('Service de paiement à l’écoute sur ' + host + ':' + port);
  });

  const close = () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Démarrage du service de paiement impossible :', error);
    process.exitCode = 1;
  });
}

module.exports = { PRODUCTS, createApp };
