import { state } from '../core/state.js';
import { STORAGE_KEYS } from '../core/constants.js';
import { escapeHtml, rarityClass, normalizeColorId, mainTypeBucket, parseEuro } from '../core/utils.js';
import { showPage } from './router.js';

function buildColorComboOptions() {
  const colors = ['W','U','B','R','G'];
  const out = [];
  for (let mask = 1; mask < (1<<colors.length); mask++) {
    let s = '';
    for (let i = 0; i < colors.length; i++) if (mask&(1<<i)) s += colors[i];
    out.push(s);
  }
  return out.sort((a,b) => a.length-b.length || a.localeCompare(b));
}

export function ensureSearchOptions() {
  const sel = document.getElementById('searchColors');
  if (!sel || sel.dataset.ready === '1') return;
  const options = [
    { v:'', t:'(cualquiera)' }, { v:'C', t:'Incoloro' },
    ...buildColorComboOptions().map(s => ({ v:s, t:s }))
  ];
  sel.innerHTML = options.map(o => `<option value="${o.v}">${o.t}</option>`).join('');
  sel.dataset.ready = '1';
}

function colorMatchExact(combo, colorId) {
  const ids = normalizeColorId(colorId).join('');
  if (combo === 'C') return ids === '';
  return ids === combo;
}

export function loadSearchStateToUI() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.search) || 'null');
    if (!s) return;
    const el = id => document.getElementById(id);
    if (el('searchQ'))      el('searchQ').value      = s.q  || '';
    if (el('searchSet'))    el('searchSet').value    = s.set || '';
    if (el('searchRarity')) el('searchRarity').value = s.rarity || '';
    if (el('searchColors')) el('searchColors').value = s.colors || '';
    if (el('searchType'))   el('searchType').value   = s.type  || '';
    if (el('searchMvMin'))  el('searchMvMin').value  = s.mvMin ?? '';
    if (el('searchMvMax'))  el('searchMvMax').value  = s.mvMax ?? '';
  } catch {}
}

export function renderSearchResults() {
  ensureSearchOptions();
  const el = id => document.getElementById(id);
  const q      = (el('searchQ')?.value||'').trim().toLowerCase();
  const set    = (el('searchSet')?.value||'').trim().toUpperCase();
  const rar    = el('searchRarity')?.value || '';
  const col    = el('searchColors')?.value || '';
  const type   = el('searchType')?.value   || '';
  const mvMin  = el('searchMvMin')?.value === '' ? null : Math.max(0, parseFloat(el('searchMvMin').value));
  const mvMax  = el('searchMvMax')?.value === '' ? null : Math.max(0, parseFloat(el('searchMvMax').value));

  try { localStorage.setItem(STORAGE_KEYS.search, JSON.stringify({ q, set, rarity:rar, colors:col, type, mvMin, mvMax })); } catch {}

  const res = state.cards.filter(c => {
    const okQ  = !q   || String(c.name||'').toLowerCase().includes(q) || String(c.inputName||'').toLowerCase().includes(q);
    const okS  = !set || (c.setCode||'') === set;
    const okR  = !rar || (c.rarity||'') === rar;
    const okC  = !col || colorMatchExact(col, c.colorId);
    const okT  = !type|| mainTypeBucket(c.type) === type;
    const mv   = typeof c.manaValue==='number'&&Number.isFinite(c.manaValue) ? c.manaValue : null;
    const okMV = (mvMin==null||(mv!=null&&mv>=mvMin)) && (mvMax==null||(mv!=null&&mv<=mvMax));
    return okQ && okS && okR && okC && okT && okMV;
  });

  const countEl = document.getElementById('searchCount');
  if (countEl) countEl.textContent = String(res.length);

  const box = document.getElementById('searchResults');
  if (!box) return;
  box.innerHTML = '';
  if (!res.length) { box.innerHTML = "<div class='hint'>No hay resultados.</div>"; return; }

  res.slice().sort((a,b) => String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'}))
    .slice(0,150).forEach(c => {
      const div = document.createElement('div');
      div.className = 'cardrow';
      div.innerHTML = `
        <div>
          <b>${escapeHtml(c.name)}</b>
          <div class="mini">
            <span class="mono">${escapeHtml(c.setCode)} #${escapeHtml(c.collectorNumber)}</span>
            <span>${escapeHtml(c.color||'')}</span>
            <span class="pill">MV: <b class="mono">${Number.isFinite(c.manaValue)?c.manaValue:'?'}</b></span>
            <span class="tag ${rarityClass(c.rarity)}">${escapeHtml(c.rarity||'')}</span>
            <span class="mono">${escapeHtml(c.priceText||'')}</span>
          </div>
        </div>
        ${c.logoUrl ? `<img class="icon" src="${escapeHtml(c.logoUrl)}" alt="">` : ''}
      `;
      div.onclick = () => showPage('cartas');
      box.appendChild(div);
    });
}