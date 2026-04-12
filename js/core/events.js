import { state } from './state.js';
import { loadCards, loadDecks, loadWishlist, loadSettings, loadSortState, getLastTab, saveSettings, saveSortState } from './storage.js';
import { normalizeCards, normalizeDecks, normalizeWishlist } from './normalizers.js';
import { applySettings } from './themes.js';
import { initTabs, showPage } from '../ui/router.js';
import { initAuthUI } from '../ui/auth-ui.js';
import { renderCardsTable, updateCardsMetrics } from '../ui/cards-ui.js';
import { renderColeccion } from '../ui/collection-ui.js';
import { renderDecks } from '../ui/decks-ui.js';
import { renderWishlist } from '../ui/wishlist-ui.js';
import { renderTypeStats, renderColorStats, updateInvestmentUI } from '../ui/stats-ui.js';
import { renderSalesTable } from '../ui/sales-ui.js';
import { renderSearchResults, ensureSearchOptions, loadSearchStateToUI } from '../ui/search-ui.js';
import { initSettingsUI } from '../ui/settings-ui.js';
import { loadIntroSets } from '../ui/intro-ui.js';
import { cloudSaveAll, cloudLoadAll } from '../services/cloud-service.js';

export function initAppEvents() {
  loadCards(); loadDecks(); loadWishlist(); loadSettings(); loadSortState();
  normalizeCards(); normalizeDecks(); normalizeWishlist();
  applySettings();
  initTabs();
  initAuthUI();
  ensureSearchOptions();
  loadSearchStateToUI();

  const colFavSel = document.getElementById('colFavFilter');
  if (colFavSel) {
    colFavSel.value = state.settings.colFavFilter || 'all';
    colFavSel.addEventListener('change', () => {
      state.settings.colFavFilter = colFavSel.value;
      saveSettings();
      renderColeccion();
    });
  }

  const sortKeyEl = document.getElementById('sortKey');
  const sortDirEl = document.getElementById('sortDir');
  if (sortKeyEl) sortKeyEl.value = state.sortState.key;
  if (sortDirEl) sortDirEl.value = state.sortState.dir;

  document.getElementById('btnApplySort')?.addEventListener('click', () => {
    state.sortState.key = sortKeyEl?.value || 'added';
    state.sortState.dir = sortDirEl?.value || 'desc';
    saveSortState();
    renderCardsTable();
  });

  document.getElementById('btnSearch')?.addEventListener('click', renderSearchResults);
  document.getElementById('btnClearFilters')?.addEventListener('click', () => {
    ['searchQ','searchSet','searchRarity','searchColors','searchType','searchMvMin','searchMvMax']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderSearchResults();
  });
  ['searchQ','searchSet','searchRarity','searchColors','searchType','searchMvMin','searchMvMax']
    .forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', renderSearchResults);
    });

  document.getElementById('btnRecalcColors')?.addEventListener('click', renderColorStats);
  document.getElementById('btnRecalcTypes')?.addEventListener('click',  renderTypeStats);
  document.getElementById('btnRecalcMoney')?.addEventListener('click',  updateInvestmentUI);

  document.getElementById('btnClear')?.addEventListener('click', () => {
    if (!confirm('¿Borrar TODAS las cartas?')) return;
    state.cards = [];
    import('./storage.js').then(m => m.saveCards());
    renderCardsTable(); updateInvestmentUI(); renderSalesTable();
  });

  document.getElementById('btnManualCloudSave')?.addEventListener('click', async () => {
    const ok = await cloudSaveAll();
    alert(ok ? 'Guardado en la nube ✅' : 'Error al guardar.');
  });
  document.getElementById('btnManualCloudLoad')?.addEventListener('click', async () => {
    const ok = await cloudLoadAll();
    if (ok) {
      renderCardsTable(); renderDecks(); renderWishlist();
      renderSalesTable(); updateInvestmentUI();
      alert('Datos cargados ✅');
    } else {
      alert('No hay datos en la nube o error.');
    }
  });

  showPage(getLastTab());
  renderCardsTable();
  renderDecks();
  updateCardsMetrics();
  updateInvestmentUI();
  renderSalesTable();
  loadIntroSets();
}