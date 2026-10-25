'use strict';

const calc = {
  bps: 0,                          // bambous par seconde (bonus temporaires inclus)
  base: 0,                         // bambous par seconde (hors bonus temporaires)
  click: 0,                        // valeur d'un clic
  mult: 1,                         // multiplicateur affiché
  mulBase: 1,                      // multiplicateur global permanent
  costMult: 1,                     // réduction du coût des bâtiments
  unit: BUILDINGS.map(() => 0)     // production d'un exemplaire de chaque bâtiment
};

function recalc() {
  let clickMult = 1;                           // multiplicateur de clic
  let clickPct = 0;                            // part de la production ajoutée au clic
  let globalMult = 1;                          // multiplicateur de production globale
  const buildingMult = BUILDINGS.map(() => 1); // multiplicateur par bâtiment

  // Améliorations achetées
  for (const id in state.u) {
    const up = UPGRADE_BY_ID[id];
    if (!up) continue;
    const level = state.u[id] === true ? 1 : state.u[id];
    if (up.type === 'click')     clickMult *= Math.pow(1.5, level);
    else if (up.type === 'pct')  clickPct += up.value * level;
    else if (up.type === 'glob') globalMult *= Math.pow(up.value, level);
    else if (up.type === 'b')    buildingMult[up.building] *= Math.pow(1.5, level);
  }

  // Achats de jade
  if (state.pu.click) clickMult *= 2;
  if (state.pu.prod)  globalMult *= 1.25;
  if (state.pu.prod2) globalMult *= 1.5;
  calc.costMult = state.pu.cost ? 0.95 : 1;

  // Bonus lié au jade
  const jadeMult = 1 + 0.02 * state.jadeTotal;
  calc.mulBase = globalMult * jadeMult * Math.pow(2, state.paid.multiplierCount);

  // Bonus temporaires (frénésies)
  let prodBuff = 1;
  let clickBuff = 1;
  for (const buff of buffs) {
    if (buff.kind === 'prod') prodBuff *= buff.mult;
    else clickBuff *= buff.mult;
  }

  // Production
  let base = 0;
  BUILDINGS.forEach((building, i) => {
    calc.unit[i] = building.cps * buildingMult[i] * calc.mulBase;
    base += state.b[i] * calc.unit[i];
  });
  calc.base = base;
  calc.bps = base * prodBuff;

  // Clic
  calc.click = (clickMult + clickPct * calc.bps) * jadeMult * clickBuff;
  calc.mult = calc.mulBase * prodBuff;
}

/** Ajoute des bambous (banque, cycle en cours, total). */
function gain(amount) {
  state.bamboo += amount;
  state.run += amount;
  state.all += amount;
}

/** Jade total auquel le joueur a droit d'après ses bambous récoltés. */
function prestigePotential() {
  return Math.floor(Math.cbrt(state.all / 1e10));
}

/** Jade que rapporterait une réincarnation maintenant. */
function prestigeGain() {
  return Math.max(0, prestigePotential() - state.jadeTotal);
}
