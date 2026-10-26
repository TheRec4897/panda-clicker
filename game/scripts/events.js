'use strict';

/* ========================================================================
   13. Gestion des événements
   ======================================================================== */

let armTimeout = null;

/**
 * Bouton à double confirmation : le premier clic « arme » le bouton
 * (texte changé pendant 4 s), le second clic exécute l'action.
 */
function armButton(button, confirmLabel, action) {
  if (button.dataset.armed) {
    clearTimeout(armTimeout);
    delete button.dataset.armed;
    button.classList.remove('armed');
    button.textContent = button._originalLabel;
    action();
    return;
  }

  button._originalLabel = button.textContent;
  button.dataset.armed = '1';
  button.classList.add('armed');
  button.textContent = confirmLabel;

  armTimeout = setTimeout(() => {
    delete button.dataset.armed;
    button.classList.remove('armed');
    button.textContent = button._originalLabel;
  }, 4000);
}

/** Reconstruit toute l'interface après un import ou une remise à zéro. */
function rebuildAll() {
  useScientific = state.opt.sci;
  recalc();
  checkUnlocks(true);
  applyAccessories();
  upgradesSignature = '';
  setTab(currentTab);
  updateAll();
}

/**
 * Réinitialisation de la progression locale. Les achats premium confirmés
 * sont conservés et pourront être restaurés depuis le serveur.
 */
function resetGame() {
  isResetting = true;
  try {
    localStorage.removeItem(SAVE_KEY);
    const freshState = defaultState();
    freshState.paid = state.paid;
    if (state.paid.jadeGranted > 0) freshState.jade = state.jade;
    localStorage.setItem(SAVE_KEY, JSON.stringify(freshState));
  } catch (e) { /* stockage indisponible */ }
  location.reload();
}

/** Actions des boutons de l'onglet Réglages (attribut data-act). */
function handleAction(action, button) {
  const io = $('#io');

  switch (action) {
    case 'save':
      saveState();
      toast('Partie sauvegardée.');
      break;

    case 'export':
      saveState();
      io.value = btoa(JSON.stringify(state));
      io.select();
      break;

    case 'copy':
      saveState();
      io.value = btoa(JSON.stringify(state));
      io.select();
      try {
        navigator.clipboard.writeText(io.value).then(
          () => toast('Code copié.'),
          () => toast('Copie impossible : le code est sélectionné, utilise Ctrl+C.')
        );
      } catch (err) {
        toast('Copie impossible : le code est sélectionné, utilise Ctrl+C.');
      }
      break;

    case 'import':
      try {
        const data = JSON.parse(atob(io.value.trim()));
        if (typeof data !== 'object' || !data || !Array.isArray(data.b)) throw new Error('format');
        state = mergeState(data);
        buffs = [];
        saveState();
        rebuildAll();
        toast('Sauvegarde importée.');
      } catch (err) {
        toast('Code invalide. Vérifie que tu as collé le code en entier.');
      }
      break;

    case 'wipe':
      armButton(button, 'Confirmer la réinitialisation ?', resetGame);
      break;

    case 'storeSync':
      syncPaidEntitlements(false);
      break;
  }
}

// Délégation d'événements : un seul écouteur pour tous les boutons
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-b],[data-u],[data-u-action],[data-pu],[data-tab],[data-mode],[data-act],[data-store-product]');
  if (!target) return;

  if (target.dataset.b !== undefined) {
    const i = +target.dataset.b;
    if (i <= state.seen) buyBuilding(i);
  } else if (target.dataset.uAction === 'improve') {
    improveUpgrade(target.dataset.u);
  } else if (target.dataset.uAction === 'sell') {
    sellUpgrade(target.dataset.u);
  } else if (target.dataset.u) {
    buyUpgrade(target.dataset.u);
  } else if (target.dataset.pu) {
    buyJadeUpgrade(target.dataset.pu);
  } else if (target.dataset.storeProduct) {
    buyPremiumProduct(target.dataset.storeProduct);
  } else if (target.dataset.tab) {
    setTab(target.dataset.tab);
  } else if (target.dataset.mode) {
    buyMode = target.dataset.mode;
    $$('#modes button').forEach((b) => b.setAttribute('aria-pressed', String(b === target)));
    updateHUD();
  } else if (target.dataset.act) {
    handleAction(target.dataset.act, target);
  }
});

// Cases à cocher (accessoires et options)
document.addEventListener('change', (e) => {
  const target = e.target;

  if (target.dataset && target.dataset.eq) {
    state.eq[target.dataset.eq] = target.checked;
    applyAccessories();
  } else if (target.id === 'o-sound') {
    state.opt.sound = target.checked;
  } else if (target.id === 'o-sci') {
    state.opt.sci = target.checked;
    useScientific = target.checked;
    updateAll();
  } else if (target.id === 'o-leaves') {
    state.opt.leaves = target.checked;
  }
});
