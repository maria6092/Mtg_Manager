import { TABS } from '../core/constants.js';
import { setSectionVisibility } from './router.js';
import { renderCards } from './cards-ui.js';
import { renderDecksList, closeDeck } from './decks-ui.js';
import { renderWishlist } from './wishlist-ui.js';
import { renderStats } from './stats-ui.js';

export function switchTab(tabName) {
  setSectionVisibility(tabName, TABS);

  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  if (tabName === 'cards') renderCards();
  if (tabName === 'decks') {
    renderDecksList();
    closeDeck();
  }
  if (tabName === 'wishlist') renderWishlist();
  if (tabName === 'stats') renderStats();
}

export function initTabs() {
  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}
