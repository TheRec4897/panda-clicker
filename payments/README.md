# Service de paiement

Le client Electron ne contient aucune clé Stripe. Cette API crée les sessions Stripe Checkout et accorde les achats uniquement après réception d’un webhook Stripe signé. Les achats sont associés à l’identifiant de cette installation et ne sont pas restaurables sur un autre appareil.

## Préparation

1. Créer un compte Stripe et configurer d’abord les clés de test.
2. Préparer une base PostgreSQL persistante.
3. Déployer ce dossier sur un serveur HTTPS avec Node.js et installer ses dépendances (`npm install --prefix payments` depuis la racine du projet).
4. Définir les variables d’environnement suivantes sur le serveur :

   - `STRIPE_SECRET_KEY` : clé secrète Stripe (`sk_test_…` en test).
   - `STRIPE_WEBHOOK_SECRET` : secret de signature du webhook.
   - `DATABASE_URL` : URL de connexion PostgreSQL.
   - `PAYMENT_SUCCESS_URL` : URL HTTPS affichée après le paiement.
   - `PAYMENT_CANCEL_URL` : URL HTTPS facultative après annulation.
   - `PORT` : port d’écoute facultatif (8787 par défaut).

5. Dans Stripe, créer un webhook vers `https://<serveur>/api/stripe-webhook` et activer `checkout.session.completed` et `checkout.session.async_payment_succeeded`.
6. Démarrer le service avec `npm run payments:start`.
7. Vérifier `https://<serveur>/health`, puis renseigner l’URL HTTPS de l’API dans `paymentApiUrl` de `package.json` avant de créer les installateurs.

Pour le développement local, définir `PANDA_CLICKER_PAYMENT_API_URL` dans l’environnement du processus Electron. Une URL HTTP n’est acceptée que sur `localhost` ou `127.0.0.1`.

## Catalogue provisoire

Les prix ci-dessous sont des propositions de départ, à confirmer avant d’utiliser les clés Stripe en production :

| Offre | Prix proposé | Effet |
|---|---:|---|
| Fleur de sakura | 0,99 € | Cosmétique permanent |
| Patte automatique | 1,99 € | +1 clic automatique par seconde (10 maximum) |
| Bénédiction du panda | 2,99 € | Production ×2, une fois |
| Petit sachet de jade | 3,99 € | +100 jade |
| Coffre de jade | 7,99 € | +600 jade |

Les montants et effets sont définis côté serveur dans `server.js`. Le client ne décide jamais du prix ou du produit livré. Avant une mise en production, vérifier les obligations de TVA, de remboursement, d’information sur les achats numériques et les paramètres de paiement du compte Stripe.
