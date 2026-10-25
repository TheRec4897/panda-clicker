'use strict';

/* ========================================================================
   10. Succès et déblocages
   ======================================================================== */

/**
 * Vérifie les succès, les accessoires et les améliorations disponibles.
 * @param {boolean} silent pas de notification (chargement, réincarnation)
 */
function checkUnlocks(silent) {
  let achievementsChanged = false;
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!state.a[achievement.id] && achievement.test()) {
      state.a[achievement.id] = true;
      achievementsChanged = true;
      if (!silent) newlyUnlocked.push(achievement);
    }
  }

  // Un seul jingle, même si plusieurs succès tombent en même temps
  if (newlyUnlocked.length) {
    playAchievementSound(newlyUnlocked.some((a) => a.legendary));
    newlyUnlocked.forEach((a) => showAchievementToast(a.name, a.legendary));
  }

  for (const accessory of ACCESSORIES) {
    if (!state.accU[accessory.id] && accessory.test()) {
      state.accU[accessory.id] = true;
      state.eq[accessory.id] = true;
      applyAccessories();
      if (!silent) toast('Nouvel accessoire : ' + accessory.name);
      if (currentTab === 'opt') renderOptionsTab();
    }
  }
  if (state.paid.cosmetics.includes('sakura')) {
    state.accU.sakura = true;
    if (state.eq.sakura === undefined) state.eq.sakura = true;
  }

  if (achievementsChanged) {
    recalc();
    if (currentTab === 'ach') renderAchievementsTab();
  }

  // Nouvelles améliorations disponibles ?
  const available = UPGRADES.filter((u) => !state.u[u.id] && isUpgradeUnlocked(u));
  const signature = available.sort((a, b) => a.cost - b.cost).map((u) => u.id).join(',')
                  + '|' + UPGRADES.filter((u) => upgradeLevel(u.id))
                    .map((u) => u.id + ':' + upgradeLevel(u.id)).join(',');

  if (signature !== upgradesSignature) {
    if (currentTab === 'up') renderUpgradesTab();
    else upgradesSignature = signature;
  }
  $('#upN').textContent = available.filter((u) => u.cost <= state.bamboo).length || '';
}

/** Affiche ou masque les accessoires sur le dessin du panda. */
function applyAccessories() {
  ACCESSORIES.forEach((acc) => {
    const group = $('#acc-' + acc.id);
    if (group) {
      group.setAttribute('display', state.accU[acc.id] && state.eq[acc.id] ? 'inline' : 'none');
    }
  });
}

