/**
 * market.js
 * Lógica del mercado entre usuarios: cargar, buscar y gestionar listings.
 */

import { getCurrentUserId } from "../../state/store.js";
import { fbDb } from "../../services/firebase.js";
import { loadMarketOffers, saveMarketOffers } from "../../utils/storage.js";

// ─── Carga del mercado ────────────────────────────────────────────────────────

/**
 * Carga los listings activos desde Firestore (excluye los del usuario actual).
 * @returns {Promise<object[]>}
 */
export async function loadMarket() {
  const uid  = getCurrentUserId();
  const snap = await fbDb.collection("listings")
    .where("isActive", "==", true)
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  const offers = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.sellerId !== uid) {
      offers.push({
        marketId:        d.id,
        sellerId:        data.sellerId,
        sellerName:      data.sellerName   || "Usuario",
        sellerAvatar:    data.sellerAvatar || "assets/logo.png",
        cardId:          data.cardId,
        name:            data.name         || "",
        setCode:         data.setCode      || "",
        collectorNumber: data.collectorNumber || "",
        qty:             data.qty          || 1,
        priceText:       data.priceText    || "",
        bestSell:        data.bestSell     || "",
        foil:            !!data.foil,
        lang:            data.lang         || "",
        imgUrl:          data.imgUrl       || "",
        updatedAt:       data.updatedAt?.toMillis?.() || 0,
      });
    }
  });

  saveMarketOffers(offers);
  return offers;
}

/** Devuelve los listings cacheados localmente */
export function getCachedMarket() {
  return loadMarketOffers();
}

// ─── Filtrado ─────────────────────────────────────────────────────────────────

/**
 * Filtra los listings por query de texto libre.
 * @param {object[]} offers
 * @param {string} query
 */
export function filterMarket(offers, query) {
  if (!query) return offers;
  const q = String(query).trim().toLowerCase();
  return offers.filter(o =>
    String(o.name || "").toLowerCase().includes(q) ||
    String(o.setCode || "").toLowerCase().includes(q) ||
    String(o.sellerName || "").toLowerCase().includes(q)
  );
}

// ─── Sync del vendedor ────────────────────────────────────────────────────────

/**
 * Sincroniza las cartas en venta del usuario actual al caché local del mercado.
 * (Función rápida y sincrónica — no toca Firestore.)
 * @param {object[]} cards - Lista de cartas del usuario
 * @param {string} sellerName
 * @param {string} sellerAvatar
 */
export function syncCurrentUserSalesToLocalMarket(cards, sellerName, sellerAvatar) {
  const uid = getCurrentUserId();
  if (!uid) return;

  const market = loadMarketOffers().filter(x => x.sellerId !== uid);
  const offers = cards
    .filter(c => !!c.sale)
    .map(c => ({
      marketId:        `${uid}__${c.id}`,
      sellerId:        uid,
      sellerName:      sellerName  || "Usuario",
      sellerAvatar:    sellerAvatar || "assets/logo.png",
      cardId:          c.id,
      name:            c.name           || "",
      setCode:         c.setCode        || "",
      collectorNumber: c.collectorNumber|| "",
      qty:             c.qty            || 1,
      priceText:       c.priceText      || "",
      bestSell:        c.bestSell       || "",
      foil:            !!c.foil,
      updatedAt:       Date.now(),
    }));

  saveMarketOffers(market.concat(offers));
}
