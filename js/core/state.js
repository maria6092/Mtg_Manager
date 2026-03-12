// FASE 2: mueve aquí el estado global (cards, decks, wishlist, settings).
export const DEFAULT_SETTINGS = {
  fontSize: '16px',
  density: 'normal',
  theme: 'default',
  motion: 'normal'
};

export const state = {
  cards: [],
  decks: [],
  wishlist: [],
  currentDeckId: null,
  sortState: { col: 'name', asc: true },
  settings: { ...DEFAULT_SETTINGS }
};