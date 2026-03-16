/**
 * store.js
 * Estado global centralizado de la app.
 *
 * REGLA: ningún módulo guarda estado propio en variables sueltas.
 * Todo pasa por aquí: getters para leer, setters para escribir.
 *
 * Los setters no guardan en localStorage por sí solos —
 * eso lo hacen las funciones de persistencia en cada módulo.
 */

// ─── Estado interno ──────────────────────────────────────────────────────────
const _state = {
  /** @type {import('../utils/types.js').Card[]} */
  cards: [],

  /** @type {import('../utils/types.js').Deck[]} */
  decks: [],

  /** @type {import('../utils/types.js').WishItem[]} */
  wishlist: [],

  /** @type {import('../utils/types.js').Profile} */
  profile: {},

  /** @type {import('../utils/types.js').Settings} */
  settings: {},

  /** @type {{ key: string, dir: string }} */
  sortState: { key: "added", dir: "desc" },

  /** Usuario de Firebase Auth (null si no autenticado) */
  fbUser: null,
};

// ─── Getters ─────────────────────────────────────────────────────────────────
export const getCards    = ()  => _state.cards;
export const getDecks    = ()  => _state.decks;
export const getWishlist = ()  => _state.wishlist;
export const getProfile  = ()  => _state.profile;
export const getSettings = ()  => _state.settings;
export const getSortState= ()  => _state.sortState;
export const getFbUser   = ()  => _state.fbUser;
export const getCurrentUserId = () => _state.fbUser?.uid ?? "";

// ─── Setters ─────────────────────────────────────────────────────────────────
export function setCards(cards)       { _state.cards    = Array.isArray(cards) ? cards : []; }
export function setDecks(decks)       { _state.decks    = Array.isArray(decks) ? decks : []; }
export function setWishlist(wl)       { _state.wishlist = Array.isArray(wl)    ? wl    : []; }
export function setProfile(p)         { _state.profile  = p && typeof p === "object" ? p : {}; }
export function setSettings(s)        { _state.settings = s && typeof s === "object" ? s : {}; }
export function setSortState(s)       { _state.sortState = { ..._state.sortState, ...s }; }
export function setFbUser(user)       { _state.fbUser   = user; }

// ─── Helpers de estado derivado ──────────────────────────────────────────────

/** Devuelve la sesión mínima para uso en la app */
export function getSession() {
  const u = _state.fbUser;
  if (!u) return null;
  return {
    id:       u.uid,
    email:    u.email,
    username: u.displayName || u.email?.split("@")[0] || "Usuario",
  };
}

/** Snapshot completo del estado (para backups, etc.) */
export function getAppPayload() {
  return {
    cards:     _state.cards,
    decks:     _state.decks,
    wishlist:  _state.wishlist,
    settings:  _state.settings,
    sortState: _state.sortState,
    profile:   _state.profile,
  };
}
