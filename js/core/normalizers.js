import { state } from './state.js';
import { colorToEmojisFromCI } from './utils.js';
import { saveCards, saveDecks, saveWishlist } from './storage.js';

export function normalizeCards() {
  let changed = false;
  for (const c of state.cards) {
    if (!c || typeof c !== 'object') continue;
    const b = c.fav === true || c.fav === 1 || c.fav === '1' || String(c.fav).toLowerCase() === 'true';
    if (c.fav !== b) { c.fav = b; changed = true; }
    if (!Array.isArray(c.colorId)) { c.colorId = []; changed = true; }
    if (typeof c.manaValue !== 'number' || !Number.isFinite(c.manaValue)) { c.manaValue = 0; changed = true; }
    if (!c.color) { c.color = colorToEmojisFromCI(c.colorId); changed = true; }
    if (typeof c._addedAt !== 'number') { c._addedAt = Date.now(); changed = true; }
  }
  if (changed) saveCards();
}

export function normalizeDecks() {
  let changed = false;
  for (const d of state.decks) {
    if (!d.id) { d.id = crypto.randomUUID(); changed = true; }
    if (!d.name) { d.name = 'Mazo'; changed = true; }
    if (!Array.isArray(d.items)) { d.items = []; changed = true; }
    if (typeof d.commander === 'undefined') { d.commander = null; changed = true; }
    if (typeof d._createdAt !== 'number') { d._createdAt = Date.now(); changed = true; }
    if (typeof d._updatedAt !== 'number') { d._updatedAt = Date.now(); changed = true; }
    if (d.commander && typeof d.commander === 'object') {
      if (!d.commander.name) { d.commander = null; changed = true; }
      else {
        d.commander.set = String(d.commander.set || '').toUpperCase();
        d.commander.cn  = String(d.commander.cn  || '');
        d.commander.key = (d.commander.set && d.commander.cn)
          ? `${d.commander.set}#${d.commander.cn}` : '';
      }
    }
  }
  if (changed) saveDecks();
}

export function normalizeWishlist() {
  let changed = false;
  if (!Array.isArray(state.wishlist)) { state.wishlist = []; changed = true; }
  for (const w of state.wishlist) {
    if (!w.id) { w.id = crypto.randomUUID(); changed = true; }
    if (typeof w._addedAt !== 'number') { w._addedAt = Date.now(); changed = true; }
    if (typeof w.qty !== 'number' || w.qty < 1) { w.qty = 1; changed = true; }
    if (!Array.isArray(w.priceHist)) { w.priceHist = []; changed = true; }
  }
  if (changed) saveWishlist();
}