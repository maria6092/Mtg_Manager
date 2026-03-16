/**
 * storage.js
 * Helpers de localStorage con scoping por usuario.
 * Toda la capa de persistencia local pasa por aquí.
 */

import { getCurrentUserId } from "../state/store.js";

// ─── Claves de localStorage ───────────────────────────────────────────────────
export const LS_KEY          = "mtg_rosita_cards_v9";
export const LS_DECKS        = "mtg_rosita_decks_v9";
export const LS_WISHLIST     = "mtg_rosita_wishlist_v1";
export const LS_PROFILE      = "mtg_rosita_profile_v1";
export const LS_SOCIAL       = "mtg_rosita_social_v1";
export const LS_MARKET       = "mtg_rosita_market_v1";
export const LS_SETTINGS     = "mtg_rosita_settings_v9";
export const LS_SORT         = "mtg_rosita_sort_v9";
export const LAST_TAB_KEY    = "mtg_rosita_last_tab_v9";
export const LS_SEARCH       = "mtg_rosita_search_v9";
export const LS_BACKUP_LAST  = "mtg_rosita_backup_last_v1";
export const LS_BACKUP_HISTORY = "mtg_rosita_backup_history_v1";

// Claves antiguas para migración
export const OLD_CARD_KEYS = [
  "mtg_rosita_cards_v8","mtg_rosita_cards_v7","mtg_rosita_cards_v6",
  "mtg_rosita_cards_v5","mtg_rosita_cards_v4","mtg_rosita_cards_v3",
];
export const OLD_DECK_KEYS = [
  "mtg_rosita_decks_v8","mtg_rosita_decks_v7","mtg_rosita_decks_v6",
  "mtg_rosita_decks_v5","mtg_rosita_decks_v4","mtg_rosita_decks_v3",
];

// ─── Helpers base ────────────────────────────────────────────────────────────

/** Genera clave con scope de usuario: "base__uid" */
export function scopedKey(base, userId = getCurrentUserId()) {
  return userId ? `${base}__${userId}` : base;
}

/** Carga un valor de localStorage parseado como JSON */
export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch {}
  return fallback;
}

/** Guarda un valor en localStorage serializado como JSON */
export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[storage] saveJson error:", e);
  }
}

/**
 * Carga datos con scope de usuario + fallback a claves legacy.
 * Orden de prioridad: scoped → global → oldKeys → fallback
 */
export function userLoad(baseKey, fallback, oldKeys = []) {
  const uid = getCurrentUserId();

  // 1. Buscar con scope de usuario actual
  if (uid) {
    const scoped = loadJson(scopedKey(baseKey, uid), undefined);
    if (typeof scoped !== "undefined") return scoped;
  }

  // 2. Buscar sin scope (datos previos a login)
  const global = loadJson(baseKey, undefined);
  if (typeof global !== "undefined") return global;

  // 3. Claves antiguas (migración)
  for (const k of oldKeys) {
    const old = loadJson(k, undefined);
    if (typeof old !== "undefined") return old;
  }

  return fallback;
}

/** Guarda con scope del usuario actual */
export function userSave(baseKey, value) {
  saveJson(scopedKey(baseKey), value);
}

// ─── Market helpers ──────────────────────────────────────────────────────────
export function loadMarketOffers() {
  return loadJson(LS_MARKET, []);
}

export function saveMarketOffers(list) {
  saveJson(LS_MARKET, Array.isArray(list) ? list : []);
}

// ─── Social helpers ──────────────────────────────────────────────────────────
export function loadSocial() {
  const raw = loadJson(LS_SOCIAL, {});
  return {
    requests:    Array.isArray(raw?.requests)    ? raw.requests    : [],
    friendships: Array.isArray(raw?.friendships) ? raw.friendships : [],
  };
}

export function saveSocial(data) {
  saveJson(LS_SOCIAL, {
    requests:    Array.isArray(data?.requests)    ? data.requests    : [],
    friendships: Array.isArray(data?.friendships) ? data.friendships : [],
  });
}

// ─── Tab helpers ─────────────────────────────────────────────────────────────
export function getLastTab() {
  return localStorage.getItem(LAST_TAB_KEY) || "coleccion";
}

export function setLastTab(tab) {
  localStorage.setItem(LAST_TAB_KEY, tab);
}
