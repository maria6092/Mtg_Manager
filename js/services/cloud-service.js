const CloudService = (() => {

  let saveTimer = null;
  let loading = false;

  function getUser() {
    return window._fbCurrentUser || window._fbUser || window.fbAuth?.currentUser || null;
  }

  function getDb() {
    return window._fbDb || window.fbDb || null;
  }

  function getFns() {
    return window._fbFns || null;
  }

  function getLocalState() {
    return {
      cards: Array.isArray(window.cards) ? window.cards : [],
      decks: Array.isArray(window.decks) ? window.decks : [],
      wishlist: Array.isArray(window.wishlist) ? window.wishlist : [],
      settings: window.settings || {},
      sortState: window.sortState || { key: 'added', dir: 'desc' }
    };
  }

  async function saveAll(data = null) {
    const user = getUser();
    const db = getDb();

    if (!user || !db) return false;

    const state = data || getLocalState();

    try {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('data')
        .doc('main')
        .set({
          cards: Array.isArray(state.cards) ? state.cards : [],
          decks: Array.isArray(state.decks) ? state.decks : [],
          wishlist: Array.isArray(state.wishlist) ? state.wishlist : [],
          settings: state.settings || {},
          sortState: state.sortState || { key: 'added', dir: 'desc' },
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: false });

      return true;

    } catch (error) {
      console.error('CloudService.saveAll:', error);
      return false;
    }
  }

  async function loadAll() {
    const user = getUser();
    const db = getDb();

    if (!user || !db) {
      return {
        exists: false,
        data: null
      };
    }

    try {
      const snap = await db
        .collection('users')
        .doc(user.uid)
        .collection('data')
        .doc('main')
        .get();

      if (!snap.exists) {
        return {
          exists: false,
          data: null
        };
      }

      const data = snap.data() || {};

      return {
        exists: true,
        data: {
          cards: Array.isArray(data.cards) ? data.cards : [],
          decks: Array.isArray(data.decks) ? data.decks : [],
          wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
          settings: data.settings || {},
          sortState: data.sortState || { key: 'added', dir: 'desc' }
        }
      };

    } catch (error) {
      console.error('CloudService.loadAll:', error);

      return {
        exists: false,
        data: null,
        error
      };
    }
  }

  function saveDebounced(data = null, delay = 800) {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      saveAll(data).catch(error => {
        console.error('CloudService.saveDebounced:', error);
      });
    }, delay);
  }

  function cancelPendingSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  function isLoading() {
    return loading;
  }

  return {
    saveAll,
    loadAll,
    saveDebounced,
    cancelPendingSave,
    isLoading
  };

})();

window.CloudService = CloudService;