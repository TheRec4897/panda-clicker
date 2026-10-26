'use strict';

/* ========================================================================
   6. Achats
   ======================================================================== */

let buyMode = '1'; // '1', '10', '100' ou 'max'

/** Coût d'achat de n exemplaires du bâtiment i. */
function buildingCost(i, n) {
  const first = BUILDINGS[i].base * Math.pow(COST_GROWTH, state.b[i]);
  const series = (Math.pow(COST_GROWTH, n) - 1) / (COST_GROWTH - 1);
  return Math.ceil(first * series * calc.costMult);
}

/** Nombre maximum d'exemplaires du bâtiment i que l'on peut s'offrir. */
function maxAffordable(i) {
  const firstCost = BUILDINGS[i].base * Math.pow(COST_GROWTH, state.b[i]) * calc.costMult;
  const n = Math.log(1 + state.bamboo * (COST_GROWTH - 1) / firstCost) / Math.log(COST_GROWTH);
  return Math.max(0, Math.floor(n));
}

/** Quantité visée par le mode d'achat courant. */
function buyQuantity(i) {
  return buyMode === 'max' ? Math.max(1, maxAffordable(i)) : +buyMode;
}

function buyBuilding(i) {
  let n = buyQuantity(i);
  let cost = buildingCost(i, n);

  // Si le lot est trop cher, on réduit la quantité
  while (n > 1 && cost > state.bamboo) {
    n--;
    cost = buildingCost(i, n);
  }

  if (cost > state.bamboo) { beep(180, 0.08, 0.05); return; }

  state.bamboo -= cost;
  state.b[i] += n;
  recalc();
  beep(660, 0.08, 0.05);
  updateAll();
}

function buyJadeUpgrade(id) {
  const up = JADE_UPGRADES.find((x) => x.id === id);
  if (!up || state.pu[id] || state.jade < up.cost) { beep(180, 0.08, 0.05); return; }

  state.jade -= up.cost;
  state.pu[id] = true;
  if (id === 'babies') state.b[0] += 1000;
  recalc();
  beep(880, 0.12, 0.05);
  renderJadeTab();
  updateAll();
}

/** Une amélioration est visible quand on s'en approche ou qu'on a assez de bâtiments. */
function isUpgradeUnlocked(up) {
  if (up.type === 'b' || up.type === 'bClick') return state.b[up.building] >= up.needed;
  return state.all >= up.cost * 0.1 || state.bamboo >= up.cost * 0.5;
}