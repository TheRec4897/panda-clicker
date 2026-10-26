'use strict';

/* ----- Améliorations permanentes de bambou -----
   Types :
     click → clics ×1,5
     pct   → un % de la production par seconde est ajouté à chaque clic
     glob  → multiplicateur de production globale
     b      → multiplicateur de production d'un bâtiment
     bClick → multiplicateur des clics automatiques d'un bâtiment
*/
const UPGRADES = [];
const MAX_UPGRADE_LEVEL = 10;

// Améliorations de clic : coût, multiplicateur par niveau, nom
[
  [1e3,   1.33, 'Pattes agiles'],
  [1e5,   1.66,   'Pattes de velours'],
  [1e7,   2, 'Griffes de jade'],
  [1e9,   2.5,   'Poigne de maître'],
  [5e11,  3,   'Coups de patte célestes'],
  [1e14,  4,   'Mains de panda géant'],
  [5e16,  5, 'Toucher du dragon'],
  [1e19,  10,  'Clic quantique']
].forEach(([cost, value, name], k) => {
  UPGRADES.push({
    id: 'c' + k, type: 'click', value, name, cost,
    desc: 'Les clics rapportent ×' + String(value).replace('.', ',') + ' par niveau.'
  });
});

// Améliorations « doigts de fée » : coût, part de la production, nom
[
  [5e5,  0.01, 'Doigts de fée'],
  [5e7,  0.02, 'Doigts de fée II'],
  [5e9,  0.03, 'Doigts de fée III'],
  [5e11, 0.04, 'Doigts de fée IV'],
  [5e13, 0.05, 'Doigts de fée V']
].forEach(([cost, value, name], k) => {
  UPGRADES.push({
    id: 'p' + k, type: 'pct', value, name, cost,
    desc: 'Chaque clic rapporte en plus ' + Math.round(value * 100) + ' % de ta production par seconde.'
  });
});

// Améliorations de production globale : coût, multiplicateur, nom
[
  [5e4,  1.1, 'Rosée du matin'],
  [5e6,  1.25, 'Soleil de printemps'],
  [5e8,  1.5,  'Terre fertile'],
  [5e10, 1.75,  'Engrais enchanté'],
  [5e12, 2, 'Lune de jade'],
  [5e14, 2.5, 'Brume mystique'],
  [5e16, 3,  'Souffle du dragon'],
  [5e19, 5,  'Étoiles filantes']
].forEach(([cost, value, name], k) => {
  UPGRADES.push({
    id: 'g' + k, type: 'glob', value, name, cost,
    desc: 'Production globale ×' + String(value).replace('.', ',')
  });
});

// Améliorations par bâtiment : 6 paliers par bâtiment
const TIER_NEEDED = [10, 25, 50, 100, 200, 500];                // bâtiments possédés requis
const TIER_COST_MULT = [25, 250, 2500, 25000, 250000, 2500000]; // multiple du coût de base
const TIER_NAMES = ['Affûtage', 'Cadence', 'Rendement', 'Maîtrise', 'Légende', 'Éternité'];
const TIER_PRODUCTION_MULT = [1.5, 2, 3, 4, 5, 10];

BUILDINGS.forEach((building, i) => {
  TIER_NEEDED.forEach((needed, tier) => {
    UPGRADES.push({
      id: 'b' + i + '_' + tier,
      type: building.clicksPerSecond ? 'bClick' : 'b',
      value: TIER_PRODUCTION_MULT[tier],
      building: i,
      needed,
      name: building.name + ' · ' + TIER_NAMES[tier],
      desc: (building.clicksPerSecond
        ? 'Clics automatiques de ce bâtiment ×'
        : 'Production de ce bâtiment ×') + String(TIER_PRODUCTION_MULT[tier]).replace('.', ',') + ' (dès ' + needed + ' possédé' + (needed > 1 ? 's' : '') + ').',
      cost: building.base * TIER_COST_MULT[tier]
    });
  });
});

// Accès rapide par identifiant
const UPGRADE_BY_ID = {};
UPGRADES.forEach((u) => { UPGRADE_BY_ID[u.id] = u; });