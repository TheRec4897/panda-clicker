'use strict';

/* ========================================================================
   11. Notifications, son, bandeau d'actualités
   ======================================================================== */

function toast(text) {
  const box = $('#toasts');
  while (box.children.length >= MAX_TOASTS) box.firstChild.remove();

  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  box.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/** Cadre « Succès débloqué » en bas à gauche de l'écran. */
function showAchievementToast(name, legendary) {
  const box = $('#achToasts');
  while (box.children.length >= MAX_ACHIEVEMENT_TOASTS) box.firstChild.remove();

  const el = document.createElement('div');
  el.className = 'ach-toast' + (legendary ? ' legendary' : '');

  const icon = document.createElement('div');
  icon.className = 'ach-toast-icon';
  icon.textContent = '★';
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('div');
  text.className = 'ach-toast-text';
  const label = document.createElement('span');
  label.textContent = legendary ? 'Succès légendaire débloqué' : 'Succès débloqué';
  const title = document.createElement('b');
  title.textContent = name;
  text.append(label, title);

  el.append(icon, text);
  box.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/**
 * Petit jingle ascendant (3 notes), joué quand un succès est débloqué.
 * Pour un succès légendaire, il se prolonge de trois notes plus aiguës.
 */
function playAchievementSound(legendary) {
  beep(659, 0.12, 0.07, 0,    false); // mi
  beep(880, 0.12, 0.07, 0.10, false); // la
  beep(1319, 0.28, 0.07, 0.20, false); // mi aigu

  if (legendary) {
    beep(1047, 0.12, 0.07, 0.55, false); // do
    beep(1319, 0.12, 0.07, 0.65, false); // mi
    beep(1760, 0.5,  0.08, 0.75, false); // la aigu
  }
}

let audioContext;

/**
 * Petit bip synthétique (uniquement si l'option « Effets sonores » est active).
 * @param {number}  frequency fréquence en Hz
 * @param {number}  duration  durée en secondes
 * @param {number}  volume    volume (0 à 1)
 * @param {number}  delay     délai avant le son, en secondes (pour enchaîner des notes)
 * @param {boolean} varied    légère variation aléatoire de la hauteur (true par défaut)
 */
function beep(frequency, duration, volume, delay = 0, varied = true) {
  if (!state.opt.sound) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const t = audioContext.currentTime + delay;

    oscillator.type = 'triangle';
    oscillator.frequency.value = varied ? frequency * (0.92 + Math.random() * 0.16) : frequency;
    gainNode.gain.setValueAtTime(volume, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(t);
    oscillator.stop(t + duration);
  } catch (e) { /* audio indisponible */ }
}

const ticker = $('#ticker');

/** Affiche une nouvelle actualité (fondu sortant puis entrant). */
function showNews() {
  const pool = NEWS.map((fn) => fn()).filter(Boolean);
  ticker.classList.add('out');
  setTimeout(() => {
    ticker.textContent = pool[Math.floor(Math.random() * pool.length)];
    ticker.classList.remove('out');
  }, 500);
}


