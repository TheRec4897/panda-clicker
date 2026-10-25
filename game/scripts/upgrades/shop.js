'use strict';

function buyUpgrade(id) {
  const up = UPGRADE_BY_ID[id];
  if (!up || state.u[id] || state.bamboo < up.cost) { beep(180, 0.08, 0.05); return; }

  state.bamboo -= up.cost;
  state.u[id] = 1;
  state.upgradesBought++;
  recalc();
  beep(780, 0.1, 0.05);
  upgradesSignature = '';
  updateAll();
}

function upgradeLevel(id) {
  return state.u[id] === true ? 1 : (state.u[id] || 0);
}

function upgradeLevelCost(up, level) {
  return Math.ceil(up.cost * Math.pow(2.5, level));
}

function upgradeSaleValue(up, level) {
  let invested = 0;
  for (let i = 0; i < level; i++) invested += upgradeLevelCost(up, i);
  return Math.floor(invested * 0.75);
}

function improveUpgrade(id) {
  const up = UPGRADE_BY_ID[id];
  const level = upgradeLevel(id);
  const cost = up && upgradeLevelCost(up, level);
  if (!up || !level || !isFinite(cost) || state.bamboo < cost) {
    beep(180, 0.08, 0.05);
    return;
  }

  state.bamboo -= cost;
  state.u[id] = level + 1;
  state.upgradesBought++;
  recalc();
  beep(780, 0.1, 0.05);
  upgradesSignature = '';
  updateAll();
}

function sellUpgrade(id) {
  const up = UPGRADE_BY_ID[id];
  const level = upgradeLevel(id);
  if (!up || !level) { beep(180, 0.08, 0.05); return; }

  const refund = upgradeSaleValue(up, level);
  if (!isFinite(refund)) { beep(180, 0.08, 0.05); return; }

  state.bamboo += refund;
  delete state.u[id];
  recalc();
  upgradesSignature = '';
  toast(up.name + ' vendue : +' + fmt(refund) + ' bambous.');
  updateAll();
}
