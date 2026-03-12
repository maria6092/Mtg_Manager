// FASE 2: mueve aquí save/load de localStorage.
import { state, DEFAULT_SETTINGS } from './state.js';
import { STORAGE_KEYS } from './constants.js';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function saveCards() {
  writeJSON(STORAGE_KEYS.cards, state.cards);
}

export function loadCards() {
  state.cards = readJSON(STORAGE_KEYS.cards, []);
}

export function saveDecks() {
  writeJSON(STORAGE_KEYS.decks, state.decks);
}

export function loadDecks() {
  state.decks = readJSON(STORAGE_KEYS.decks, []);
}

export function saveWishlist() {
  writeJSON(STORAGE_KEYS.wishlist, state.wishlist);
}

export function loadWishlist() {
  state.wishlist = readJSON(STORAGE_KEYS.wishlist, []);
}

export function saveSettings() {
  writeJSON(STORAGE_KEYS.settings, state.settings);
}

export function loadSettings() {
  state.settings = {
    ...DEFAULT_SETTINGS,
    ...readJSON(STORAGE_KEYS.settings, {})
  };
}

export function clearSession() {
  state.cards = [];
  state.decks = [];
  state.wishlist = [];
  state.currentDeckId = null;
  state.sortState = { col: 'name', asc: true };
  state.settings = { ...DEFAULT_SETTINGS };

  try {
    localStorage.removeItem(STORAGE_KEYS.cards);
    localStorage.removeItem(STORAGE_KEYS.decks);
    localStorage.removeItem(STORAGE_KEYS.wishlist);
    localStorage.removeItem(STORAGE_KEYS.settings);
  } catch {}
}