import { state } from './state.js';
import { DEFAULT_SETTINGS } from './constants.js';
import { STORAGE_KEYS } from './constants.js';

function readJSON(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function saveCards()    { writeJSON(STORAGE_KEYS.cards,    state.cards); }
export function saveDecks()    { writeJSON(STORAGE_KEYS.decks,    state.decks); }
export function saveWishlist() { writeJSON(STORAGE_KEYS.wishlist, state.wishlist); }
export function saveSettings() { writeJSON(STORAGE_KEYS.settings, state.settings); }
export function saveSortState(){ writeJSON(STORAGE_KEYS.sortState,state.sortState); }

export function loadCards() {
  state.cards = readJSON(STORAGE_KEYS.cards, []);
}
export function loadDecks() {
  state.decks = readJSON(STORAGE_KEYS.decks, []);
}
export function loadWishlist() {
  state.wishlist = readJSON(STORAGE_KEYS.wishlist, []);
}
export function loadSettings() {
  state.settings = { ...DEFAULT_SETTINGS, ...readJSON(STORAGE_KEYS.settings, {}) };
}
export function loadSortState() {
  state.sortState = { key:'added', dir:'desc', ...readJSON(STORAGE_KEYS.sortState, {}) };
}

export function getLastTab() {
  return readJSON(STORAGE_KEYS.lastTab, 'intro') || 'intro';
}
export function setLastTab(tab) {
  writeJSON(STORAGE_KEYS.lastTab, tab);
}

export function clearSession() {
  state.cards = []; state.decks = []; state.wishlist = [];
  state.settings = { ...DEFAULT_SETTINGS };
  state.sortState = { key:'added', dir:'desc' };
  state.currentDeckId = null;
  Object.values(STORAGE_KEYS).forEach(k => { try { localStorage.removeItem(k); } catch {} });
}

/* Backup */
export function saveBackupLocal(payload) {
  writeJSON(STORAGE_KEYS.backupLast, payload);
  const arr = readJSON(STORAGE_KEYS.backupHistory, []);
  arr.unshift({ ts: payload.ts, sizeCards: payload.cards?.length||0, sizeDecks: payload.decks?.length||0 });
  while (arr.length > 10) arr.pop();
  writeJSON(STORAGE_KEYS.backupHistory, arr);
}
export function getLastBackup() {
  return readJSON(STORAGE_KEYS.backupLast, null);
}