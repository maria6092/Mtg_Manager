import { DEFAULT_SETTINGS } from './constants.js';

export const state = {
  cards:         [],
  decks:         [],
  wishlist:      [],
  settings:      { ...DEFAULT_SETTINGS },
  sortState:     { key: 'added', dir: 'desc' },
  currentDeckId: null,
  deckViewState: { deckId: null, q: '', group: 'type', selectedKey: null },
};