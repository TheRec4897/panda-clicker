'use strict';

const JADE_UPGRADES = [
  { id: 'g1',      name: 'Œil de lynx',            cost: 1,  desc: 'Le panda doré apparaît 25 % plus souvent.' },
  { id: 'g2',      name: 'Aura persistante',       cost: 2,  desc: 'Le panda doré reste 50 % plus longtemps et ses frénésies durent 25 % de plus.' },
  { id: 'off',     name: 'Sommeil productif',      cost: 3,  desc: 'Hors ligne, les pandas travaillent à 50 % (8 h maximum).' },
  { id: 'click',   name: 'Patte de jade',          cost: 4,  desc: 'Tes clics rapportent 5 fois plus.' },
  { id: 'babies',  name: 'Nurserie céleste',       cost: 5,  desc: 'À l’achat, reçoit immédiatement 1 000 bébés pandas.' },
  { id: 'prod',    name: 'Bénédiction de la forêt', cost: 6, desc: 'Production globale ×5.' },
  { id: 'cost',    name: 'Marchandage zen',        cost: 7, desc: 'Les bâtiments coûtent 15% moins cher.' },
  { id: 'lucky',   name: 'Pluie dorée',            cost: 8, desc: 'Les gains « chance » du panda doré sont doublés.' },
  { id: 'prod2',   name: 'Âge d’or',               cost: 9, desc: 'Production globale ×10.' },
  { id: 'click_bamboo', name: 'Patte du destin', cost: 50, desc: 'Chaque clic rapporte 1 000 000 000 000 bambous supplémentaires.' }
];


/* ----- Succès -----
   Chaque succès : { id, name, desc, test() } — test() renvoie true quand il est atteint. */
const ACHIEVEMENTS = [];
// `extra` : options facultatives, ex. { hidden: true, legendary: true }
const addAchievement = (id, name, desc, test, extra) =>
  ACHIEVEMENTS.push(Object.assign({ id, name, desc, test }, extra));

// Total de bambous récoltés
[
  [1,    'Première pousse'],          [1e3,  'Petit déjeuner'],
  [1e4,  'Garde-manger'],             [1e5,  'Stock de la semaine'],
  [1e6,  'Millionnaire vert'],        [1e7,  'Forêt privée'],
  [1e8,  'Bambouseraie nationale'],   [1e9,  'Milliardaire du feuillage'],
  [1e10, 'Mer de verdure'],           [1e11, 'Océan de pousses'],
  [1e12, 'Continent vert'],           [1e13, 'Planète bambou'],
  [1e15, 'Système solaire vert'],     [1e18, 'Galaxie de chlorophylle'],
  [1e21, 'Univers bambou']
].forEach(([x, name]) => {
  addAchievement('t' + x, name, 'Récolter ' + fmt(x) + ' bambous au total.', () => state.all >= x);
});

// Nombre de clics
[
  [1,   'Premier câlin'],
  [100, 'Gratouilles'],
  [1e3, 'Chatouilles pro'],
  [1e4, 'Doigts d’acier'],
  [1e5, 'Tendinite légendaire']
].forEach(([x, name]) => {
  addAchievement('k' + x, name, 'Cliquer ' + fmt(x) + ' fois sur le panda.', () => state.clicks >= x);
});

// Production par seconde
[
  [1,    'Ça pousse'],             [10,   'Un filet vert'],
  [100,  'Ruisseau de feuilles'],  [1e3,  'Rivière verte'],
  [1e4,  'Torrent de bambou'],     [1e5,  'Cascade luxuriante'],
  [1e6,  'Fleuve de jade'],        [1e7,  'Delta de chlorophylle'],
  [1e8,  'Tsunami végétal'],       [1e9,  'Déluge de bambou'],
  [1e10, 'Big Bamboo'],            [1e12, 'Singularité verte']
].forEach(([x, name]) => {
  addAchievement('s' + x, name, 'Atteindre ' + fmt(x) + ' bambous par seconde.', () => calc.bps >= x);
});

// Pandas dorés attrapés
[
  [1,   'Éclat doré'],
  [5,   'Chasseur d’or'],
  [25,  'Panda en or'],
  [50,  'Aimant à chance'],
  [100, 'Roi de la chance']
].forEach(([x, name]) => {
  addAchievement('g' + x, name,
    'Attraper ' + x + ' panda' + (x > 1 ? 's' : '') + ' doré' + (x > 1 ? 's' : '') + '.',
    () => state.golden >= x);
});

// Jade gagné
[
  [1,  'Éclat de jade'],
  [5,  'Trésor de jade'],
  [10, 'Maître du jade']
].forEach(([x, name]) => {
  addAchievement('j' + x, name, 'Gagner ' + x + ' jade au total.', () => state.jadeTotal >= x);
});

// Améliorations achetées
[
  [1,   'Premier achat'],
  [10,  'Collectionneur'],
  [25,  'Grand chantier'],
  [50,  'Bibliothèque verte'],
  [100, 'Tout est amélioré']
].forEach(([x, name]) => {
  addAchievement('u' + x, name,
    'Acheter ' + x + ' amélioration' + (x > 1 ? 's' : '') + '.',
    () => state.upgradesBought >= x);
});

// Temps de jeu (en secondes)
[
  [3600,  'Une heure avec les pandas'],
  [36000, 'Gardien de la forêt'],
  [86400, 'Panda éternel']
].forEach(([x, name]) => {
  addAchievement('h' + x, name, 'Jouer ' + fmtTime(x) + '.', () => state.played >= x);
});

// Possession de chaque bâtiment
const OWNERSHIP_TIERS = ['Adoption', 'Habitué', 'Spécialiste', 'Légende'];
BUILDINGS.forEach((building, i) => {
  [1, 10, 50, 100].forEach((x, tier) => {
    addAchievement('b' + i + '_' + x,
      building.name + ' · ' + OWNERSHIP_TIERS[tier],
      'Posséder ' + x + ' × ' + building.name + '.',
      () => state.b[i] >= x);
  });
});

// Succès caché : atteindre le niveau maximal de toutes les améliorations.
addAchievement(
  'all_upgrades_maxed',
  'Perfection absolue',
  'Atteindre le niveau 10 de toutes les améliorations.',
  () => UPGRADES.every((up) => {
    const level = state.u[up.id] === true ? 1 : Number(state.u[up.id]) || 0;
    return level >= MAX_UPGRADE_LEVEL;
  }),
  { hidden: true }
);

// Succès caché et légendaire : acheter la Patte du destin.
addAchievement(
  'jade_click_bamboo',
  'Le clic absolu',
  'Posséder la Patte du destin.',
  () => !!state.pu.click_bamboo,
  { hidden: true, legendary: true }
);

// Succès caché et légendaire : obtenir tous les autres succès.
// À garder en DERNIER dans la liste : ainsi, il se débloque dans la même
// vérification que le tout dernier succès normal.
addAchievement(
  'legend',
  'Panda légendaire',
  'Obtenir tous les succès.',
  () => ACHIEVEMENTS.every((a) => a.id === 'legend' || state.a[a.id]),
  { hidden: true, legendary: true }
);


/* ----- Accessoires du panda (débloqués par conditions) ----- */
const ACCESSORIES = [
  { id: 'hat',     name: 'Chapeau de paille', condition: 'Récolter 10 000 bambous',              test: () => state.all >= 1e4 },
  { id: 'glasses', name: 'Lunettes de soleil', condition: 'Atteindre 1 000 bambous par seconde', test: () => calc.bps >= 1e3 },
  { id: 'bow',     name: 'Nœud papillon',      condition: 'Récolter 1 million de bambous',       test: () => state.all >= 1e6 },
  { id: 'crown',   name: 'Couronne de jade',   condition: 'Gagner 1 jade',                        test: () => state.jadeTotal >= 1 },
  { id: 'sakura',  name: 'Fleur de sakura',   condition: 'Boutique premium',                    test: () => false }
];

/* ----- Bandeau d'actualités : une fonction renvoie un texte, ou null si non applicable ----- */
const NEWS = [
  () => 'Un panda dort 12 heures par jour. Le tien n’en dort aucune.',
  () => 'Un panda géant mange jusqu’à 12 kg de bambou par jour.',
  () => 'Un soigneur demande une augmentation. Il est payé en bambou.',
  () => 'Les pandas roux proposent un partenariat. Refusé.',
  () => 'Quelqu’un a vu un panda faire une roulade. Les marchés s’envolent.',
  () => 'Ton panda te regarde. Il veut des tiges. Il en veut toujours.',
  () => 'Les analystes prévoient une hausse de la pousse de 300 %.',
  () => 'Un hibou propose de surveiller la forêt contre un salaire en glands.',
  () => state.b[0] >= 10   ? 'Tes bébés pandas ont formé un syndicat de la sieste.' : null,
  () => calc.bps > 1000    ? 'La forêt bruisse jusqu’à l’autre bout de la vallée.' : null,
  () => state.jadeTotal > 0 ? 'Le jade te va bien. Tu es le roi du bambou.' : null,
  () => state.b[6] > 0     ? 'Les moines affirment que le vrai bambou est dans notre cœur. Ils en demandent quand même.' : null,
  () => state.b[11] > 0    ? 'Un panda du futur te dit de ne pas arrêter de cliquer.' : null,
  () => state.golden > 0   ? 'Rumeur : un panda doré se cacherait dans la forêt.' : null
];