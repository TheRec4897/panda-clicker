'use strict';

/* ========================================================================
   14. Boucle de jeu et démarrage
   ======================================================================== */

let lastTickAt = Date.now();
let checkTimer = 0; // accumule le temps entre deux vérifications de succès

function tick() {
  const now = Date.now();
  const dt = (now - lastTickAt) / 1000;
  lastTickAt = now;
  if (dt <= 0) return;

  // Production et temps de jeu
  gain(calc.bps * Math.min(dt, MAX_TICK_SECONDS));
  if (state.paid.autoClicks > 0) {
    const autoClicks = state.paid.autoClicks * Math.min(dt, MAX_TICK_SECONDS);
    gain(calc.click * autoClicks);
    state.clicks += autoClicks;
  }
  state.played += dt;

  // Expiration des bonus temporaires
  if (buffs.length) {
    const before = buffs.length;
    buffs = buffs.filter((b) => b.until > now);
    if (buffs.length !== before) recalc();
  }

  // Apparition du panda doré
  if (!goldenEl && now >= goldenNextAt) spawnGolden();

  // Succès et déblocages : deux fois par seconde
  checkTimer += dt;
  if (checkTimer >= 0.5) {
    checkTimer = 0;
    checkUnlocks(false);
  }

  updateHUD();
}

/** Gains hors ligne depuis la dernière sauvegarde. */
function applyOfflineProgress() {
  const elapsed = (Date.now() - state.last) / 1000;
  const autoClickRate = calc.click * state.paid.autoClicks;
  if (elapsed <= 60 || (calc.bps <= 0 && autoClickRate <= 0)) return;

  const cap = state.pu.off ? 28800 : 7200;            // 8 h ou 2 h
  const efficiency = state.pu.off ? 0.5 : 0.25;       // 50 % ou 25 %
  const effectiveSeconds = Math.min(elapsed, cap) * efficiency;
  const earned = (calc.bps + autoClickRate) * effectiveSeconds;

  gain(earned);
  state.clicks += state.paid.autoClicks * effectiveSeconds;
  setTimeout(() => {
    toast('Pendant ton absence (' + fmtTime(elapsed) + '), les pandas ont récolté ' + fmt(earned) + ' bambous.');
  }, 600);
}

// Démarrage
useScientific = state.opt.sci;
recalc();
applyOfflineProgress();
lastTickAt = Date.now();
checkUnlocks(true);
applyAccessories();
showNews();
updateHUD();
syncPaidEntitlements(true);

setInterval(tick, TICK_MS);
setInterval(saveState, AUTOSAVE_MS);
setInterval(showNews, NEWS_MS);

// Sauvegarde quand l'onglet est masqué ou fermé
document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
addEventListener('pagehide', saveState);
