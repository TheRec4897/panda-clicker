'use strict';

function addBuff(id, name, kind, mult, seconds) {
  seconds *= state.pu.g2 ? 1.25 : 1;
  buffs = buffs.filter((b) => b.id !== id);
  buffs.push({ id, name, kind, mult, until: Date.now() + seconds * 1000 });
  recalc();
}

/** Effet d'un panda doré : 50 % frénésie de production, 40 % chance, 10 % frénésie de clics. */
