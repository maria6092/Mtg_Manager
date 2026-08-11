/**
 * achievements.js
 * Sistema de logros de MTG Manager.
 *
 * No es un módulo ES — se carga con <script src="js/achievements.js"></script>
 * DESPUÉS del <script> principal de index.html, así que puede leer y
 * "envolver" (monkey-patch) las funciones y variables globales que ya
 * existen allí (cards, decks, wishlist, settings, showPage, saveCards...).
 *
 * Requiere que js/achievements-data.js se haya cargado antes
 * (expone window.ACHIEVEMENTS_DATA).
 */

(function () {
  'use strict';

  // Se lee de forma perezosa (función, no const) para que funcione sin
  // importar el orden de carga de <script achievements-data.js> y
  // <script achievements.js>, o si por lo que sea uno tarda más que el otro.
  function DATA() { return window.ACHIEVEMENTS_DATA || []; }
  const LS_ACH = 'mtg_achievements_v1';

  const DIFF_LABEL = { easy: 'Fácil', medium: 'Media', hard: 'Difícil', legendary: 'Legendaria' };
  const CAT_ICON = {
    'Colección': '🗂️', 'Mazos': '📚', 'Wishlist': '⭐',
    'Mercado': '💰', 'Comunidad': '🤝', 'Especiales': '✨',
  };

  /* ─────────────────────────────────────────────
     ALMACENAMIENTO (por usuario, igual que el resto de la app)
  ───────────────────────────────────────────── */
  function key() {
    try { return (typeof scopedKey === 'function') ? scopedKey(LS_ACH) : LS_ACH; }
    catch { return LS_ACH; }
  }
  function loadState() {
    try {
      const r = localStorage.getItem(key());
      const s = r ? JSON.parse(r) : null;
      return {
        unlocked: (s && typeof s.unlocked === 'object' && !Array.isArray(s.unlocked)) ? s.unlocked : {}, // {id: tsMillis}
        counters: (s && typeof s.counters === 'object') ? s.counters : {},
      };
    } catch { return { unlocked: {}, counters: {} }; }
  }
  function saveState(state) {
    try { localStorage.setItem(key(), JSON.stringify(state)); } catch {}
  }

  let STATE = loadState();

  function resetForUserSwitch() { STATE = loadState(); }

  function bumpCounter(name, by = 1) {
    STATE.counters[name] = (STATE.counters[name] || 0) + by;
    saveState(STATE);
  }
  function markSet(name, id) {
    if (!Array.isArray(STATE.counters[name])) STATE.counters[name] = [];
    if (!STATE.counters[name].includes(id)) { STATE.counters[name].push(id); saveState(STATE); }
  }
  function counterArr(name) { return Array.isArray(STATE.counters[name]) ? STATE.counters[name] : []; }
  function counterNum(name) { return Number(STATE.counters[name] || 0); }
  function counterFlag(name) { return !!STATE.counters[name]; }
  function setFlag(name, v = true) { STATE.counters[name] = v; saveState(STATE); }

  /* ─────────────────────────────────────────────
     ESTADÍSTICAS DERIVADAS DEL ESTADO DE LA APP
  ───────────────────────────────────────────── */
  function safe(fn, fallback) { try { const v = fn(); return v === undefined ? fallback : v; } catch { return fallback; } }

  function computeStats() {
    const _cards = safe(() => cards, []) || [];
    const _decks = safe(() => decks, []) || [];
    const _wish  = safe(() => wishlist, []) || [];
    const _settings = safe(() => settings, {}) || {};
    const _profile = safe(() => profile, {}) || {};

    const totalQty = _cards.reduce((a, c) => a + (c.qty || 1), 0);
    const uniqueCards = _cards.length;
    const setsCodes = new Set(_cards.map(c => c.setCode).filter(Boolean));
    const colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    let multicolorCount = 0, rareCount = 0, mythicCount = 0, planeswalkerCount = 0, favCount = 0;
    for (const c of _cards) {
      const ids = Array.isArray(c.colorId) ? c.colorId : [];
      const q = c.qty || 1;
      if (ids.length >= 2) multicolorCount += 1;
      ids.forEach(id => { if (colorCounts[id] !== undefined) colorCounts[id] += 1; });
      if (c.rarity === 'Rara') rareCount += 1;
      if (c.rarity === 'Mítica') mythicCount += 1;
      if (String(c.type || '').includes('Planeswalker')) planeswalkerCount += 1;
      if (typeof isFav === 'function' ? isFav(c) : !!c.fav) favCount += 1;
    }
    const allColors = ['W', 'U', 'B', 'R', 'G'].every(k => colorCounts[k] > 0);
    const allColors10 = ['W', 'U', 'B', 'R', 'G'].every(k => colorCounts[k] >= 10);
    const invAll = safe(() => computeInvestmentTotals().invAll, 0) || 0;
    const saleCount = _cards.filter(c => !!c.sale).length;

    // Mazos
    const deckCount = _decks.length;
    const deckWithCommander = _decks.some(d => d.commander && d.commander.name);
    const maxDeckSize = _decks.reduce((max, d) => {
      const items = (d.items || []).reduce((a, it) => a + (it.qty || 1), 0) + (d.commander ? 1 : 0);
      return Math.max(max, items);
    }, 0);
    function deckColorSignature(d) {
      const set = new Set();
      (d.items || []).forEach(it => {
        const owned = _cards.find(c => String(c.name || '').toLowerCase() === String(it.name || '').toLowerCase());
        (owned?.colorId || []).forEach(id => set.add(id));
      });
      return [...set].sort().join('');
    }
    const deckSignatures = _decks.map(deckColorSignature);
    const monocolorDeck = deckSignatures.some(s => s.length === 1);
    const fiveColorDeck = deckSignatures.some(s => s.length === 5);
    const fourColorDeck = deckSignatures.some(s => s.length === 4);
    const uniqueDeckSignatures = new Set(deckSignatures.filter(Boolean)).size;

    // Wishlist
    const wishQty = _wish.reduce((a, w) => a + (w.qty || 1), 0);
    const wishCompletedCount = _wish.filter(w => (typeof haveQtyForWish === 'function' ? haveQtyForWish(w) : 0) >= (w.qty || 1)).length;
    const now = Date.now();
    const wishHasOld30 = _wish.some(w => (now - (w._addedAt || now)) >= 30 * 86400000);
    const wishHasOld90 = _wish.some(w => (now - (w._addedAt || now)) >= 90 * 86400000);
    const wishHasPriceDrop = _wish.some(w => {
      const h = Array.isArray(w.priceHist) ? w.priceHist : [];
      for (let i = 1; i < h.length; i++) if (h[i].v < h[i - 1].v) return true;
      return false;
    });
    if (wishQty > 0) setFlag('hadAnyWish', true);
    const wishEmpty = wishQty === 0 && counterFlag('hadAnyWish');

    // Amigos / comunidad
    let friendsCount = 0, sentCount = 0, receivedCount = 0;
    try {
      const fd = (typeof getFriendsData === 'function') ? getFriendsData() : null;
      if (fd) { friendsCount = fd.friends.length; sentCount = fd.sent.length; receivedCount = fd.received.length; }
    } catch {}
    if (receivedCount > counterNum('maxReceived')) STATE.counters.maxReceived = receivedCount;

    // Perfil
    const profileHasName   = !!(_profile.displayName || '').trim();
    const profileHasBio    = !!(_profile.bio || '').trim();
    const profileHasAvatar = !!(_profile.avatar || '').trim();
    const profileHasBanner = !!(_profile.banner || '').trim();
    const profileEdited = profileHasName || profileHasBio || profileHasAvatar || profileHasBanner;
    const profileComplete = profileHasName && profileHasBio && profileHasAvatar && profileHasBanner;
    const fullProfile = profileEdited && uniqueCards > 0 && deckCount > 0 && wishQty > 0;

    // Días de uso / nocturno
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const days = counterArr('loginDays');
    if (!days.includes(todayKey)) { days.push(todayKey); STATE.counters.loginDays = days; saveState(STATE); }
    const hour = today.getHours();
    if (hour >= 0 && hour < 6) setFlag('nightOwl', true);

    return {
      totalQty, uniqueCards, setsCount: setsCodes.size, colorCounts, allColors, allColors10,
      multicolorCount, rareCount, mythicCount, planeswalkerCount, favCount, invAll, saleCount,
      deckCount, deckWithCommander, maxDeckSize, monocolorDeck, fiveColorDeck, fourColorDeck,
      uniqueDeckSignatures, wishQty, wishCompletedCount, wishHasOld30, wishHasOld90,
      wishHasPriceDrop, wishEmpty, friendsCount, sentCount, receivedCount,
      profileHasName, profileHasBio, profileHasAvatar, profileHasBanner,
      profileEdited, profileComplete, fullProfile,
      daysUsedCount: days.length, nightOwl: counterFlag('nightOwl'),
      searchCount: counterNum('searchCount'), backupCount: counterNum('backupCount'),
      restoreCount: counterNum('restoreCount'), autoBackup: !!_settings.autoBackupEnabled,
      deckRebuildMax: Math.max(0, ...Object.values(STATE.counters.deckEdits || {}), 0),
      deckWishlistSent: counterFlag('deckWishlistSent'),
      sectionsVisited: counterArr('sectionsVisited').length,
      maxReceived: counterNum('maxReceived'), acceptedFriend: counterFlag('acceptedFriend'),
      secretFound: counterFlag('secretFound'),
    };
  }

  const MAIN_SECTIONS = ['cartas', 'coleccion', 'mazos', 'buscador', 'deseos', 'mis_ventas', 'tienda', 'usuario', 'ajustes'];

  /* ─────────────────────────────────────────────
     CONDICIONES DE CADA LOGRO
     (s = objeto de estadísticas devuelto por computeStats)
  ───────────────────────────────────────────── */
  const CHECKS = {
    collector_1: s => s.totalQty >= 1, collector_10: s => s.totalQty >= 10,
    collector_25: s => s.totalQty >= 25, collector_50: s => s.totalQty >= 50,
    collector_100: s => s.totalQty >= 100, collector_250: s => s.totalQty >= 250,
    collector_500: s => s.totalQty >= 500, collector_1000: s => s.totalQty >= 1000,
    collector_2500: s => s.totalQty >= 2500, collector_5000: s => s.totalQty >= 5000,
    collector_10000: s => s.totalQty >= 10000,
    unique_100: s => s.uniqueCards >= 100, unique_500: s => s.uniqueCards >= 500,
    no_duplicates_100: s => s.uniqueCards >= 100,
    sets_5: s => s.setsCount >= 5, sets_10: s => s.setsCount >= 10,
    sets_25: s => s.setsCount >= 25, sets_50: s => s.setsCount >= 50,
    all_colors: s => s.allColors, color_10_each: s => s.allColors10,
    multicolor_25: s => s.multicolorCount >= 25,
    rare_50: s => s.rareCount >= 50, mythic_10: s => s.mythicCount >= 10,
    planeswalker_10: s => s.planeswalkerCount >= 10,
    favorite_first: s => s.favCount >= 1, favorites_25: s => s.favCount >= 25,
    value_250: s => s.invAll >= 250, value_1000: s => s.invAll >= 1000, value_5000: s => s.invAll >= 5000,

    deck_1: s => s.deckCount >= 1, deck_3: s => s.deckCount >= 3, deck_5: s => s.deckCount >= 5,
    deck_10: s => s.deckCount >= 10, deck_20: s => s.deckCount >= 20, deck_50: s => s.deckCount >= 50,
    deck_25: s => s.deckCount >= 25, deck_organized: s => s.deckCount >= 10,
    deck_60: s => s.maxDeckSize >= 60, deck_100: s => s.maxDeckSize >= 100, deck_50cards: s => s.maxDeckSize >= 50,
    deck_commander: s => s.deckWithCommander,
    deck_monocolor: s => s.monocolorDeck, deck_5colors: s => s.fiveColorDeck, deck_4colors: s => s.fourColorDeck,
    deck_10_unique_colors: s => s.uniqueDeckSignatures >= 10,
    deck_wishlist: s => s.deckWishlistSent, wish_deck: s => s.deckWishlistSent,
    deck_rebuild: s => s.deckRebuildMax >= 10,

    wish_1: s => s.wishQty >= 1, wish_5: s => s.wishQty >= 5, wish_10: s => s.wishQty >= 10,
    wish_25: s => s.wishQty >= 25, wish_50: s => s.wishQty >= 50, wish_100: s => s.wishQty >= 100,
    wish_complete_1: s => s.wishCompletedCount >= 1, wish_complete_10: s => s.wishCompletedCount >= 10,
    wish_complete_25: s => s.wishCompletedCount >= 25, wish_50complete: s => s.wishCompletedCount >= 50,
    wish_empty: s => s.wishEmpty, wish_30days: s => s.wishHasOld30, wish_90days: s => s.wishHasOld90,
    wish_price_drop: s => s.wishHasPriceDrop,

    seller_1: s => s.saleCount >= 1, seller_5: s => s.saleCount >= 5, seller_10: s => s.saleCount >= 10,
    seller_25: s => s.saleCount >= 25, seller_50: s => s.saleCount >= 50, seller_100: s => s.saleCount >= 100,

    friend_1: s => s.friendsCount >= 1, friends_5: s => s.friendsCount >= 5,
    friends_10: s => s.friendsCount >= 10, friends_25: s => s.friendsCount >= 25, friends_50: s => s.friendsCount >= 50,
    request_1: s => s.sentCount >= 1, accept_1: s => s.friendsCount >= 1,
    received_10: s => s.maxReceived >= 10, received_25: s => s.maxReceived >= 25,

    search_1: s => s.searchCount >= 1, search_25: s => s.searchCount >= 25,
    search_100: s => s.searchCount >= 100, search_500: s => s.searchCount >= 500,
    first_backup: s => s.backupCount >= 1, backup_5: s => s.backupCount >= 5,
    restore_backup: s => s.restoreCount >= 1, auto_backup: s => s.autoBackup,
    profile_edit: s => s.profileEdited, profile_complete: s => s.profileComplete,
    first_login: () => true,
    days_7: s => s.daysUsedCount >= 7, days_30: s => s.daysUsedCount >= 30, days_100: s => s.daysUsedCount >= 100,
    all_sections: s => s.sectionsVisited >= MAIN_SECTIONS.length,
    night_owl: s => s.nightOwl,
    full_profile: s => s.fullProfile,
    secret_achievement: s => s.secretFound,
    // Los siguientes se resuelven aparte (dependen del nº de logros ya desbloqueados)
    achievement_25: null, achievement_50: null, achievement_75: null, achievement_100: null,
    perfect_collection: null,
  };

  /* ─────────────────────────────────────────────
     COMPROBACIÓN Y DESBLOQUEO
  ───────────────────────────────────────────── */
  function unlockedCount() { return Object.keys(STATE.unlocked).length; }

  function unlock(def) {
    if (STATE.unlocked[def.id]) return false;
    STATE.unlocked[def.id] = Date.now();
    saveState(STATE);
    showUnlockNotification(def);
    return true;
  }

  function check() {
    if (!DATA().length) return [];
    const stats = computeStats();
    const newly = [];
    for (const def of DATA()) {
      if (STATE.unlocked[def.id]) continue;
      const fn = CHECKS[def.id];
      if (typeof fn !== 'function') continue;
      try { if (fn(stats)) { if (unlock(def)) newly.push(def); } } catch {}
    }
    // Segunda pasada: logros que dependen del recuento total
    const count = unlockedCount();
    const metas = [
      ['achievement_25', 25], ['achievement_50', 50], ['achievement_75', 75], ['achievement_100', 100],
    ];
    for (const [id, n] of metas) {
      const def = DATA().find(d => d.id === id);
      if (def && !STATE.unlocked[id] && count >= n) { if (unlock(def)) newly.push(def); }
    }
    const perfectDef = DATA().find(d => d.id === 'perfect_collection');
    if (perfectDef && !STATE.unlocked['perfect_collection']) {
      const total = DATA().length;
      if (unlockedCount() >= total - 1) { if (unlock(perfectDef)) newly.push(perfectDef); }
    }
    if (newly.length) renderPageIfOpen();
    return newly;
  }

  function markSectionVisited(id) {
    if (!MAIN_SECTIONS.includes(id)) return;
    markSet('sectionsVisited', id);
  }

  /* ─────────────────────────────────────────────
     NOTIFICACIÓN DE LOGRO DESBLOQUEADO
  ───────────────────────────────────────────── */
  let toastQueue = [], toastShowing = false;
  function showUnlockNotification(def) {
    toastQueue.push(def);
    if (!toastShowing) drainToastQueue();
  }
  function drainToastQueue() {
    const def = toastQueue.shift();
    if (!def) { toastShowing = false; return; }
    toastShowing = true;
    ensureToastRoot();
    const root = document.getElementById('achToastRoot');
    const el = document.createElement('div');
    el.className = 'achToast';
    el.innerHTML = `
      <div class="achToastIconWrap">${iconPlaceholderHtml(def, 'achToastIcon')}</div>
      <div class="achToastBody">
        <div class="achToastEyebrow">🏆 Logro desbloqueado</div>
        <div class="achToastTitle">${escapeHtmlSafe(def.title)}</div>
        <div class="achToastDesc">${escapeHtmlSafe(def.desc)}</div>
      </div>
      <button class="achToastClose" aria-label="Cerrar">✕</button>
    `;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    const close = () => {
      el.classList.remove('is-in'); el.classList.add('is-out');
      setTimeout(() => { el.remove(); drainToastQueue(); }, 260);
    };
    el.querySelector('.achToastClose').addEventListener('click', close);
    const t = setTimeout(close, 5200);
    el.addEventListener('mouseenter', () => clearTimeout(t));
  }
  function ensureToastRoot() {
    if (document.getElementById('achToastRoot')) return;
    const root = document.createElement('div');
    root.id = 'achToastRoot';
    document.body.appendChild(root);
  }
  function escapeHtmlSafe(s) {
    return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s ?? '');
  }

  /* Icono con placeholder: intenta cargar assets/achievements/{id}.png,
     si no existe se queda con el emoji-placeholder. */
  function iconPlaceholderHtml(def, cls) {
    return `<span class="${cls} achIconPh" data-ach-icon="${def.id}">
      <img src="assets/achievements/${def.id}.png" alt=""
           onerror="this.style.display='none'; this.parentElement.classList.add('is-ph');">
      <span class="achIconPhGlyph">${CAT_ICON[def.cat] || '🏆'}</span>
    </span>`;
  }
  function lockPlaceholderHtml() {
    return `<span class="achLockPh">
      <img src="assets/achievements/locked.png" alt=""
           onerror="this.style.display='none'; this.parentElement.classList.add('is-ph');">
      <span class="achLockPhGlyph">🔒</span>
    </span>`;
  }

  /* ─────────────────────────────────────────────
     PÁGINA DE LOGROS
  ───────────────────────────────────────────── */
  let currentFilter = { cat: '', state: 'all' };

  function renderPageIfOpen() {
    const sec = document.querySelector('section[data-page="logros"]');
    if (sec && sec.style.display !== 'none') renderPage();
  }

  function renderPage() {
    check();
    const grid = document.getElementById('achGrid');
    if (!grid) return;

    const total = DATA().length;
    const done = unlockedCount();
    const pctEl = document.getElementById('achProgressText');
    if (pctEl) pctEl.textContent = `${done} / ${total} logros conseguidos`;
    const barEl = document.getElementById('achProgressBar');
    if (barEl) barEl.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';

    let view = DATA().slice();
    if (currentFilter.cat) view = view.filter(d => d.cat === currentFilter.cat);
    if (currentFilter.state === 'unlocked') view = view.filter(d => !!STATE.unlocked[d.id]);
    if (currentFilter.state === 'locked') view = view.filter(d => !STATE.unlocked[d.id]);

    // Agrupar por categoría para mostrar cabeceras
    const byCat = new Map();
    view.forEach(d => { if (!byCat.has(d.cat)) byCat.set(d.cat, []); byCat.get(d.cat).push(d); });

    grid.innerHTML = '';
    for (const [cat, list] of byCat) {
      const h = document.createElement('div');
      h.className = 'achCatHeader';
      h.innerHTML = `<span>${CAT_ICON[cat] || '🏆'} ${escapeHtmlSafe(cat)}</span><span class="achCatCount">${list.filter(d=>STATE.unlocked[d.id]).length}/${list.length}</span>`;
      grid.appendChild(h);

      const wrap = document.createElement('div');
      wrap.className = 'achGridInner';
      list.forEach(def => wrap.appendChild(renderCard(def)));
      grid.appendChild(wrap);
    }
    if (!view.length) grid.innerHTML = '<div class="hint">No hay logros con este filtro.</div>';
  }

  function renderCard(def) {
    const unlockedAt = STATE.unlocked[def.id];
    const card = document.createElement('div');
    card.className = 'achCard' + (unlockedAt ? ' is-unlocked' : ' is-locked');
    if (unlockedAt) {
      const dt = new Date(unlockedAt);
      card.innerHTML = `
        <div class="achCardIcon">${iconPlaceholderHtml(def, 'achIcon')}</div>
        <div class="achCardBody">
          <div class="achCardTitle">${escapeHtmlSafe(def.title)}</div>
          <div class="achCardDesc">${escapeHtmlSafe(def.desc)}</div>
          <div class="achCardMeta"><span class="tag achDiff-${def.diff}">${DIFF_LABEL[def.diff]||''}</span><span class="achCardDate">Conseguido: ${dt.toLocaleDateString('es-ES')}</span></div>
        </div>`;
    } else {
      card.innerHTML = `
        <div class="achCardIcon">${lockPlaceholderHtml()}</div>
        <div class="achCardBody">
          <div class="achCardTitle achCardTitle-locked">${escapeHtmlSafe(def.title)}</div>
          <div class="achCardMeta"><span class="tag achDiff-${def.diff}">${DIFF_LABEL[def.diff]||''}</span></div>
        </div>`;
    }
    return card;
  }

  function initFiltersUI() {
    const catSel = document.getElementById('achCatFilter');
    if (catSel && !catSel.dataset.ready) {
      const cats = [...new Set(DATA().map(d => d.cat))];
      catSel.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
      catSel.dataset.ready = '1';
      catSel.addEventListener('change', () => { currentFilter.cat = catSel.value; renderPage(); });
    }
    const stateSel = document.getElementById('achStateFilter');
    if (stateSel && !stateSel.dataset.ready) {
      stateSel.dataset.ready = '1';
      stateSel.addEventListener('change', () => { currentFilter.state = stateSel.value; renderPage(); });
    }
  }

  /* ─────────────────────────────────────────────
     ENGANCHES (monkey-patch de funciones globales existentes)
  ───────────────────────────────────────────── */
  function wrap(name, after) {
    if (typeof window[name] !== 'function') {
      // Puede ser una función declarada dentro del <script> inline (no en window),
      // pero sigue siendo accesible/reasignable como binding global.
      try {
        const orig = eval(name);
        if (typeof orig !== 'function') return;
        // eslint-disable-next-line no-eval
        eval(`${name} = function(...args){ const r = orig.apply(this, args); try { after(...args); } catch(e){} return r; };`);
      } catch {}
      return;
    }
    const orig = window[name];
    window[name] = function (...args) {
      const r = orig.apply(this, args);
      try { after(...args); } catch {}
      return r;
    };
  }

  function initHooks() {
    wrap('saveCards', () => check());
    wrap('saveDecks', () => check());
    wrap('saveWishlist', () => check());
    wrap('saveProfile', () => check());
    wrap('touchDeck', (d) => {
      if (!d || !d.id) return;
      if (!STATE.counters.deckEdits) STATE.counters.deckEdits = {};
      STATE.counters.deckEdits[d.id] = (STATE.counters.deckEdits[d.id] || 0) + 1;
      saveState(STATE);
      check();
    });
    wrap('doBackupNow', () => { bumpCounter('backupCount'); check(); });
    wrap('restoreLastBackup', () => { bumpCounter('restoreCount'); check(); });
    wrap('addMissingDeckToWishlist', () => { setFlag('deckWishlistSent', true); check(); });
    wrap('acceptFriendRequest', () => { setFlag('acceptedFriend', true); check(); });
    wrap('showPage', (id) => { markSectionVisited(id); if (id === 'logros') renderPage(); check(); });
    wrap('_onFirebaseLogin', () => { resetForUserSwitch(); check(); });

    document.getElementById('btnSearch')?.addEventListener('click', () => bumpCounter('searchCount'));
    document.getElementById('searchQ')?.addEventListener('keydown', e => { if (e.key === 'Enter') bumpCounter('searchCount'); });

    initFiltersUI();
    check();

    if (!DATA().length) {
      console.warn(
        '[Achievements] ACHIEVEMENTS_DATA está vacío. Comprueba que ' +
        '<script src="js/achievements-data.js"> esté incluido en index.html ' +
        'y que la ruta sea correcta (revisa la pestaña Network del navegador).'
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHooks);
  } else {
    initHooks();
  }

  window.Achievements = { check, renderPage, unlockedCount, totalCount: () => DATA().length };
})();
