'use strict';

/* ========================================================================
   8. Clic sur le panda
   ======================================================================== */

const pandaButton = $('#panda');
const field = $('#field');
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Un clic sur le panda.
 * @param {number|null} x position du clic (écran), ou null pour centrer (clavier)
 * @param {number|null} y idem
 */
function doClick(x, y) {
  const value = calc.click;
  gain(value);
  state.clicks++;
  beep(420, 0.06, 0.04);

  // Petite animation d'écrasement
  if (!prefersReducedMotion && pandaButton.animate) {
    pandaButton.firstElementChild.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(.95,1.04)' }, { transform: 'scale(1)' }],
      { duration: 130 }
    );
  }

  // Gain flottant « +N »
  if (field.querySelectorAll('.pop').length < MAX_POPUPS) {
    const rect = field.getBoundingClientRect();
    const pop = document.createElement('span');
    pop.className = 'pop';
    pop.textContent = '+' + fmt(value, true);
    pop.style.left = (x == null ? rect.width / 2 : x - rect.left) + 'px';
    pop.style.top = (y == null ? rect.height / 2 : y - rect.top - 14) + 'px';
    field.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove());
  }
}

pandaButton.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  doClick(e.clientX, e.clientY);
});

// Accessibilité clavier : Espace ou Entrée
pandaButton.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
    e.preventDefault();
    doClick(null, null);
  }
});

pandaButton.addEventListener('contextmenu', (e) => e.preventDefault());


