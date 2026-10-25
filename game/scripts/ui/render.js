'use strict';

/* ========================================================================
   7. Rendu : tableau de bord (HUD) et onglets
   ======================================================================== */

// Lignes de bâtiments, créées une seule fois puis mises à jour
const buildingList = $('#bList');
buildingList.innerHTML = BUILDINGS.map((_, i) =>
  '<button class="item" data-b="' + i + '" hidden>' +
    '<span class="i-main">' +
      '<span class="i-name"></span>' +
      '<span class="i-desc"></span>' +
      '<span class="i-prod"></span>' +
    '</span>' +
    '<span class="i-side">' +
      '<span class="i-count"></span>' +
      '<span class="i-cost"></span>' +
    '</span>' +
  '</button>'
).join('');
const buildingRows = [...buildingList.children];

let currentTab = 'shop';
let upgradesSignature = ''; // sert à ne re-rendre l'onglet Améliorations que s'il change
let lastPresenceBambooCount = null;

/** Met à jour tout ce qui change en continu : compteurs, bâtiments, bonus. */
function updateHUD() {
  $('#bank').textContent = fmt(Math.floor(state.bamboo));
  const bambooCount = Math.floor(state.bamboo);
  if (window.discordPresence && bambooCount !== lastPresenceBambooCount) {
    window.discordPresence.updateBambooCount(bambooCount);
    lastPresenceBambooCount = bambooCount;
  }
  $('#bps').textContent = fmt(calc.bps, true);
  $('#perClick').textContent = fmt(calc.click, true);
  $('#mult').textContent = '×' + fmt(calc.mult, true);
  $('#jadeR').textContent = fmt(state.jade);

  updateBuildingRows();

  // Teinte « trop cher » des améliorations affichées
  $$('#p-up .item[data-u]').forEach((el) => {
    el.classList.toggle('poor', state.bamboo < +el.dataset.cost);
  });
  $$('#p-up [data-u-action="improve"]').forEach((el) => {
    el.disabled = state.bamboo < +el.dataset.cost;
  });
  $$('#p-jade .item[data-pu]').forEach((el) => {
    el.classList.toggle('poor', state.jade < +el.dataset.cost);
  });

  // Bonus temporaires
  const now = Date.now();
  $('#buffs').innerHTML = buffs
    .map((buff) => '<span class="buff">' + buff.name + ' · ' + Math.ceil((buff.until - now) / 1000) + ' s</span>')
    .join('');

  // Pastille de l'onglet Réincarnation
  const jadeGain = prestigeGain();
  $('#jadeN').textContent = jadeGain > 0 ? '+' + fmt(jadeGain) : '';

  if (currentTab === 'jade') updateJadeLive();
  if (currentTab === 'stats') renderStatsTab();
}

function updateBuildingRows() {
  BUILDINGS.forEach((building, i) => {
    const row = buildingRows[i];

    // Découverte progressive : un bâtiment apparaît quand on s'en approche
    if (state.b[i] > 0 || state.bamboo >= buildingCost(i, 1) * 0.8) {
      state.seen = Math.max(state.seen, i);
    }
    const visible = i <= state.seen + 1;
    row.hidden = !visible;
    if (!visible) return;

    const locked = i > state.seen; // visible mais pas encore découvert
    row.classList.toggle('locked', locked);

    const qty = locked ? 1 : buyQuantity(i);
    const cost = buildingCost(i, qty);

    const nameEl = row.querySelector('.i-name');
    const descEl = row.querySelector('.i-desc');
    const prodEl = row.querySelector('.i-prod');
    const countEl = row.querySelector('.i-count');
    const costEl = row.querySelector('.i-cost');

    nameEl.textContent = locked ? '???' : building.name;
    descEl.textContent = locked ? 'Continue de récolter pour le découvrir.' : building.desc;

    if (locked || state.b[i] === 0) {
      prodEl.textContent = locked ? '' : 'Produit ' + fmt(calc.unit[i], true) + ' par seconde chacun.';
    } else {
      const total = state.b[i] * calc.unit[i];
      const percent = calc.base > 0 ? Math.round(total / calc.base * 100) : 0;
      prodEl.textContent = fmt(calc.unit[i], true) + '/s chacun · total '
                         + fmt(total, true) + '/s (' + percent + ' % de la production)';
    }

    countEl.textContent = state.b[i] > 0 ? state.b[i] : '';
    costEl.textContent = (qty > 1 ? '×' + qty + ' · ' : '') + fmt(cost);
    row.classList.toggle('poor', cost > state.bamboo);
  });
}

function updateAll() {
  updateHUD();
  if (currentTab === 'up') renderUpgradesTab();
}

/* ----- Onglets ----- */

function setTab(tab) {
  currentTab = tab;

  $$('.tab').forEach((button) => {
    button.setAttribute('aria-selected', String(button.dataset.tab === tab));
  });
  ['shop', 'up', 'ach', 'jade', 'premium', 'stats', 'opt'].forEach((name) => {
    $('#p-' + name).hidden = name !== tab;
  });

  if (tab === 'up')    renderUpgradesTab();
  if (tab === 'ach')   renderAchievementsTab();
  if (tab === 'jade')  renderJadeTab();
  if (tab === 'premium') renderPremiumTab();
  if (tab === 'stats') renderStatsTab();
  if (tab === 'opt')   renderOptionsTab();

  updateHUD();
}

/* ----- Onglet Améliorations ----- */

function upgradeItemHTML(up) {
  return '<button class="item" data-u="' + up.id + '" data-cost="' + up.cost + '">' +
           '<span class="i-main">' +
             '<span class="i-name">' + up.name + '</span>' +
             '<span class="i-desc">' + up.desc + '</span>' +
           '</span>' +
           '<span class="i-side"><span class="i-cost">' + fmt(up.cost) + '</span></span>' +
         '</button>';
}

function ownedUpgradeHTML(up) {
  const level = upgradeLevel(up.id);
  const cost = upgradeLevelCost(up, level);
  const refund = upgradeSaleValue(up, level);
  return '<article class="upgrade-card">' +
           '<span class="i-main">' +
             '<span class="i-name">' + up.name + ' · Niveau ' + level + '</span>' +
             '<span class="i-desc">' + up.desc + '</span>' +
           '</span>' +
           '<span class="upgrade-actions">' +
             '<button class="btn primary upgrade-action" data-u-action="improve" data-u="' + up.id + '" data-cost="' + cost + '"' +
               (!isFinite(cost) || state.bamboo < cost ? ' disabled' : '') + '>Améliorer · ' + fmt(cost) + '</button>' +
             '<button class="btn warn upgrade-action" data-u-action="sell" data-u="' + up.id + '">Vendre · +' + fmt(refund) + '</button>' +
           '</span>' +
         '</article>';
}

function renderUpgradesTab() {
  const available = UPGRADES
    .filter((u) => !upgradeLevel(u.id) && isUpgradeUnlocked(u))
    .sort((a, b) => a.cost - b.cost);
  const owned = UPGRADES.filter((u) => upgradeLevel(u.id));

  upgradesSignature = available.map((u) => u.id).join(',') + '|'
    + owned.map((u) => u.id + ':' + upgradeLevel(u.id)).join(',');
  $('#upN').textContent = available.filter((u) => u.cost <= state.bamboo).length || '';

  const availableHTML = available.length
    ? '<div class="list">' + available.map(upgradeItemHTML).join('') + '</div>'
    : '<p class="note">Rien pour l’instant. De nouvelles améliorations apparaissent quand ta récolte grandit et quand tu possèdes plus de bâtiments.</p>';

  const ownedHTML = owned.length
    ? '<div class="list">' + owned.map(ownedUpgradeHTML).join('') + '</div>'
    : '<span class="note">Aucune.</span>';

  $('#p-up').innerHTML =
    '<h2>Disponibles</h2>' + availableHTML +
    '<h2>Acquises (' + owned.length + ' / ' + UPGRADES.length + ')</h2>' +
    ownedHTML;
}

/* ----- Onglet Succès ----- */

function renderAchievementsTab() {
  const count = Object.keys(state.a).length;

  $('#p-ach').innerHTML =
    '<p class="note"><b>' + count + ' / ' + ACHIEVEMENTS.length + '</b> succès débloqués.</p>' +
    '<div class="ach-grid">' +
      ACHIEVEMENTS.map((a) => {
        const unlocked = !!state.a[a.id];
        const concealed = a.hidden && !unlocked; // succès caché pas encore obtenu
        return '<div class="ach ' + (unlocked ? 'on' : 'off') + (a.legendary ? ' legendary' : '') + '">' +
                 '<b>' + (concealed ? '???' : a.name) + '</b>' +
                 '<span>' + (concealed ? 'Succès caché.' : a.desc) + '</span>' +
               '</div>';
      }).join('') +
    '</div>';
}

/* ----- Onglet Stats ----- */

function renderStatsTab() {
  const totalBuildings = state.b.reduce((sum, n) => sum + n, 0);
  const rows = [
    ['Bambous en banque',           fmt(state.bamboo)],
    ['Bambous récoltés ce cycle',   fmt(state.run)],
    ['Bambous récoltés au total',   fmt(state.all)],
    ['Production par seconde',      fmt(calc.bps, true)],
    ['Valeur d’un clic',            fmt(calc.click, true)],
    ['Clics sur le panda',          fmt(state.clicks)],
    ['Pandas dorés attrapés',       fmt(state.golden)],
    ['Bâtiments possédés',          fmt(totalBuildings)],
    ['Améliorations possédées',     Object.keys(state.u).length + ' / ' + UPGRADES.length],
    ['Clics automatiques par seconde', fmt(state.paid.autoClicks, true)],
    ['Multiplicateurs premium',     '×' + fmt(Math.pow(2, state.paid.multiplierCount), true)],
    ['Succès',                      Object.keys(state.a).length + ' / ' + ACHIEVEMENTS.length],
    ['Réincarnations',              state.asc],
    ['Jade gagné au total',         fmt(state.jadeTotal)],
    ['Temps de jeu',                fmtTime(state.played)],
    ['Durée de ce cycle',           fmtTime((Date.now() - state.runStart) / 1000)]
  ];

  $('#p-stats').innerHTML =
    '<table class="stat-table">' +
      rows.map((r) => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') +
    '</table>';
}

/* ----- Onglet Réincarnation ----- */

function renderJadeTab() {
  const shopHTML = JADE_UPGRADES.map((p) => {
    const owned = !!state.pu[p.id];
    return '<button class="item' + (owned ? ' owned' : '') + '" data-pu="' + p.id + '" data-cost="' + p.cost + '"' + (owned ? ' disabled' : '') + '>' +
             '<span class="i-main">' +
               '<span class="i-name">' + p.name + '</span>' +
               '<span class="i-desc">' + p.desc + '</span>' +
             '</span>' +
             '<span class="i-side"><span class="i-cost jade">' + (owned ? 'Acquis' : p.cost + ' jade') + '</span></span>' +
           '</button>';
  }).join('');

  $('#p-jade').innerHTML =
    '<h2>Réincarnation</h2>' +
    '<p class="note">Réincarne ton panda pour gagner du <b>jade</b>. Chaque jade accumulé donne +2 % de production pour toujours, et se dépense dans la boutique ci-dessous. Le cycle repart de zéro : bambous, bâtiments et améliorations sont perdus. Succès, clics et jade restent.</p>' +
    '<div class="big" id="jGain">0</div>' +
    '<div class="note" id="jInfo"></div>' +
    '<div class="meter"><i id="jBar"></i></div>' +
    '<div class="row">' +
      '<button class="btn jade warn" id="ascBtn" data-act="ascend">Se réincarner</button>' +
      '<span class="note" id="jMult"></span>' +
    '</div>' +
    '<h2>Boutique de jade <span class="note">(jade disponible : <b id="jAvail"></b>)</span></h2>' +
    '<div class="list">' + shopHTML + '</div>';

  updateJadeLive();
}

/** Met à jour les valeurs changeantes de l'onglet Réincarnation. */
function updateJadeLive() {
  const gainEl = $('#jGain');
  if (!gainEl) return;

  const gained = prestigeGain();
  gainEl.textContent = '+' + fmt(gained) + ' jade';

  const nextAt = Math.pow(state.jadeTotal + gained + 1, 3) * 1e10;
  const prevAt = Math.pow(state.jadeTotal + gained, 3) * 1e10;
  const progress = (state.all - prevAt) / (nextAt - prevAt) * 100;

  $('#jInfo').textContent =
    'Prochain jade à ' + fmt(nextAt) + ' bambous récoltés au total (il t’en manque ' +
    fmt(Math.max(0, nextAt - state.all)) + ').';
  $('#jBar').style.width = Math.max(0, Math.min(100, progress)) + '%';
  $('#ascBtn').disabled = gained < 1;

  const formatMult = (jade) => (1 + 0.02 * jade).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  $('#jMult').textContent =
    'Bonus actuel : ×' + formatMult(state.jadeTotal) + ' (' + fmt(state.jadeTotal) + ' jade). ' +
    'Après : ×' + formatMult(state.jadeTotal + gained) + '.';
  $('#jAvail').textContent = fmt(state.jade);
}

/* ----- Onglet Réglages ----- */

function renderOptionsTab() {
  const wardrobeHTML = ACCESSORIES.map((acc) => {
    if (state.accU[acc.id]) {
      return '<label class="opt"><input type="checkbox" id="eq-' + acc.id + '" data-eq="' + acc.id + '"' +
             (state.eq[acc.id] ? ' checked' : '') + '> ' + acc.name + '</label>';
    }
    return '<span class="chip" title="' + acc.condition + '">Verrouillé : ' + acc.name + ' (' + acc.condition + ')</span>';
  }).join('');

  $('#p-opt').innerHTML =
    '<h2>Garde-robe</h2>' +
    '<p class="note">Les accessoires se débloquent en jouant ou dans la boutique premium.</p>' +
    '<div class="row">' + wardrobeHTML + '</div>' +

    '<h2>Options</h2>' +
    '<label class="opt"><input type="checkbox" id="o-sound"'  + (state.opt.sound  ? ' checked' : '') + '> Effets sonores</label>' +
    '<label class="opt"><input type="checkbox" id="o-sci"'    + (state.opt.sci    ? ' checked' : '') + '> Notation scientifique</label>' +
    '<label class="opt"><input type="checkbox" id="o-leaves"' + (state.opt.leaves ? ' checked' : '') + '> Feuilles qui tombent en arrière-plan</label>' +

    '<h2>Sauvegarde</h2>' +
    '<p class="note">Le jeu se sauvegarde tout seul dans ce navigateur toutes les 15 secondes. Pour changer d’appareil, exporte le code ci-dessous.</p>' +
    '<div class="row">' +
      '<button class="btn primary" data-act="save">Sauvegarder</button>' +
      '<button class="btn" data-act="export">Exporter</button>' +
      '<button class="btn" data-act="copy">Copier</button>' +
      '<button class="btn" data-act="import">Importer</button>' +
    '</div>' +
    '<textarea id="io" spellcheck="false" aria-label="Code de sauvegarde" placeholder="Le code de sauvegarde apparaît ici. Colle un code puis clique sur Importer."></textarea>' +

    '<h2>Zone dangereuse</h2>' +
    '<div class="row"><button class="btn warn" data-act="wipe">Tout effacer</button></div>';
}
