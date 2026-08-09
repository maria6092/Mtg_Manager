import { state } from '../core/state.js';

export async function fetchCardExact(setCode, collectorNumber) {
  const url = `https://api.scryfall.com/cards/${encodeURIComponent(String(setCode).toLowerCase())}/${encodeURIComponent(String(collectorNumber))}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.object === 'error') throw new Error(j.details || 'No se encontró esa impresión.');
  return j;
}

export async function fetchCardByName(name) {
  const url = `https://api.scryfall.com/cards/named?game=paper&fuzzy=${encodeURIComponent(name)}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.object === 'error') throw new Error(j.details || 'No se encontró la carta por nombre.');
  return j;
}

export async function fetchOldestPrintingByName(name) {
  const base = await fetchCardByName(name);
  let url = base.prints_search_uri;
  if (!url) return base;
  const all = [];
  let guard = 0;
  while (url && guard < 30) {
    guard++;
    const r = await fetch(url);
    const j = await r.json();
    if (j.object === 'error') throw new Error(j.details);
    if (Array.isArray(j.data)) all.push(...j.data);
    url = j.has_more ? j.next_page : null;
  }
  let oldest = null;
  for (const c of all) {
    if (!c?.released_at) continue;
    if (!oldest || c.released_at < oldest.released_at) oldest = c;
  }
  return oldest || all[0] || base;
}

export async function fetchSetIconUrl(setCode) {
  try {
    const r = await fetch(`https://api.scryfall.com/sets/${encodeURIComponent(String(setCode).toLowerCase())}`);
    const j = await r.json();
    return j.icon_svg_uri || '';
  } catch { return ''; }
}

export function priceTextFromPrices(prices, currency) {
  const cur = currency || (state.settings?.currency) || 'EUR';
  const num = v => (v == null || v === '') ? null : parseFloat(String(v).replace(',','.'));
  const eur = num(prices?.eur) ?? num(prices?.eur_foil);
  const usd = num(prices?.usd) ?? num(prices?.usd_foil);
  if (cur === 'USD') {
    if (Number.isFinite(usd)) return usd.toFixed(2) + '$';
    if (Number.isFinite(eur)) return eur.toFixed(2) + '€';
  } else {
    if (Number.isFinite(eur)) return eur.toFixed(2) + '€';
    if (Number.isFinite(usd)) return usd.toFixed(2) + '$';
  }
  return 'No disponible';
}

export async function fetchAllSets() {
  const r = await fetch('https://api.scryfall.com/sets');
  const j = await r.json();
  if (!Array.isArray(j.data)) throw new Error('Respuesta inválida de sets');
  return j.data.map(s => ({ name: s.name||'', code: String(s.code||'').toUpperCase(), icon: s.icon_svg_uri||'' }));
}