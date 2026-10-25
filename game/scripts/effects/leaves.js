'use strict';

/* ========================================================================
   12. Feuilles qui tombent (canvas)
   ======================================================================== */

const canvas = $('#leaves');
const ctx = canvas.getContext('2d');

let canvasWidth = 0;
let canvasHeight = 0;
let leaves = [];
let leafColor = '#4d9a45';

function readLeafColor() {
  leafColor = getComputedStyle(document.documentElement).getPropertyValue('--leaf').trim() || leafColor;
}

function resizeCanvas() {
  canvasWidth = canvas.width = innerWidth;
  canvasHeight = canvas.height = innerHeight;
  readLeafColor();
}

/** Crée une feuille (en haut de l'écran si `atTop`, sinon n'importe où). */
function createLeaf(atTop) {
  return {
    x: rand(0, canvasWidth),
    y: atTop ? rand(-40, -10) : rand(0, canvasHeight),
    vy: rand(18, 46),        // vitesse de chute
    vx: rand(-10, 10),       // dérive horizontale
    angle: rand(0, 6.28),
    spin: rand(-1.2, 1.2),   // vitesse de rotation
    size: rand(7, 15),
    phase: rand(0, 6.28)     // phase du balancement
  };
}

let lastLeafFrame = performance.now();

function leafLoop(now) {
  requestAnimationFrame(leafLoop);

  const dt = Math.min(0.05, (now - lastLeafFrame) / 1000);
  lastLeafFrame = now;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (prefersReducedMotion || !state.opt.leaves || document.hidden) return;

  // Plus on produit, plus il y a de feuilles
  const target = Math.min(46, 5 + Math.log10(calc.bps + 1) * 5);
  while (leaves.length < target && Math.random() < 0.2) leaves.push(createLeaf(true));

  ctx.fillStyle = leafColor;
  ctx.globalAlpha = 0.32;

  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i];
    leaf.phase += dt * 1.4;
    leaf.y += leaf.vy * dt;
    leaf.x += (leaf.vx + Math.sin(leaf.phase) * 22) * dt;
    leaf.angle += leaf.spin * dt;

    // Sortie de l'écran : on recycle ou on supprime la feuille
    if (leaf.y > canvasHeight + 20) {
      if (leaves.length > target) leaves.splice(i, 1);
      else leaves[i] = createLeaf(true);
      continue;
    }

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);
    ctx.beginPath();
    ctx.moveTo(0, -leaf.size);
    ctx.quadraticCurveTo(leaf.size * 0.55, 0, 0, leaf.size);
    ctx.quadraticCurveTo(-leaf.size * 0.55, 0, 0, -leaf.size);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(leafLoop);
setInterval(readLeafColor, 3000); // suit le changement de thème clair/sombre


