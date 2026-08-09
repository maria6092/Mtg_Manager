import { initAppEvents } from './core/events.js';
import { initCardsTableListeners, initAddCardButton } from './ui/cards-ui.js';
import { initCollectionListeners } from './ui/collection-ui.js';
import { initDecksUI } from './ui/decks-ui.js';
import { initWishlistUI } from './ui/wishlist-ui.js';
import { initSalesListeners } from './ui/sales-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initAppEvents();         // primero: carga estado, aplica settings, inicia auth
  initCardsTableListeners();
  initCollectionListeners();
  initAddCardButton();
  initDecksUI();
  initWishlistUI();
  initSalesListeners();
});