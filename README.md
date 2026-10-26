# Panda Clicker

Panda Clicker est un jeu : clique sur le panda pour récolter du bambou, développe ta production grâce à des bâtiments et des améliorations, puis gagne du jade en atteignant des paliers de récolte pour acheter des bonus permanents.

## Fonctionnalités

- Récolte manuelle et production automatique de bambous.
- 16 bâtiments à acheter, avec des coûts croissants et plusieurs modes d’achat.
- Améliorations de clic, de production globale et de bâtiments.
- Pandas dorés qui accordent des bonus temporaires ou des bambous.
- Succès, accessoires à débloquer et statistiques de progression.
- Paliers de récolte qui accordent du jade et boutique permanente de jade.
- Sauvegarde automatique, export et import de sauvegarde.
- Progression hors ligne, avec une limite de durée.
- Présence Discord et mises à jour intégrées dans l’application de bureau.
- Boutique premium facultative, pas encore configurée.

## Jouer

1. Clique sur le panda pour récolter du bambou.
2. Dépense tes bambous dans l’onglet **Bâtiments** pour augmenter ta production par seconde. Choisis un achat ×1, ×10, ×100 ou **Max**.
3. Achète des **Améliorations** pour renforcer tes clics et tes bâtiments. Certaines apparaissent lorsque tu progresses ou possèdes assez d’exemplaires du bâtiment concerné.
4. Clique sur le panda doré quand il apparaît : il peut déclencher une frénésie de production, une frénésie de clics ou un gain de bambous.
5. Consulte les onglets **Succès** et **Stats** pour suivre ta progression et débloquer des accessoires.
6. Récolte des bambous pour atteindre les paliers qui accordent automatiquement du jade, puis dépense-le dans l’onglet **Boutique Jade**.

### Jade

Le jade est accordé automatiquement selon le total de bambous récoltés. Les paliers suivent la progression cubique : 1 jade à 1 milliards de bambous, 2 à 8 milliards, puis 3 à 27 milliards, etc. Chaque jade gagné augmente la production de 5 %.

La boutique de jade propose des bonus permanents : un apport immédiat de bébés pandas, amélioration des clics, de la production ou du taux d’apparition du panda doré, réduction du coût des bâtiments et production hors ligne améliorée.

### Production hors ligne

La production est calculée lorsque le jeu est relancé. Par défaut, elle est limitée à 2 heures et créditée à 25 % de la production normale. L’amélioration de jade **Sommeil productif** porte ces limites à 8 heures et 50 %.

## Installation et lancement depuis les sources

### Prérequis

- Node.js et npm.
- Un système compatible avec Electron : Windows, macOS ou Linux.

### Démarrer le jeu

À la racine du dépôt :

```bash
npm install
npm start
```

`npm start` ouvre le jeu dans une fenêtre Electron.

### Créer un installateur

```bash
npm run build
```

Le projet utilise electron-builder. La cible dépend du système de compilation :

- Windows : installateur NSIS (`.exe`).
- macOS : image disque (`.dmg`).
- Linux : image AppImage.

Le script de compilation charge le fichier `.env` à la racine du projet. Crée ce fichier avant de compiler si nécessaire. La configuration des mises à jour publiées sur GitHub se trouve dans `package.json`.

## Sauvegardes et réglages

La partie est sauvegardée automatiquement toutes les 15 secondes et lorsque la fenêtre est masquée ou fermée. Les données locales sont stockées par Electron dans le stockage du jeu associé à l’utilisateur courant.

Dans l’onglet **Réglages**, tu peux :

- sauvegarder immédiatement ;
- exporter ou copier un code de sauvegarde ;
- importer un code de sauvegarde, notamment pour transférer une partie ;
- activer ou désactiver les effets sonores, la notation scientifique et les feuilles d’arrière-plan ;
- équiper ou retirer les accessoires débloqués ;
- réinitialiser la progression locale. Cette action demande une double confirmation.

Avant de changer d’appareil ou de réinitialiser la partie, exporte une sauvegarde et conserve son code en lieu sûr. Les achats premium sont associés à l’installation et ne sont pas transférables par le code de sauvegarde.

## Boutique premium facultative

La boutique premium n’est utilisable que si un serveur de paiement est déployé et configuré. Les achats sont traités avec Stripe ; les confirmations et les droits achetés sont vérifiés par le serveur. Le client ne contient pas de clé secrète Stripe. Les achats sont liés à l’identifiant de l’installation.

Pour configurer le service, consulter [`payments/README.md`](payments/README.md). Le catalogue et ses prix indiqués dans cette documentation de paiement sont provisoires et doivent être vérifiés avant toute mise en production.

Pour un développement local, l’URL de l’API peut être fournie via la variable d’environnement `PANDA_CLICKER_PAYMENT_API_URL`. En dehors de `localhost` ou `127.0.0.1`, l’API doit utiliser HTTPS. Pour une version distribuée, la propriété `paymentApiUrl` de `package.json` sert à configurer l’URL du serveur.

## Discord Rich Presence

Si l’application de bureau Discord est ouverte, le jeu peut afficher l’activité Panda Clicker et le nombre de bambous possédés. L’identifiant de l’application Discord est configuré dans `package.json` et peut être remplacé pour le développement avec `DISCORD_CLIENT_ID`.

## Structure du projet

```text
main.js                      Processus principal Electron, mises à jour et intégrations
preload.js                   API limitée entre Electron et l’interface du jeu
game/
  index.html                 Interface du jeu
  style.css                  Styles
  assets/                    Icônes et images
  scripts/                   État, boucle de jeu, boutique et progression
payments/
  server.js                  API facultative de paiement Stripe
  README.md                  Configuration et déploiement du service de paiement
```

## Technologies

- [Electron](https://www.electronjs.org/) pour l’application de bureau.
- HTML, CSS et JavaScript pour le jeu.
- [electron-builder](https://www.electron.build/) et [electron-updater](https://www.electron.build/auto-update) pour la distribution et les mises à jour.
- `discord-rpc` pour la présence Discord.
- Express, PostgreSQL et Stripe pour le service de paiement facultatif.

## Dépannage

- **Le jeu ne démarre pas** : vérifie que `npm install` s’est terminé sans erreur et que ta version de Node.js est installée.
- **La présence Discord n’apparaît pas** : lance l’application de bureau Discord et vérifie sa configuration.
- **La boutique ne se charge pas** : elle nécessite un serveur de paiement configuré et accessible en HTTPS (sauf en développement local).
- **Tu veux transférer ta partie** : utilise **Réglages → Exporter** sur l’ancien appareil, puis colle le code dans **Réglages → Importer** sur le nouveau.
