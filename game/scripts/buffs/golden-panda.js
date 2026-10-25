'use strict';

/* ========================================================================
   9. Panda doré et bonus temporaires
   ======================================================================== */

const GOLDEN_SVG =
  '<svg viewBox="0 0 100 100">' +
    '<circle cx="22" cy="24" r="15" fill="#8a5c08"/>' +
    '<circle cx="78" cy="24" r="15" fill="#8a5c08"/>' +
    '<ellipse cx="50" cy="54" rx="42" ry="38" fill="#ffd45a" stroke="#b27a0c" stroke-width="3"/>' +
    '<ellipse cx="33" cy="52" rx="10" ry="14" transform="rotate(25 33 52)" fill="#8a5c08"/>' +
    '<ellipse cx="67" cy="52" rx="10" ry="14" transform="rotate(-25 67 52)" fill="#8a5c08"/>' +
    '<circle cx="35" cy="50" r="3.5" fill="#fff"/>' +
    '<circle cx="65" cy="50" r="3.5" fill="#fff"/>' +
    '<ellipse cx="50" cy="64" rx="6" ry="4.2" fill="#3a2704"/>' +
    '<path d="M50 69v3q-6 6-12 1M50 72q6 6 12 1" fill="none" stroke="#3a2704" stroke-width="2" stroke-linecap="round"/>' +
  '</svg>';

let goldenEl = null;
let goldenNextAt = Date.now() + rand(50, 100) * 1000;

function scheduleNextGolden() {
  const delay = rand(120, 330) * 1000 * (state.pu.g1 ? 0.75 : 1);
  goldenNextAt = Date.now() + delay;
}

function spawnGolden() {
  if (goldenEl) return;

  const el = document.createElement('button');
  el.className = 'golden';
  el.setAttribute('aria-label', 'Panda doré ! Clique vite');
  el.style.left = rand(6, Math.max(10, (innerWidth - 110) / innerWidth * 100 - 2)) + 'vw';
  el.style.top = rand(12, Math.max(20, (innerHeight - 120) / innerHeight * 100 - 8)) + 'vh';
  el.innerHTML = GOLDEN_SVG;
  el.addEventListener('click', clickGolden);

  document.body.appendChild(el);
  goldenEl = el;

  // Disparaît tout seul au bout d'un moment
  el._timeout = setTimeout(removeGolden, 13000 * (state.pu.g2 ? 1.5 : 1));
}

function removeGolden() {
  if (!goldenEl) return;
  clearTimeout(goldenEl._timeout);
  goldenEl.remove();
  goldenEl = null;
  scheduleNextGolden();
}

/** Ajoute un bonus temporaire (remplace un bonus de même identifiant). */
function clickGolden() {
  state.golden++;
  removeGolden();
  beep(988, 0.18, 0.06);

  const roll = Math.random();

  if (roll <= 0.5) {
    activateBambooFrenzy();
  } else if (roll > 0.5 && roll <= 0.9) {
    activateLuckyBamboo();
  } else {
    activateClickFrenzy();
  }

  updateAll();
}

