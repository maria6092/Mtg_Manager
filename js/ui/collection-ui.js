import { state } from '../core/state.js';
import { saveCards } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { escapeHtml, gradientFromColorIds, rarityClass, parseEuro, isFav, sortCards } from '../core/utils.js';
import { PASTEL } from '../core/constants.js';

export function renderColeccion() {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const favMode = document.getElementById('colFavFilter')?.value || state.settings.colFavFilter || 'all';
  let view = sortCards(state.cards, state.sortState);
  if (favMode === 'fav')   view = view.filter(c => isFav(c));
  if (favMode === 'nofav') view = view.filter(c => !isFav(c));

  let totalUnits = 0, sumEur = 0;
  for (const c of view) {
    totalUnits += c.qty || 1;
    const eur = parseEuro(c.priceText);
    if (Number.isFinite(eur)) sumEur += eur * (c.qty || 1);
    const bg    = gradientFromColorIds(c.colorId);
    const flags = [c.proxy&&'Proxy', c.foil&&'Foil', c.promo&&'Promo', c.promoPre&&'Pre'].filter(Boolean);
    const el    = document.createElement('div');
    el.className   = 'cCard';
    el.dataset.id  = c.id;
    el.style.backgroundImage = bg || 'none';
    if (!bg) el.style.backgroundColor = PASTEL.C;
    el.innerHTML = `
      <div class="cTop">
        <div>
          <div class="cName">${escapeHtml(c.name||'')}</div>
          <div class="cSub mono">${escapeHtml(c.setCode||'')} · #${escapeHtml(c.collectorNumber||'')} · ${escapeHtml(c.lang||'')}</div>
          <div class="cSub">${escapeHtml(c.type||'')} · ${escapeHtml(c.subtype||'')}</div>
        </div>
        <div class="cRight">
          <button class="starBtn" data-colstar="1">${isFav(c) ? '★' : '☆'}</button>
          ${c.logoUrl ? `<img class="cIcon" src="${escapeHtml(c.logoUrl)}" alt="">` : ''}
        </div>
      </div>
      <div class="cBadges">
        <span class="tag ${rarityClass(c.rarity)}">${escapeHtml(c.rarity||'')}</span>
        <span class="tag">${escapeHtml(c.color||'')}</span>
        <span class="tag mono">${escapeHtml(c.mana||'')}</span>
        <span class="tag mono">MV ${Number.isFinite(c.manaValue) ? c.manaValue : ''}</span>
        ${flags.map(f => `<span class="tag">${f}</span>`).join('')}
      </div>
      <div class="cBody">
        <div class="cField"><div class="k">Cantidad</div><div class="v mono">${c.qty||1}</div></div>
        <div class="cField"><div class="k">Precio</div><div class="v mono">${escapeHtml(c.priceText||'')}</div></div>
        <div class="cField"><div class="k">Mejor venta</div><div class="v mono">${escapeHtml(c.bestSell||'')}</div></div>
      </div>
    `;
    grid.appendChild(el);
  }

  const get = id => document.getElementById(id);
  if (get('colCountCards')) get('colCountCards').textContent = String(view.length);
  if (get('colCountUnits')) get('colCountUnits').textContent = String(totalUnits);
  if (get('colSumEur'))     get('colSumEur').textContent     = sumEur.toFixed(2);
}

let _colFavBound = false;
export function initCollectionListeners() {
  if (_colFavBound) return;
  _colFavBound = true;
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
  grid.addEventListener('click', e => {
    const star = e.target.closest('[data-colstar]'); if (!star) return;
    const cardEl = star.closest('.cCard');
    const id     = cardEl?.dataset?.id; if (!id) return;
    const item   = state.cards.find(x => x.id === id); if (!item) return;
    item.fav = !item.fav;
    saveCards(); cloudSaveAll();
    renderColeccion();
  });
}