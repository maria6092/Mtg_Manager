import { state, DEFAULT_SETTINGS } from '../core/state.js';
import { saveCards, saveDecks, saveWishlist, saveSettings } from '../core/storage.js';
import { fb, initFirebase } from './firebase.js';

export async function cloudSaveAll() {
  await initFirebase();
  const user = fb.currentUser;
  if (!user || !fb.ready) return false;

  try {
    const payload = {
      cards: state.cards,
      decks: state.decks,
      wishlist: state.wishlist,
      settings: state.settings,
      sortState: state.sortState,
      updatedAt: Date.now()
    };

    await fb.fns.setDoc(fb.fns.doc(fb.db, 'users', user.uid, 'data', 'main'), payload);
    return true;
  } catch (error) {
    console.error('Error al guardar en nube:', error);
    return false;
  }
}

export async function cloudLoadAll() {
  await initFirebase();
  const user = fb.currentUser;
  if (!user || !fb.ready) return false;

  try {
    const snap = await fb.fns.getDoc(fb.fns.doc(fb.db, 'users', user.uid, 'data', 'main'));
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
  } catch (error) {
    console.error('Error al cargar de nube:', error);
    return false;
  }
}

export async function manualCloudSave() {
  const ok = await cloudSaveAll();
  alert(ok ? 'Datos guardados en la nube ✅' : 'No se pudo guardar en la nube.');
}

export async function manualCloudLoad() {
  const ok = await cloudLoadAll();
  alert(ok ? 'Datos cargados desde la nube ✅' : 'No hay datos en la nube o error al cargar.');
  return ok;
}
