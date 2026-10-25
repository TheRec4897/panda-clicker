/* ==========================================================================
   Panda Clicker — application de bureau (Electron)
   Ce fichier ouvre une fenêtre et y charge le jeu (dossier game/).
   ========================================================================== */

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const DiscordRPC = require('discord-rpc');

/* ---------- Achats Stripe ---------- */

const paymentApiUrl = (
  process.env.PANDA_CLICKER_PAYMENT_API_URL
  || require('./package.json').paymentApiUrl
  || ''
).trim().replace(/\/+$/, '');

function getPaymentApiUrl(route) {
  if (!paymentApiUrl) {
    throw new Error('La boutique est indisponible : le serveur de paiement n’est pas configuré.');
  }

  let base;
  try {
    base = new URL(paymentApiUrl);
  } catch (error) {
    throw new Error('URL du serveur de paiement invalide.');
  }

  const localHost = base.hostname === 'localhost' || base.hostname === '127.0.0.1';
  if (base.protocol !== 'https:' && !(localHost && base.protocol === 'http:')) {
    throw new Error('Le serveur de paiement doit utiliser HTTPS.');
  }

  return new URL(route, base.href + '/');
}

function getInstallId() {
  const file = path.join(app.getPath('userData'), 'payment-install-id');
  try {
    const saved = fs.readFileSync(file, 'utf8').trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved)) return saved;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const installId = randomUUID();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, installId, { encoding: 'utf8', flag: 'w' });
  return installId;
}

async function paymentRequest(route, options) {
  const response = await fetch(getPaymentApiUrl(route), {
    ...options,
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => {
    throw new Error('Réponse invalide du serveur de paiement.');
  });
  if (!response.ok) {
    throw new Error(body.error || 'Le serveur de paiement a refusé la requête.');
  }
  return body;
}

ipcMain.handle('payments:products', () => paymentRequest('/api/products'));

ipcMain.handle('payments:entitlements', () => {
  const query = new URLSearchParams({ installId: getInstallId() });
  return paymentRequest('/api/entitlements?' + query.toString());
});

ipcMain.handle('payments:checkout', async (_event, productId) => {
  if (typeof productId !== 'string' || !/^[a-z0-9-]{1,60}$/.test(productId)) {
    throw new Error('Produit invalide.');
  }

  const result = await paymentRequest('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ installId: getInstallId(), productId })
  });

  let checkoutUrl;
  try {
    checkoutUrl = new URL(result.url);
  } catch (error) {
    throw new Error('Le serveur n’a pas fourni de lien de paiement valide.');
  }
  if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com') {
    throw new Error('Le lien de paiement Stripe a été refusé.');
  }

  await shell.openExternal(checkoutUrl.href);
  return { opened: true };
});

/* ---------- Discord Rich Presence ---------- */

const DISCORD_RETRY_MS = 15000;   // délai entre deux tentatives de connexion
const DISCORD_UPDATE_MS = 15000;  // Discord limite la fréquence des mises à jour

const sessionStart = new Date();
let bambooCount = 0;
let lastPushedText = null;   // dernier texte envoyé à Discord
let hasReceivedBambooCount = false;

let discordRpc;              // client actuellement connecté
let discordRetryTimer;       // minuteur de la prochaine tentative de connexion
let discordUpdateTimer;      // minuteur de mise à jour périodique
let discordClosing = false;

/** Le jeu transmet son nombre de bambous via le preload sécurisé. */
ipcMain.on('presence:update', (_event, count) => {
  if (typeof count === 'number' && Number.isFinite(count)) {
    bambooCount = Math.max(0, Math.floor(count));
    hasReceivedBambooCount = true;
    if (discordRpc && lastPushedText === null) pushActivity(discordRpc);
  }
});

function buildActivity() {
  const bambooText = bambooCount.toLocaleString('fr-FR');
  return {
    details: 'Récolte du bambou',
    state: 'Possède ' + bambooText + (bambooCount === 1 ? ' bambou' : ' bambous'),
    startTimestamp: sessionStart,
    instance: false
  };
}

function pushActivity(client) {
  lastPushedText = bambooCount;
  return client.setActivity(buildActivity())
    .then(() => {
      console.info('Discord Rich Presence : activité envoyée (' + bambooCount + ' bambous).');
    })
    .catch((error) => {
      console.error('Impossible de mettre à jour la présence Discord :', error);
    });
}

function scheduleDiscordRetry(clientId) {
  if (discordClosing) return;
  clearTimeout(discordRetryTimer);
  discordRetryTimer = setTimeout(() => connectDiscord(clientId), DISCORD_RETRY_MS);
}

function connectDiscord(clientId) {
  const client = new DiscordRPC.Client({ transport: 'ipc' });

  client.on('ready', () => {
    console.info('Discord Rich Presence : connectée.');
    if (hasReceivedBambooCount) pushActivity(client);
  });

  // Discord a été fermé puis rouvert : on se reconnecte
  client.on('disconnected', () => {
    console.warn('Discord Rich Presence : déconnectée, nouvel essai bientôt.');
    discordRpc = undefined;
    scheduleDiscordRetry(clientId);
  });

  client.login({ clientId })
    .then(() => { discordRpc = client; })
    .catch((error) => {
      console.error(
        'Discord Rich Presence : connexion impossible (Discord de bureau ouvert ?). ' +
        'Nouvel essai dans ' + DISCORD_RETRY_MS / 1000 + ' s. Détail :', error.message
      );
      client.destroy().catch(() => {});
      scheduleDiscordRetry(clientId);
    });
}

function startDiscordPresence() {
  const clientId = (
    process.env.DISCORD_CLIENT_ID
    || require('./package.json').discordClientId
    || ''
  ).trim();

  if (!clientId) {
    console.info('Discord Rich Presence désactivée : configurez discordClientId dans package.json.');
    return;
  }

  connectDiscord(clientId);

  // Toutes les 15 s, on met Discord à jour si le nombre de bambous a changé
  discordUpdateTimer = setInterval(() => {
    if (discordRpc && bambooCount !== lastPushedText) pushActivity(discordRpc);
  }, DISCORD_UPDATE_MS);
}

/* ---------- Fenêtre ---------- */

function createWindow() {
  const iconExtension = process.platform === 'win32' ? 'ico' : 'png';
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 500,
    title: 'Panda Clicker',
    icon: path.join(__dirname, 'game', 'assets', `panda-clicker.${iconExtension}`),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Pas de barre de menus (Fichier, Edition…) : on veut une fenêtre de jeu
  Menu.setApplicationMenu(null);

  win.loadFile(path.join(__dirname, 'game', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  startDiscordPresence();

  // macOS : recréer la fenêtre si on clique sur l'icône du Dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Windows et Linux : quitter quand la fenêtre est fermée
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  discordClosing = true;
  clearTimeout(discordRetryTimer);
  clearInterval(discordUpdateTimer);
  if (discordRpc) {
    discordRpc.destroy().catch((error) => {
      console.error('Impossible de fermer proprement Discord Rich Presence :', error);
    });
  }
});
