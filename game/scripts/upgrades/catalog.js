'use strict';

/* ----- Améliorations (réinitialisées à chaque réincarnation) -----
   Types :
     click → clics ×1,5
     pct   → un % de la production par seconde est ajouté à chaque clic
     glob  → multiplicateur de production globale
     b     → production d'un bâtiment ×1,5 (débloqué à partir d'un nombre possédé)
*/
const UPGRADES = [];

// Améliorations de clic : coût, nom
[
  [1e3,   'Pattes agiles'],
  [1e5,   'Pattes de velours'],
  [1e7,   'Griffes de jade'],
  [1e9,   'Poigne de maître'],
  [5e11,  'Coups de patte célestes'],
  [1e14,  'Mains de panda géant'],
  [5e16,  'Toucher du dragon'],
  [1e19,  'Clic quantique']
].forEach(([cost, name], k) => {
  UPGRADES.push({ id: 'c' + k, type: 'click', name, desc: 'Les clics rapportent ×1,5.', cost });
});

// Améliorations « doigts de fée » : coût, part de la production, nom
[
  [5e5,  0.01, 'Doigts de fée'],
  [5e7,  0.01, 'Doigts de fée II'],
  [5e9,  0.02, 'Doigts de fée III'],
  [5e11, 0.03, 'Doigts de fée IV'],
  [5e13, 0.05, 'Doigts de fée V']
].forEach(([cost, value, name], k) => {
  UPGRADES.push({
    id: 'p' + k, type: 'pct', value, name, cost,
    desc: 'Chaque clic rapporte en plus ' + Math.round(value * 100) + ' % de ta production par seconde.'
  });
});

// Améliorations de production globale : coût, multiplicateur, nom
[
  [5e4,  1.05, 'Rosée du matin'],
  [5e6,  1.05, 'Soleil de printemps'],
  [5e8,  1.1,  'Terre fertile'],
  [5e10, 1.1,  'Engrais enchanté'],
  [5e12, 1.15, 'Lune de jade'],
  [5e14, 1.15, 'Brume mystique'],
  [5e16, 1.2,  'Souffle du dragon'],
  [5e19, 1.2,  'Étoiles filantes']
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

BUILDINGS.forEach((building, i) => {
  TIER_NEEDED.forEach((needed, tier) => {
    UPGRADES.push({
      id: 'b' + i + '_' + tier,
      type: 'b',
      building: i,
      needed,
      name: building.name + ' · ' + TIER_NAMES[tier],
      desc: 'Production de ce bâtiment ×1,5 (dès ' + needed + ' possédé' + (needed > 1 ? 's' : '') + ').',
      cost: building.base * TIER_COST_MULT[tier]
    });
  });
});

// Accès rapide par identifiant
const UPGRADE_BY_ID = {};
UPGRADES.forEach((u) => { UPGRADE_BY_ID[u.id] = u; });


/* ----- Boutique de jade (achats permanents) ----- */
