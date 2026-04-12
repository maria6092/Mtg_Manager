import { state } from './state.js';
import { loadCards, loadDecks, loadWishlist, loadSettings, loadSortState, getLastTab, clearSession } from './storage.js';
import { normalizeCards, normalizeDecks, normalizeWishlist } from './normalizers.js';
import { applySettings } from './theme.js';
import { initTabs, showPage } from '../ui/router.js';
import { initAuthUI } from '../ui/auth-ui.js';
import { renderCardsTable, updateCardsMetrics } from '../ui/cards-ui.js';
import { renderColeccion } from '../ui/collection-ui.js';
import { renderDecks } from '../ui/decks-ui.js';
import { renderWishlist } from '../ui/wishlist-ui.js';
import { renderStats } from '../ui/stats-ui.js';
import { renderSalesTable } from '../ui/sales-ui.js';
import { renderSearchResults, ensureSearchOptions, loadSearchStateToUI } from '../ui/search-ui.js';
import { initSettingsUI } from '../ui/settings-ui.js';
import { loadIntroSets } from '../ui/intro-ui.js';
import { cloudSaveAll, cloudLoadAll } from '../services/cloud-service.js';
import { updateInvestmentUI } from '../ui/stats-ui.js';

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
      import('../core/storage.js').then(m => m.saveSettings());
      renderColeccion();
    });
  }

  document.getElementById('sortKey').value = state.sortState.key;
  document.getElementById('sortDir').value = state.sortState.dir;
  document.getElementById('btnApplySort').onclick = () => {
    state.sortState.key = document.getElementById('sortKey').value;
    state.sortState.dir = document.getElementById('sortDir').value;
    import('../core/storage.js').then(m => m.saveSortState());
    renderCardsTable();
  };

  document.getElementById('btnSearch').onclick = renderSearchResults;
  document.getElementById('btnClearFilters').onclick = () => {
    ['searchQ','searchSet','searchRarity','searchColors','searchType','searchMvMin','searchMvMax']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderSearchResults();
  };
  ['searchQ','searchSet','searchRarity','searchColors','searchType','searchMvMin','searchMvMax']
    .forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', renderSearchResults);
    });

  document.getElementById('btnRecalcColors')?.addEventListener('click', () => import('../ui/stats-ui.js').then(m => m.renderColorStats()));
  document.getElementById('btnRecalcTypes')?.addEventListener('click',  () => import('../ui/stats-ui.js').then(m => m.renderTypeStats()));
  document.getElementById('btnRecalcMoney')?.addEventListener('click',  updateInvestmentUI);

  document.getElementById('btnClear').onclick = () => {
    if (!confirm('¿Borrar TODAS las cartas?')) return;
    state.cards = [];
    import('../core/storage.js').then(m => m.saveCards());
    renderCardsTable(); updateInvestmentUI(); renderSalesTable();
  };

  const btnCloudSave = document.getElementById('btnManualCloudSave');
  const btnCloudLoad = document.getElementById('btnManualCloudLoad');
  if (btnCloudSave) btnCloudSave.onclick = async () => { const ok = await cloudSaveAll(); alert(ok ? 'Guardado en la nube ✅' : 'Error al guardar.'); };
  if (btnCloudLoad) btnCloudLoad.onclick = async () => {
    const ok = await cloudLoadAll();
    if (ok) { renderCardsTable(); renderDecks(); renderWishlist(); renderSalesTable(); updateInvestmentUI(); alert('Datos cargados ✅'); }
    else alert('No hay datos en la nube o error.');
  };

  showPage(getLastTab());
  renderCardsTable();
  renderDecks();
  updateCardsMetrics();
  updateInvestmentUI();
  renderSalesTable();
  loadIntroSets();
}