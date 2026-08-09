import { state, } from '../core/state.js';
import { DEFAULT_SETTINGS } from '../core/constants.js';
import { saveCards, saveDecks, saveWishlist, saveSettings, saveSortState } from '../core/storage.js';

export async function cloudSaveAll() {
  const user = window._fbCurrentUser;
  if (!user) return false;
  const { doc, setDoc } = window._fbFns || {};
  const db = window._fbDb;
  if (!doc || !setDoc || !db) return false;
  try {
    await setDoc(doc(db, 'users', user.uid, 'data', 'main'), {
      cards: state.cards, decks: state.decks, wishlist: state.wishlist,
      settings: state.settings, sortState: state.sortState, updatedAt: Date.now()
    });
    return true;
  } catch(e) { console.error('cloudSaveAll:', e); return false; }
}

export async function cloudLoadAll() {
  const user = window._fbCurrentUser;
  if (!user) return false;
  const { doc, getDoc } = window._fbFns || {};
  const db = window._fbDb;
  if (!doc || !getDoc || !db) return false;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'main'));
    if (!snap.exists()) return false;
    const data = snap.data();
    if (Array.isArray(data.cards))    state.cards    = data.cards;
    if (Array.isArray(data.decks))    state.decks    = data.decks;
    if (Array.isArray(data.wishlist)) state.wishlist = data.wishlist;
    if (data.settings)  state.settings  = { ...DEFAULT_SETTINGS, ...data.settings };
    if (data.sortState) state.sortState = data.sortState;
    saveCards(); saveDecks(); saveWishlist(); saveSettings(); saveSortState();
    return true;
  } catch(e) { console.error('cloudLoadAll:', e); return false; }
}