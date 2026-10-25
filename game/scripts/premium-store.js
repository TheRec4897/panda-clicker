'use strict';

let premiumProducts = [];
let premiumStoreLoading = false;

function premiumStatus(message, isError) {
  const status = $('#premium-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', !!isError);
}

function renderPremiumProducts() {
  const list = $('#premium-list');
  if (!list) return;
  list.replaceChildren();

  premiumProducts.forEach((product) => {
    if (!product || typeof product.id !== 'string' || typeof product.name !== 'string') return;
    if (typeof product.description !== 'string' || !Number.isSafeInteger(product.priceMinor)
        || product.priceMinor <= 0) return;

    const item = document.createElement('article');
    item.className = 'item premium-item';

    const description = document.createElement('span');
    description.className = 'i-main';
    const name = document.createElement('span');
    name.className = 'i-name';
    name.textContent = product.name;
    const detail = document.createElement('span');
    detail.className = 'i-desc';
    detail.textContent = product.description;
    description.append(name, detail);

    const purchase = document.createElement('button');
    purchase.className = 'btn primary premium-buy';
    purchase.type = 'button';
    purchase.dataset.storeProduct = product.id;
    purchase.textContent = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: product.currency || 'EUR'
    }).format(product.priceMinor / 100);
    purchase.disabled = isPremiumProductOwned(product.id, product);

    item.append(description, purchase);
    list.appendChild(item);
  });
}

function isPremiumProductOwned(productId, product) {
  if (productId === 'cosmetic-sakura') return state.paid.cosmetics.includes('sakura');
  if (productId === 'production-double') return state.paid.multiplierCount > 0;
  if (product && Number.isInteger(product.maxPurchases)) {
    return productId === 'auto-click-1' && state.paid.autoClicks >= product.maxPurchases;
  }
  return false;
}

function renderPremiumTab() {
  const panel = $('#p-premium');
  panel.innerHTML =
    '<h2>Boutique premium</h2>' +
    '<p class="note">Les paiements sont traités par Stripe dans ton navigateur. Les achats restent liés à cette installation.</p>' +
    '<p class="note premium-status" id="premium-status" role="status">Connexion à la boutique…</p>' +
    '<div class="row"><button class="btn" data-act="storeSync">Restaurer mes achats</button></div>' +
    '<div class="list" id="premium-list"></div>';

  if (!window.payments) {
    premiumStatus('La passerelle de paiement n’est pas disponible dans cette version.', true);
    return;
  }
  if (premiumStoreLoading) return;

  premiumStoreLoading = true;
  window.payments.getProducts()
    .then((result) => {
      if (!result || !Array.isArray(result.products)) {
        throw new Error('Le catalogue reçu est invalide.');
      }
      premiumProducts = result.products;
      renderPremiumProducts();
      premiumStatus('Catalogue chargé. Vérification des achats…', false);
      return syncPaidEntitlements(true);
    })
    .catch((error) => {
      premiumStatus(error.message || 'Impossible de joindre la boutique.', true);
    })
    .finally(() => { premiumStoreLoading = false; });
}

async function syncPaidEntitlements(showErrors) {
  if (!window.payments) {
    premiumStatus('La passerelle de paiement n’est pas disponible.', true);
    return null;
  }

  try {
    const remote = await window.payments.getEntitlements();
    if (!remote || !Number.isFinite(remote.jadeGranted)
        || !Number.isFinite(remote.autoClicks)
        || !Number.isFinite(remote.multiplierCount)
        || !Array.isArray(remote.cosmetics)) {
      throw new Error('Les achats reçus du serveur sont invalides.');
    }

    const jadeGranted = Math.max(0, Math.floor(remote.jadeGranted));
    const jadeDelta = Math.max(0, jadeGranted - state.paid.jadeGranted);
    if (jadeDelta) state.jade += jadeDelta;
    state.paid.jadeGranted = Math.max(state.paid.jadeGranted, jadeGranted);
    state.paid.autoClicks = Math.max(0, Math.floor(remote.autoClicks));
    state.paid.multiplierCount = Math.max(0, Math.floor(remote.multiplierCount));
    state.paid.cosmetics = remote.cosmetics.filter((id) => id === 'sakura');

    if (state.paid.cosmetics.includes('sakura')) {
      state.accU.sakura = true;
      if (state.eq.sakura === undefined) state.eq.sakura = true;
    } else {
      delete state.accU.sakura;
      delete state.eq.sakura;
    }

    recalc();
    applyAccessories();
    saveState();
    updateAll();
    if (currentTab === 'opt') renderOptionsTab();
    if (jadeDelta) toast('Achat confirmé : +' + fmt(jadeDelta) + ' jade.');
    premiumStatus('Achats synchronisés.', false);
    return remote;
  } catch (error) {
    premiumStatus(error.message || 'Impossible de vérifier les achats.', true);
    if (showErrors) console.error('Synchronisation des achats impossible :', error);
    return null;
  }
}

function hasPremiumProduct(remote, productId, before) {
  if (!remote) return false;
  if (productId === 'cosmetic-sakura') return remote.cosmetics.includes('sakura');
  if (productId === 'auto-click-1') return remote.autoClicks > before.autoClicks;
  if (productId === 'production-double') return remote.multiplierCount > before.multiplierCount;
  if (productId === 'jade-100') return remote.jadeGranted >= before.jadeGranted + 100;
  if (productId === 'jade-600') return remote.jadeGranted >= before.jadeGranted + 600;
  return false;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function buyPremiumProduct(productId) {
  const product = premiumProducts.find((item) => item.id === productId);
  if (!product || !window.payments) {
    premiumStatus('Produit ou passerelle de paiement indisponible.', true);
    return;
  }
  if (isPremiumProductOwned(productId, product)) {
    premiumStatus('La limite d’achat de cet article est atteinte.', true);
    return;
  }

  const before = await window.payments.getEntitlements().catch(() => ({
    jadeGranted: state.paid.jadeGranted,
    autoClicks: state.paid.autoClicks,
    multiplierCount: state.paid.multiplierCount
  }));
  const button = document.querySelector('[data-store-product="' + productId + '"]');
  if (button) button.disabled = true;

  try {
    await window.payments.startCheckout(productId);
    premiumStatus('Paiement ouvert dans le navigateur. En attente de sa confirmation…', false);

    for (let attempt = 0; attempt < 60; attempt++) {
      await wait(2000);
      const remote = await syncPaidEntitlements(false);
      if (hasPremiumProduct(remote, productId, before)) {
        premiumStatus('Paiement confirmé et achat ajouté à ta partie.', false);
        renderPremiumProducts();
        return;
      }
    }
    premiumStatus('Confirmation non reçue pour le moment. Utilise « Restaurer mes achats » dans quelques instants.', true);
  } catch (error) {
    premiumStatus(error.message || 'Le paiement n’a pas pu être lancé.', true);
  } finally {
    if (button && document.contains(button)) {
      button.disabled = isPremiumProductOwned(productId, product);
    }
  }
}
