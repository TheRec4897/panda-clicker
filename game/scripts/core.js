'use strict';

const SAVE_KEY = 'panda-clicker-v1';

const TICK_MS = 100;            // fréquence de la boucle de jeu
const AUTOSAVE_MS = 15000;      // sauvegarde automatique
const NEWS_MS = 14000;          // rotation du bandeau d'actualités
const MAX_TICK_SECONDS = 43200; // production plafonnée à 12 h par tick
const COST_GROWTH = 1.17;       // hausse du coût par bâtiment acheté
const MAX_POPUPS = 24;          // nombre max de "+N" simultanés à l'écran
const MAX_TOASTS = 3;
const MAX_ACHIEVEMENT_TOASTS = 4; // cadres de succès affichés en même temps

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const rand = (min, max) => min + Math.random() * (max - min);


/* ========================================================================
   2. Formatage des nombres et du temps
   ======================================================================== */

// Suffixes : milliers (vide), millions, milliards, billions, ...
const SUFFIXES = ['', '', 'M', 'Md', 'Bn', 'Bd', 'Tn', 'Td', 'Qn', 'Qd', 'Sx', 'Sd'];

let useScientific = false;

/**
 * Formate un nombre pour l'affichage.
 * @param {number}  n       valeur à afficher
 * @param {boolean} decimal afficher une décimale sous 100 (pour les taux)
 */
function fmt(n, decimal) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n, decimal);

  // Petits nombres
  if (n < 1e3) {
    if (decimal && n < 100) {
      if (n === 0) return '0';
      return (Math.floor(n * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    }
    return Math.floor(n).toLocaleString('fr-FR');
  }

  // Notation scientifique (option)
  if (useScientific) {
    const exp = Math.floor(Math.log10(n));
    return (n / Math.pow(10, exp)).toFixed(2).replace('.', ',') + 'e' + exp;
  }

  // Milliers : espaces séparateurs
  if (n < 1e6) return Math.floor(n).toLocaleString('fr-FR');

  // Millions et plus : suffixes
  const group = Math.floor(Math.log10(n) / 3);
  if (group >= SUFFIXES.length) {
    const exp = Math.floor(Math.log10(n));
    return (n / Math.pow(10, exp)).toFixed(2).replace('.', ',') + 'e' + exp;
  }
  const value = n / Math.pow(10, 3 * group);
  const digits = value < 10 ? 3 : value < 100 ? 2 : 1;
  return value.toFixed(digits).replace('.', ',') + ' ' + SUFFIXES[group];
}

/** Formate une durée en secondes : « 2 j 3 h 5 min » */
function fmtTime(totalSeconds) {
  const s = Math.floor(totalSeconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  return (days ? days + ' j ' : '')
       + (hours ? hours + ' h ' : '')
       + (minutes ? minutes + ' min ' : '')
       + (!days && !hours ? seconds + ' s' : '');
}
