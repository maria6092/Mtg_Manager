// FASE 2: mueve aquí los listeners de .tabbtn.
import { TABS } from '../core/constants.js';
import { setSectionVisibility } from './router.js';
import { renderCards } from './cards-ui.js';
import { renderDecksList, closeDeck } from './decks-ui.js';
import { renderWishlist } from './wishlist-ui.js';
import { renderStats } from './stats-ui.js';

export function switchTab(tabName) {
  setSectionVisibility(tabName, TABS);

  if (tabName === 'stats') renderStats();
  if (tabName === 'cards') renderCards();
  if (tabName === 'decks') {
    renderDecksList();
    closeDeck();
  }
  if (tabName === 'wishlist') renderWishlist();
}

export function initTabs() {
  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}