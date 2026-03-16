/**
 * decks.js
 * Lógica de mazos: carga, guardado, CRUD y normalización.
 */

import { getDecks, setDecks } from "../../state/store.js";
import { userLoad, userSave, LS_DECKS, OLD_DECK_KEYS } from "../../utils/storage.js";

// ─── Normalización ────────────────────────────────────────────────────────────

export function normalizeDecks(decks) {
  let changed = false;
  for (const d of decks) {
    if (!d.id)                              { d.id = crypto.randomUUID(); changed = true; }
    if (!d.name)                            { d.name = "Mazo"; changed = true; }
    if (!Array.isArray(d.items))            { d.items = []; changed = true; }
    if (typeof d.commander === "undefined") { d.commander = null; changed = true; }
    if (typeof d._createdAt !== "number")   { d._createdAt = Date.now(); changed = true; }
    if (typeof d._updatedAt !== "number")   { d._updatedAt = Date.now(); changed = true; }

    if (d.commander && typeof d.commander === "object") {
      if (!d.commander.name) {
        d.commander = null;
        changed = true;
      } else {
        d.commander.set = String(d.commander.set || "").toUpperCase();
        d.commander.cn  = String(d.commander.cn  || "");
        d.commander.key = (d.commander.set && d.commander.cn)
          ? `${d.commander.set}#${d.commander.cn}`
          : "";
      }
    }
  }
  return changed;
}

// ─── Carga ────────────────────────────────────────────────────────────────────

export function loadDecks() {
  const data = userLoad(LS_DECKS, [], OLD_DECK_KEYS);
  setDecks(data);
  normalizeDecks(getDecks());
  return getDecks();
}

// ─── Guardado ────────────────────────────────────────────────────────────────

export function saveDecks() {
  userSave(LS_DECKS, getDecks());
}

export function touchDeck(deck) {
  deck._updatedAt = Date.now();
}

// ─── Nombres únicos ───────────────────────────────────────────────────────────

export function uniqueDeckName(name) {
  const base = String(name || "Mazo").trim() || "Mazo";
  const decks = getDecks();
  if (!decks.some(d => d.name.toLowerCase() === base.toLowerCase())) return base;
  let i = 2;
  while (true) {
    const candidate = `${base} (${i})`;
    if (!decks.some(d => d.name.toLowerCase() === candidate.toLowerCase())) return candidate;
    i++;
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function createDeck(name = "Nuevo mazo") {
  const deck = {
    id:         crypto.randomUUID(),
    name:       uniqueDeckName(name),
    items:      [],
    commander:  null,
    _createdAt: Date.now(),
    _updatedAt: Date.now(),
  };
  const decks = getDecks();
  decks.push(deck);
  saveDecks();
  return deck;
}

export function deleteDeck(deckId) {
  setDecks(getDecks().filter(d => d.id !== deckId));
  saveDecks();
}

export function renameDeck(deckId, newName) {
  const deck = getDecks().find(d => d.id === deckId);
  if (!deck) return false;
  deck.name = uniqueDeckName(newName);
  touchDeck(deck);
  saveDecks();
  return true;
}

export function cloneDeck(deckId) {
  const original = getDecks().find(d => d.id === deckId);
  if (!original) return null;
  const clone = JSON.parse(JSON.stringify(original));
  clone.id         = crypto.randomUUID();
  clone.name       = uniqueDeckName(`${original.name} (copia)`);
  clone._createdAt = Date.now();
  clone._updatedAt = Date.now();
  const decks = getDecks();
  decks.push(clone);
  saveDecks();
  return clone;
}

export function getDeckById(deckId) {
  return getDecks().find(d => d.id === deckId) || null;
}

// ─── Items del mazo ───────────────────────────────────────────────────────────

export function addCardToDeck(deckId, { name, set, cn, qty = 1 }) {
  const deck = getDeckById(deckId);
  if (!deck) return false;

  const S = String(set || "").toUpperCase();
  const N = String(cn  || "").trim();
  const nm = String(name || "").trim();
  const key = (S && N) ? `${S}#${N}` : "";

  const existing = deck.items.find(it => {
    const sameRef  = key && it.key === key;
    const sameName = it.name.toLowerCase() === nm.toLowerCase();
    return (sameRef && sameName) || (!key && !it.key && sameName);
  });

  if (existing) {
    existing.qty += qty;
  } else {
    deck.items.push({ key: key || nm, name: nm, set: S, cn: N, qty });
  }

  touchDeck(deck);
  saveDecks();
  return true;
}

export function removeCardFromDeck(deckId, cardKey) {
  const deck = getDeckById(deckId);
  if (!deck) return false;
  deck.items = deck.items.filter(it => it.key !== cardKey);
  touchDeck(deck);
  saveDecks();
  return true;
}

export function setDeckCommander(deckId, { name, set, cn }) {
  const deck = getDeckById(deckId);
  if (!deck) return false;
  const S = String(set || "").toUpperCase();
  const N = String(cn  || "").trim();
  deck.commander = {
    name: String(name || "").trim(),
    set:  S,
    cn:   N,
    key:  (S && N) ? `${S}#${N}` : String(name || "").trim(),
  };
  touchDeck(deck);
  saveDecks();
  return true;
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export function parseDecksJson(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON inválido: no es un array de mazos.");

  const normalizeCardRef = it => {
    const set  = String(it?.set  || "").toUpperCase();
    const cn   = String(it?.cn   || "").trim();
    const name = String(it?.name || "").trim();
    const qty  = Math.max(1, parseInt(it?.qty || "1", 10));
    const key  = it?.key || ((set && cn) ? `${set}#${cn}` : name);
    return { key, name, set, cn, qty };
  };

  const normalizeCommander = c => {
    if (!c) return null;
    const name = String(c.name || "").trim();
    const set  = String(c.set  || "").toUpperCase();
    const cn   = String(c.cn   || "").trim();
    const key  = c.key || ((set && cn) ? `${set}#${cn}` : name);
    if (!name && !key) return null;
    return { name, set, cn, key };
  };

  data.forEach(d => {
    d.name       = String(d.name || "Mazo").trim() || "Mazo";
    d.items      = Array.isArray(d.items) ? d.items.map(normalizeCardRef) : [];
    d.commander  = normalizeCommander(d.commander);
    if (typeof d._createdAt !== "number") d._createdAt = Date.now();
    if (typeof d._updatedAt !== "number") d._updatedAt = Date.now();
  });

  return data;
}
