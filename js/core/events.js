// FASE 2: mueve aquí los listeners globales de arranque.
import { loadCards, loadDecks, loadWishlist, loadSettings, clearSession } from './storage.js';
import { initTabs, switchTab } from '../ui/tabs.js';
import { initAuthUI, initAuthButtons } from '../ui/auth-ui.js';
import { initCardsUI, renderCards } from '../ui/cards-ui.js';
import { initDecksUI, renderDecksList, closeDeck } from '../ui/decks-ui.js';
import { initWishlistUI, renderWishlist } from '../ui/wishlist-ui.js';
import { initStatsUI, renderStats } from '../ui/stats-ui.js';
import { initSettingsUI, loadSettingsIntoUI } from '../ui/settings-ui.js';
import { initSearchUI } from '../ui/intro-ui.js';
import { initImportUI } from '../ui/sales-ui.js';
import { manualCloudLoad, manualCloudSave } from '../services/cloud-service.js';

export function initAppEvents() {
  loadCards();
  loadDecks();
  loadWishlist();
  loadSettings();

  initAuthUI();
  initAuthButtons();
  initTabs();
  initCardsUI();
  initDecksUI();
  initWishlistUI();
  initStatsUI();
  initSettingsUI();
  initSearchUI();
  initImportUI();

  loadSettingsIntoUI();
  switchTab('cards');
  renderCards();
  renderDecksList();
  closeDeck();
  renderWishlist();

  const btnCloudSave = document.getElementById('btnCloudSave');
  const btnCloudLoad = document.getElementById('btnCloudLoad');
  const btnClearLocal = document.getElementById('btnClearLocal');
  const btnLogout = document.getElementById('btnLogout');

  if (btnCloudSave) {
    btnCloudSave.addEventListener('click', async () => {
      await manualCloudSave();
    });
  }

  if (btnCloudLoad) {
    btnCloudLoad.addEventListener('click', async () => {
      const ok = await manualCloudLoad();
      if (ok) {
        renderCards();
        renderDecksList();
        renderWishlist();
        renderStats();
      }
    });
  }

  if (btnClearLocal) {
    btnClearLocal.addEventListener('click', () => {
      if (!confirm('¿Borrar todos los datos locales?')) return;
      clearSession();
      renderCards();
      renderDecksList();
      renderWishlist();
      renderStats();
      loadSettingsIntoUI();
      alert('Datos locales borrados.');
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      document.body.classList.remove('app-ready');
      alert('Sesión cerrada.');
    });
  }
}