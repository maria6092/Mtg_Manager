// js/services/cloud-service.js
window.CloudService = (function () {

  async function saveAll({ cards, decks, wishlist, settings, sortState }) {
    const uid = currentUserId();
    if (!uid) return false;
    try {
      await fbDb.collection('users').doc(uid)
        .collection('data').doc('main')
        .set({ cards, decks, wishlist, settings, sortState, updatedAt: Date.now() });
      return true;
    } catch (e) {
      console.error('CloudService.saveAll:', e);
      return false;
    }
  }

  async function loadAll() {
    const uid = currentUserId();
    if (!uid) return { exists: false };
    try {
      const snap = await fbDb.collection('users').doc(uid)
        .collection('data').doc('main').get();
      return { exists: snap.exists, data: snap.exists ? snap.data() : null };
    } catch (e) {
      console.error('CloudService.loadAll:', e);
      return { exists: false };
    }
  }

  return { saveAll, loadAll };
})();