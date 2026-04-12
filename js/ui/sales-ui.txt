import { state } from '../core/state.js';
import { saveCards } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { escapeHtml, gradientFromColorIds } from '../core/utils.js';
import { PASTEL } from '../core/constants.js';
import { renderCardsTable, updateCardsMetrics } from './cards-ui.js';
import { updateInvestmentUI } from './stats-ui.js';

export function renderSalesTable() {
  const tbody = document.querySelector('#tblSales tbody');
  const pill  = document.getElementById('salesCountPill');
  if (!tbody) return;
  const list = state.cards.filter(c => !!c.sale);
  if (pill) pill.textContent = 'En venta: ' + list.reduce((a,c) => a+(c.qty||1), 0);
  tbody.innerHTML = '';
  for (const c of list) {
    const bg = gradientFromColorIds(c.colorId);
    const tr = document.createElement('tr');
    tr.dataset.id = c.id;
    tr.style.backgroundImage = bg || 'none';
    if (!bg) tr.style.backgroundColor = PASTEL.C;
    tr.innerHTML = `
      <td class="center"><button class="starBtn" data-star="1">${c.fav?'★':'☆'}</button></td>
      <td><b>${escapeHtml(c.name)}</b><div class="small">${escapeHtml(c.inputName||'')}</div></td>
      <td class="mono">${escapeHtml(c.setCode||'')}</td>
      <td class="mono">${escapeHtml(c.collectorNumber||'')}</td>
      <td class="right mono">${c.qty||1}</td>
      <td class="right mono">${escapeHtml(c.priceText||'')}</td>
      <td class="right mono">${escapeHtml(c.bestSell||'')}</td>
      <td class="right"><button class="btn ghost" data-sold="1">Vendida</button></td>
    `;
    tbody.appendChild(tr);
  }
}

export function initSalesListeners() {
  const tbody = document.querySelector('#tblSales tbody');
  if (!tbody) return;
  tbody.addEventListener('click', e => {
    if (e.target.closest('[data-star]')) {
      const tr = e.target.closest('tr[data-id]');
      if (tr) {
        const item = state.cards.find(x => x.id === tr.dataset.id);
        if (item) { item.fav = !item.fav; saveCards(); cloudSaveAll(); renderCardsTable(); renderSalesTable(); }
      }
      return;
    }
    if (e.target.closest('[data-sold]')) {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const item = state.cards.find(x => x.id === tr.dataset.id);
      if (!item) return;
      item.qty = Math.max(0, (item.qty||1) - 1);
      if (item.qty <= 0) state.cards = state.cards.filter(x => x.id !== item.id);
      saveCards(); cloudSaveAll();
      renderCardsTable(); renderSalesTable(); updateCardsMetrics(); updateInvestmentUI();
    }
  });
}