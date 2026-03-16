/**
 * collection.js
 * Lógica de la colección de cartas: carga, guardado, normalización,
 * añadir, editar, eliminar y persistencia.
 */

import { getCards, setCards, getCurrentUserId } from "../../state/store.js";
import { userLoad, userSave, LS_KEY, OLD_CARD_KEYS } from "../../utils/storage.js";
import { fbDb } from "../../services/firebase.js";

// ─── Defaults y normalización ─────────────────────────────────────────────────

export function normalizeCards(cards) {
  let changed = false;
  for (const c of cards) {
    if (!c || typeof c !== "object") continue;
    const b = (c.fav === true || c.fav === 1 || c.fav === "1" || String(c.fav).toLowerCase() === "true");
    if (c.fav !== b) { c.fav = b; changed = true; }
    if (!c.id) { c.id = crypto.randomUUID(); changed = true; }
    if (typeof c._addedAt !== "number") { c._addedAt = Date.now(); changed = true; }
  }
  return changed;
}

// ─── Carga ────────────────────────────────────────────────────────────────────

export function loadCards() {
  const data = userLoad(LS_KEY, [], OLD_CARD_KEYS);
  setCards(data);
  normalizeCards(getCards());
  return getCards();
}

// ─── Guardado ────────────────────────────────────────────────────────────────

export function saveCards() {
  userSave(LS_KEY, getCards());
  // Sincronizar listings en Firestore (async, sin bloquear UI)
  const uid = getCurrentUserId();
  if (uid) {
    syncSaleCardsToFirestore().catch(() => {});
  }
}

// ─── CRUD cartas ─────────────────────────────────────────────────────────────

/** Añade una carta al estado y la persiste */
export function addCard(cardData) {
  const cards = getCards();
  cards.unshift({ ...cardData, id: cardData.id || crypto.randomUUID(), _addedAt: Date.now() });
  saveCards();
}

/** Elimina una carta por ID */
export function deleteCard(cardId) {
  const cards = getCards().filter(c => c.id !== cardId);
  setCards(cards);
  saveCards();
}

/** Actualiza campos de una carta existente */
export function updateCard(cardId, changes) {
  const cards = getCards();
  const idx = cards.findIndex(c => c.id === cardId);
  if (idx === -1) return false;
  cards[idx] = { ...cards[idx], ...changes, _updatedAt: Date.now() };
  saveCards();
  return true;
}

/** Toggle favorito */
export function toggleFav(cardId) {
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  card.fav = !card.fav;
  saveCards();
}

// ─── Sync con Firestore ───────────────────────────────────────────────────────

/**
 * Publica una carta en venta en Firestore (colección global "listings").
 */
async function publishSaleListing(card) {
  const uid = getCurrentUserId();
  if (!uid) return;
  const docId = `${uid}__${card.id}`;
  await fbDb.collection("listings").doc(docId).set({
    sellerId:        uid,
    cardId:          card.id,
    name:            card.name || "",
    setCode:         card.setCode || "",
    collectorNumber: card.collectorNumber || "",
    qty:             card.qty || 1,
    priceText:       card.priceText || "",
    bestSell:        card.bestSell || "",
    foil:            !!card.foil,
    lang:            card.lang || "es",
    imgUrl:          card.imgUrl || "",
    isActive:        true,
    updatedAt:       firebase.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Elimina un listing de Firestore.
 */
async function removeSaleListing(cardId) {
  const uid = getCurrentUserId();
  if (!uid) return;
  await fbDb.collection("listings").doc(`${uid}__${cardId}`).delete();
}

/**
 * Sincroniza todas las cartas en venta del usuario con Firestore.
 */
export async function syncSaleCardsToFirestore() {
  const uid = getCurrentUserId();
  if (!uid) return;

  const forSale = getCards().filter(c => !!c.sale);
  await Promise.all(forSale.map(c => publishSaleListing(c)));

  // Eliminar listings que ya no están en venta
  const snap = await fbDb.collection("listings").where("sellerId", "==", uid).get();
  const activeIds = new Set(forSale.map(c => `${uid}__${c.id}`));
  const toDelete = snap.docs.filter(d => !activeIds.has(d.id));
  await Promise.all(toDelete.map(d => d.ref.delete()));
}

// ─── Queries útiles ──────────────────────────────────────────────────────────

/** Busca una carta por set + collector number */
export function findCardByRef(setCode, cn) {
  const S = String(setCode || "").toUpperCase();
  const N = String(cn || "").trim();
  return getCards().find(c =>
    String(c.setCode || "").toUpperCase() === S &&
    String(c.collectorNumber || "").trim() === N
  ) || null;
}

/** Cuántas copias tiene el usuario de una carta (por nombre, set y cn) */
export function ownedQty(name, setCode, cn) {
  const nameKey = String(name || "").trim().toLowerCase();
  const setKey  = String(setCode || "").trim().toUpperCase();
  const cnKey   = String(cn || "").trim();

  if (setKey && cnKey) {
    const exact = getCards().find(c =>
      String(c.name || "").trim().toLowerCase() === nameKey &&
      String(c.setCode || "").trim().toUpperCase() === setKey &&
      String(c.collectorNumber || "").trim() === cnKey
    );
    return exact ? (exact.qty || 1) : 0;
  }

  const byName = getCards().find(c =>
    String(c.name || "").trim().toLowerCase() === nameKey
  );
  return byName ? (byName.qty || 1) : 0;
}
