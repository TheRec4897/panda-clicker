'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('discordPresence', {
  updateBambooCount(count) {
    ipcRenderer.send('presence:update', count);
  }
});

contextBridge.exposeInMainWorld('payments', {
  getProducts() {
    return ipcRenderer.invoke('payments:products');
  },
  getEntitlements() {
    return ipcRenderer.invoke('payments:entitlements');
  },
  startCheckout(productId) {
    return ipcRenderer.invoke('payments:checkout', productId);
  }
});
