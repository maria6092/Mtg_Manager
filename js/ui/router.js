import { TABS } from '../core/constants.js';
import { setLastTab } from '../core/storage.js';
import { renderCardsTable } from './cards-ui.js';
import { renderColeccion } from './collection-ui.js';
import { renderColorStats, renderTypeStats, updateInvestmentUI } from './stats-ui.js';
import { renderSearchResults } from './search-ui.js';
import { renderDecks } from './decks-ui.js';
import { renderWishlist } from './wishlist-ui.js';
import { renderSalesTable } from './sales-ui.js';
import { initSettingsUI } from './settings-ui.js';

export function setSectionVisibility(tabName) {
  TABS.forEach(t => {
    const sec = document.getElementById('tab_' + t);
    if (sec) sec.style.display = t === tabName ? '' : 'none';
  });
  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
}

export function showPage(id) {
  if (!id || !TABS.includes(id)) id = 'intro';
  setSectionVisibility(id);
  setLastTab(id);
  try {
    if (id === 'cartas')       renderCardsTable();
    if (id === 'stats_colores') renderColorStats();
    if (id === 'stats_tipos')  { renderTypeStats(); updateInvestmentUI(); }
    if (id === 'coleccion')    renderColeccion();
    if (id === 'buscador')     renderSearchResults();
    if (id === 'mazos')        renderDecks();
    if (id === 'deseos')       renderWishlist();
    if (id === 'ventas')       renderSalesTable();
    if (id === 'ajustes')      initSettingsUI();
  } catch(e) { console.error('Error al renderizar', id, e); }
}

export function initTabs() {
  document.getElementById('tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tabbtn');
    if (btn) showPage(btn.dataset.tab);
  });
}