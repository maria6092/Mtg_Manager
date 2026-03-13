import { loadCards, loadDecks, loadWishlist, loadSettings, clearLocalData } from './storage.js';
import { initTabs, switchTab } from '../ui/tabs.js';
import { initAuthUI, initAuthButtons, handleAuthUser } from '../ui/auth-ui.js';
import { initCardsUI, renderCards } from '../ui/cards-ui.js';
import { initDecksUI, renderDecksList, closeDeck } from '../ui/decks-ui.js';
import { initWishlistUI, renderWishlist } from '../ui/wishlist-ui.js';
import { initStatsUI, renderStats } from '../ui/stats-ui.js';
import { initSettingsUI, loadSettingsIntoUI } from '../ui/settings-ui.js';
import { initSearchUI } from '../ui/intro-ui.js';
import { initImportUI } from '../ui/sales-ui.js';
import { manualCloudLoad, manualCloudSave } from '../services/cloud-service.js';
import { initFirebase, onFirebaseAuthChange } from '../services/firebase.js';

export async function initAppEvents() {
  loadCards();
  loadDecks();
  loadWishlist();
  loadSettings();

  initTabs();
  initAuthUI();
  initAuthButtons();
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
  renderStats();

  document.getElementById('btnCloudSave')?.addEventListener('click', async () => {
    await manualCloudSave();
  });

  document.getElementById('btnCloudLoad')?.addEventListener('click', async () => {
    const ok = await manualCloudLoad();
    if (ok) {
      renderCards();
      renderDecksList();
      renderWishlist();
      renderStats();
      loadSettingsIntoUI();
    }
  });

  document.getElementById('btnClearLocal')?.addEventListener('click', () => {
    if (!confirm('¿Borrar todos los datos locales?')) return;
    clearLocalData();
    renderCards();
    renderDecksList();
    renderWishlist();
    renderStats();
    loadSettingsIntoUI();
    alert('Datos locales borrados.');
  });

  await initFirebase();
  await onFirebaseAuthChange(handleAuthUser);
}
