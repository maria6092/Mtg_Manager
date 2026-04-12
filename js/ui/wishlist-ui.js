import { state } from '../core/state.js';
import { saveWishlist } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { escapeHtml, fmtHistLine, updatePriceHistory } from '../core/utils.js';
import { fetchCardExact, fetchOldestPrintingByName, priceTextFromPrices } from '../services/scryfall-service.js';

function haveQtyForWish(w) {
  const nameKey = String(w.name||'').trim().toLowerCase();
  const setKey  = String(w.set||'').trim().toUpperCase();
  const cnKey   = String(w.cn||'').trim();
  if (setKey && cnKey) {
    const exact = state.cards.find(c =>
      String(c.name||'').toLowerCase()===nameKey &&
      String(c.setCode||'').toUpperCase()===setKey &&
      String(c.collectorNumber||'').trim()===cnKey
    );
    return exact ? (exact.qty||1) : 0;
  }
  const byName = state.cards.find(c => String(c.name||'').toLowerCase()===nameKey);
  return byName ? (byName.qty||1) : 0;
}

export function renderWishlist() {
  const list = document.getElementById('wishlistList');
  if (!list) return;
  const q = (document.getElementById('wishQ')?.value||'').trim().toLowerCase();
  let view = state.wishlist.slice();
  if (q) view = view.filter(w => String(w.name||'').toLowerCase().includes(q));
  view.sort((a,b) => (b._addedAt||0)-(a._addedAt||0));

  list.innerHTML = '';
  let covered = 0, missing = 0;
  for (const w of view) {
    const have = haveQtyForWish(w), need = w.qty||1;
    const ok = have >= need;
    if (ok) covered++; else missing++;
    const badgeCls = ok ? 'ok' : (have>0 ? 'warn' : 'bad');
    const hist = (w.priceHist||[]).slice(-5).reverse().map(fmtHistLine).filter(Boolean);
    const row = document.createElement('div');
    row.className = 'cardrow';
    row.innerHTML = `
      <div>
        <b>${escapeHtml(w.qty||1)}x ${escapeHtml(w.name||'')}</b>
        <div class="mini">
          <span class="pill mono">${escapeHtml(String(w.set||'').toUpperCase())} ${escapeHtml(w.cn||'')}</span>
          <span class="pill">${escapeHtml(w.priceText||'')}</span>
          <span class="ownBadge ${badgeCls}">${have}/${need}</span>
        </div>
        ${hist.length ? `<details style="margin-top:6px;"><summary class="small">Historial (${hist.length})</summary><div class="small mono" style="margin-top:6px;line-height:1.5;">${hist.map(x=>escapeHtml(x)).join('<br>')}</div></details>` : ''}
      </div>
      <div class="row" style="gap:6px;justify-content:flex-end;">
        <button class="btn ghost tiny" data-act="toAdd">→ Colección</button>
        <button class="btn danger tiny" data-act="del">🗑️</button>
      </div>
    `;
    row.querySelector('[data-act="del"]').onclick = () => {
      if (!confirm(`¿Eliminar "${w.name}" de deseos?`)) return;
      state.wishlist = state.wishlist.filter(x => x.id !== w.id);
      saveWishlist(); cloudSaveAll(); renderWishlist();
    };
    row.querySelector('[data-act="toAdd"]').onclick = () => {
      const el = id => document.getElementById(id);
      if (el('inName')) el('inName').value = w.name||'';
      if (el('inSet'))  el('inSet').value  = w.set||'';
      if (el('inCn'))   el('inCn').value   = w.cn||'';
      if (el('inQty'))  el('inQty').value  = String(w.qty||1);
      import('./router.js').then(m => m.showPage('cartas'));
    };
    list.appendChild(row);
  }
  const el = id => document.getElementById(id);
  if (el('wishCount'))        el('wishCount').textContent        = String(view.length);
  if (el('wishMissingCount')) el('wishMissingCount').textContent = String(missing);
  if (el('wishCoveredCount')) el('wishCoveredCount').textContent = String(covered);
}

export async function refreshWishlistPrices() {
  for (const w of state.wishlist) {
    try {
      const card = w.set && w.cn ? await fetchCardExact(w.set, w.cn) : await fetchOldestPrintingByName(w.name);
      w.priceText = priceTextFromPrices(card?.prices);
      updatePriceHistory(w, w.priceText);
    } catch {}
  }
  saveWishlist(); cloudSaveAll(); renderWishlist();
}

export function addMissingDeckToWishlist(d) {
  if (!d) return;
  let added = 0;
  for (const it of (d.items||[])) {
    const need = it.qty||1;
    const nameKey = String(it.name||'').toLowerCase();
    const setKey  = String(it.set||'').toUpperCase();
    const cnKey   = String(it.cn||'').trim();
    let have = 0;
    if (setKey && cnKey) {
      const exact = state.cards.find(c => String(c.name||'').toLowerCase()===nameKey && String(c.setCode||'').toUpperCase()===setKey && String(c.collectorNumber||'').trim()===cnKey);
      have = exact?.qty||0;
    } else {
      const byName = state.cards.find(c => String(c.name||'').toLowerCase()===nameKey);
      have = byName?.qty||0;
    }
    if (have >= need) continue;
    const missingQty = Math.max(1, need - have);
    const existing = state.wishlist.find(w => String(w.name||'').toLowerCase()===nameKey && String(w.set||'').toUpperCase()===setKey && String(w.cn||'').trim()===cnKey);
    if (existing) { existing.qty = (existing.qty||1) + missingQty; }
    else state.wishlist.unshift({ id:crypto.randomUUID(), _addedAt:Date.now(), name:it.name, set:setKey, cn:cnKey, qty:missingQty, priceText:'', priceHist:[] });
    added++;
  }
  saveWishlist(); cloudSaveAll(); renderWishlist();
  if (added) { import('./router.js').then(m => m.showPage('deseos')); refreshWishlistPrices(); }
  else alert('No hay cartas faltantes para añadir.');
}

export function initWishlistUI() {
  document.getElementById('btnWishAdd')?.addEventListener('click', () => {
    const name = document.getElementById('wishName')?.value.trim();
    const set  = document.getElementById('wishSet')?.value.trim().toUpperCase()||'';
    const cn   = document.getElementById('wishCn')?.value.trim()||'';
    const qty  = Math.max(1, parseInt(document.getElementById('wishQty')?.value||'1', 10));
    if (!name && !(set && cn)) { alert('Escribe un nombre o pon SetCode + Nº.'); return; }
    state.wishlist.unshift({ id:crypto.randomUUID(), _addedAt:Date.now(), name:name||'', set, cn, qty, priceText:'', priceHist:[] });
    saveWishlist(); cloudSaveAll();
    ['wishName','wishSet','wishCn'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('wishQty').value = '1';
    renderWishlist(); refreshWishlistPrices();
  });
  document.getElementById('btnWishRefresh')?.addEventListener('click', refreshWishlistPrices);
  document.getElementById('wishQ')?.addEventListener('input', renderWishlist);
}