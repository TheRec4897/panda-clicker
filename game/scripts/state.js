'use strict';

/* ========================================================================
   4. État du jeu et sauvegarde

   Clés de l'état (conservées telles quelles pour rester compatible
   avec les sauvegardes existantes) :
     bamboo      bambous en banque          run        récoltés ce cycle
     all         récoltés au total          clicks     nombre de clics
     golden      pandas dorés attrapés      b          bâtiments possédés
     u           améliorations achetées     a          succès obtenus
     jade        jade disponible            jadeTotal  jade gagné au total
     pu          achats de jade             asc        nombre de réincarnations
     played      temps de jeu (s)           seen       plus haut bâtiment découvert
     opt         options                    accU/eq    accessoires débloqués / équipés
     paid        achats premium confirmés par le serveur
   ======================================================================== */

function defaultState() {
  return {
    v: 1,
    bamboo: 0, run: 0, all: 0,
    clicks: 0, golden: 0,
    b: BUILDINGS.map(() => 0),
    u: {}, upgradesBought: 0, a: {},
    jade: 0, jadeTotal: 0, pu: {}, asc: 0,
    t0: Date.now(), runStart: Date.now(), last: Date.now(),
    played: 0, seen: 0,
    opt: { sound: true, sci: false, leaves: true },
    accU: {}, eq: {},
    paid: { jadeGranted: 0, autoClicks: 0, multiplierCount: 0, cosmetics: [] }
  };
}

/** Fusionne une sauvegarde (éventuellement incomplète ou corrompue) avec l'état par défaut. */
function mergeState(saved) {
  const merged = Object.assign(defaultState(), saved || {});

  merged.opt = Object.assign(defaultState().opt, (saved && saved.opt) || {});
  merged.b = BUILDINGS.map((_, i) => Math.max(0, +(saved && saved.b && saved.b[i]) || 0));
  delete merged.skin;

  ['u', 'a', 'pu', 'accU', 'eq'].forEach((key) => {
    if (!merged[key] || typeof merged[key] !== 'object') merged[key] = {};
  });
  const paid = saved && saved.paid && typeof saved.paid === 'object' ? saved.paid : {};
  merged.paid = {
    jadeGranted: Math.max(0, Math.floor(Number(paid.jadeGranted) || 0)),
    autoClicks: Math.min(10, Math.max(0, Math.floor(Number(paid.autoClicks) || 0))),
    multiplierCount: Math.min(1, Math.max(0, Math.floor(Number(paid.multiplierCount) || 0))),
    cosmetics: Array.isArray(paid.cosmetics)
      ? paid.cosmetics.filter((id) => typeof id === 'string' && /^[a-z0-9-]{1,60}$/.test(id))
      : []
  };
  Object.keys(merged.u).forEach((id) => {
    const level = merged.u[id] === true ? 1 : Math.floor(+merged.u[id]);
    if (UPGRADE_BY_ID[id] && level > 0 && isFinite(level)) merged.u[id] = level;
    else delete merged.u[id];
  });
  ['bamboo', 'run', 'all', 'clicks', 'golden', 'jade', 'jadeTotal', 'asc', 'played', 'seen'].forEach((key) => {
    if (!isFinite(merged[key])) merged[key] = 0;
  });
  if (!saved || !isFinite(+saved.upgradesBought) || +saved.upgradesBought < 0) {
    merged.upgradesBought = Object.keys(merged.u).length;
  } else merged.upgradesBought = Math.floor(+saved.upgradesBought);

  return merged;
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return mergeState(JSON.parse(raw));
  } catch (e) { /* stockage indisponible ou sauvegarde illisible */ }
  return defaultState();
}

// Passe à true pendant une réinitialisation, pour qu'aucune sauvegarde
// automatique (fermeture de page, minuteur…) ne réécrive l'ancienne partie.
let isResetting = false;

function saveState() {
  if (isResetting) return;
  state.last = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { /* stockage indisponible */ }
}

let state = loadState();


/* ========================================================================
   5. Calculs de production

   `calc` contient les valeurs dérivées de l'état, recalculées par
   recalc() à chaque changement (achat, bonus, succès, ...).
   ======================================================================== */

let buffs = []; // bonus temporaires : { id, name, kind, mult, until }
