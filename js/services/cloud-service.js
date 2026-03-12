// FASE 2: mueve aquí cloudSaveAll y cloudLoadAll.
import { state, DEFAULT_SETTINGS } from '../core/state.js';
import { saveCards, saveDecks, saveWishlist, saveSettings } from '../core/storage.js';

export async function cloudSaveAll() {
  const user = window._fbCurrentUser;
  if (!user) return false;

  const { doc, setDoc } = window._fbFns || {};
  const db = window._fbDb;

  if (!doc || !setDoc || !db) return false;

  try {
    const payload = {
      cards: state.cards,
      decks: state.decks,
      wishlist: state.wishlist,
      settings: state.settings,
      sortState: state.sortState,
      updatedAt: Date.now()
    };

    await setDoc(doc(db, 'users', user.uid, 'data', 'main'), payload);
    return true;
  } catch (e) {
    console.error('Error al guardar en nube:', e);
    return false;
  }
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

    if (Array.isArray(data.cards)) state.cards = data.cards;
    if (Array.isArray(data.decks)) state.decks = data.decks;
    if (Array.isArray(data.wishlist)) state.wishlist = data.wishlist;
    if (data.settings) state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    if (data.sortState) state.sortState = data.sortState;

    saveCards();
    saveDecks();
    saveWishlist();
    saveSettings();

    return true;
  } catch (e) {
    console.error('Error al cargar de nube:', e);
    return false;
  }
}

export async function manualCloudSave() {
  const ok = await cloudSaveAll();
  if (ok) {
    alert('Datos guardados en la nube ✅');
  } else {
    alert('No se pudo guardar en la nube.');
  }
}

export async function manualCloudLoad() {
  const ok = await cloudLoadAll();
  if (ok) {
    alert('Datos cargados desde la nube ✅');
  } else {
    alert('No hay datos en la nube o error al cargar.');
  }
  return ok;
}