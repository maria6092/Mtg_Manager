import { state } from '../core/state.js';
import { saveCards } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { fetchCardExact, fetchOldestPrintingByName, fetchSetIconUrl, priceTextFromPrices } from '../services/scryfall-service.js';
import { escapeHtml, gradientFromColorIds, rarityClass, manaToEmojis, typesEs, colorToEmojisFromCI, computeColorId, manaValueFromCard, updatePriceHistory, bestSellPriceText, toTitleCase, parseEuro, PASTEL, isFav } from '../core/utils.js';
import { RARITY_MAP, PASTEL as P } from '../core/constants.js';
import { renderSalesTable } from './sales-ui.js';
import { updateInvestmentUI } from './stats-ui.js';

function sortedCardsView() {
  const { key, dir } = state.sortState;
  const mult = dir === 'asc' ? 1 : -1;
  const rarityOrder = { 'Común':1,'Poco común':2,'Rara':3,'Mítica':4,'Especial':5 };
  return [...state.cards].sort((a,b) => {
    const val = obj => {
      if (key === 'added')  return obj._addedAt || 0;
      if (key === 'name')   return String(obj.name||'');
      if (key === 'set')    return String(obj.setCode||'');
      if (key === 'price')  { const p = parseEuro(obj.priceText); return Number.isFinite(p) ? p : -1; }
      if (key === 'mv')     return Number.isFinite(obj.manaValue) ? obj.manaValue : -1;
      if (key === 'rarity') return rarityOrder[obj.rarity] || 999;
      if (key === 'qty')    return obj.qty || 1;
      return 0;
    };
    const A = val(a), B = val(b);
    if (typeof A === 'string') return String(A).localeCompare(String(B),'es',{sensitivity:'base'}) * mult;
    return (A === B ? 0 : A < B ? -1 : 1) * mult;
  });
}

export function updateCardsMetrics() {
  let totalUnits = 0, sumEur = 0;
  for (const c of state.cards) {
    totalUnits += c.qty || 1;
    const eur = parseEuro(c.priceText);
    if (Number.isFinite(eur)) sumEur += eur * (c.qty||1);
  }
  const el = id => document.getElementById(id);
  if (el('countCards')) el('countCards').textContent = String(state.cards.length);
  if (el('countUnits')) el('countUnits').textContent = String(totalUnits);
  if (el('sumEur'))     el('sumEur').textContent     = sumEur.toFixed(2);
}

export function renderCardsTable() {
  const tbody = document.querySelector('#tbl tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (const c of sortedCardsView()) {
    const bg = gradientFromColorIds(c.colorId);
    const tr = document.createElement('tr');
    tr.dataset.id = c.id;
    tr.style.backgroundImage = bg || 'none';
    if (!bg) tr.style.backgroundColor = P.C || '#FFFFFF';
    tr.innerHTML = `
      <td class="center"><button class="starBtn" data-star="1">${c.fav ? '★' : '☆'}</button></td>
      <td><b>${escapeHtml(c.name)}</b><div class="small">${escapeHtml(c.inputName||'')}</div></td>
      <td class="mono">${escapeHtml(c.setCode||'')}</td>
      <td class="mono">${escapeHtml(c.collectorNumber||'')}</td>
      <td>${escapeHtml(c.type||'')}</td>
      <td>${escapeHtml(c.subtype||'')}</td>
      <td>${escapeHtml(c.color||'')}</td>
      <td>${escapeHtml(c.mana||'')}</td>
      <td class="mono">${Number.isFinite(c.manaValue) ? c.manaValue : ''}</td>
      <td><span class="tag ${rarityClass(c.rarity)}">${escapeHtml(c.rarity||'')}</span></td>
      <td>${c.logoUrl ? `<img class="icon" src="${escapeHtml(c.logoUrl)}" alt="">` : ''}</td>
      <td class="right mono">${escapeHtml(c.priceText||'')}</td>
      <td><input class="chk" type="checkbox" ${c.proxy?'checked':''} data-k="proxy"></td>
      <td><input class="chk" type="checkbox" ${c.foil?'checked':''} data-k="foil"></td>
      <td><input class="chk" type="checkbox" ${c.promo?'checked':''} data-k="promo"></td>
      <td><input class="chk" type="checkbox" ${c.promoPre?'checked':''} data-k="promoPre"></td>
      <td>
        <select data-k="lang">
          ${['es','en','fr','de','it','pt','ja','ko','zhs','zht'].map(l=>`<option value="${l}" ${c.lang===l?'selected':''}>${l}</option>`).join('')}
        </select>
      </td>
      <td class="right"><input type="number" min="1" value="${c.qty||1}" style="width:70px" data-k="qty"></td>
      <td class="right mono">${escapeHtml(c.bestSell||'')}</td>
      <td class="center"><input class="chk" type="checkbox" ${c.sale?'checked':''} data-k="sale"></td>
      <td class="right"><button class="btn ghost" data-del="1">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  }
  updateCardsMetrics();
}

export function initCardsTableListeners() {
  const tbody = document.querySelector('#tbl tbody');
  if (!tbody) return;

  tbody.addEventListener('change', e => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const item = state.cards.find(x => x.id === tr.dataset.id);
    if (!item) return;
    const k = e.target.dataset.k;
    if (!k) return;
    if (e.target.type === 'checkbox') item[k] = e.target.checked;
    else if (k === 'qty') item.qty = Math.max(1, parseInt(e.target.value||'1', 10));
    else item[k] = e.target.value;
    saveCards(); cloudSaveAll();
    updateCardsMetrics(); updateInvestmentUI(); renderSalesTable();
  });

  tbody.addEventListener('click', e => {
    if (e.target.closest('[data-star]')) {
      const tr = e.target.closest('tr[data-id]');
      if (tr) {
        const item = state.cards.find(x => x.id === tr.dataset.id);
        if (item) { item.fav = !item.fav; saveCards(); cloudSaveAll(); renderCardsTable(); renderSalesTable(); }
      }
      return;
    }
    if (e.target.closest('[data-del]')) {
      const tr = e.target.closest('tr[data-id]');
      if (tr) {
        state.cards = state.cards.filter(x => x.id !== tr.dataset.id);
        saveCards(); cloudSaveAll();
        tr.remove(); updateCardsMetrics(); updateInvestmentUI(); renderSalesTable();
      }
    }
  });
}

export function initAddCardButton() {
  const errBox = document.getElementById('errBox');
  const showErr = msg => { if (errBox) { errBox.style.display = msg ? 'block' : 'none'; errBox.textContent = msg || ''; } };

  document.getElementById('btnAdd')?.addEventListener('click', async () => {
    showErr('');
    const inputName = toTitleCase(document.getElementById('inName').value);
    const setCodeRaw = document.getElementById('inSet').value.trim();
    const cnRaw = document.getElementById('inCn').value.trim();
    const lang = document.getElementById('inLang').value;
    const qty = Math.max(1, parseInt(document.getElementById('inQty').value||'1', 10));
    const proxy    = !!document.getElementById('inProxy').checked;
    const foil     = !!document.getElementById('inFoil').checked;
    const promo    = !!document.getElementById('inPromo').checked;
    const promoPre = !!document.getElementById('inPromoPre').checked;
    const sale     = !!document.getElementById('inSale')?.checked;

    const hasExact = !!setCodeRaw && !!cnRaw;
    if (!hasExact && !inputName) { showErr('Falta el nombre de la carta.'); return; }

    try {
      let card = hasExact ? await fetchCardExact(setCodeRaw, cnRaw) : await fetchOldestPrintingByName(inputName);
      const t = typesEs(card.type_line);
      const price = priceTextFromPrices(card.prices);
      const logoUrl = await fetchSetIconUrl(card.set);
      const colorId = computeColorId(card);
      const mv = manaValueFromCard(card);

      const newItem = {
        id: crypto.randomUUID(), _addedAt: Date.now(), inputName,
        name: card.name || inputName,
        setCode: String(card.set || setCodeRaw || '').toUpperCase(),
        collectorNumber: String(card.collector_number || cnRaw || ''),
        type: t.main, subtype: t.sub,
        colorId, color: colorToEmojisFromCI(colorId),
        mana: manaToEmojis(card.mana_cost || card.card_faces?.[0]?.mana_cost || ''),
        manaValue: mv,
        rarity: RARITY_MAP[card.rarity] || card.rarity || '',
        logoUrl, priceText: price, priceHist: [],
        proxy, foil, promo, promoPre, lang, qty,
        bestSell: bestSellPriceText(price), fav: false, sale
      };
      updatePriceHistory(newItem, newItem.priceText);
      state.cards.unshift(newItem);
      saveCards(); cloudSaveAll();

      ['inName','inSet','inCn'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
      document.getElementById('inQty').value = '1';
      document.getElementById('inProxy').checked = false;
      document.getElementById('inFoil').checked  = false;
      document.getElementById('inPromo').checked = false;
      if (document.getElementById('inPromoPre')) document.getElementById('inPromoPre').checked = false;
      if (document.getElementById('inSale'))     document.getElementById('inSale').checked = false;

      renderCardsTable(); import('./collection-ui.js').then(m => m.renderColeccion());
    } catch(e) { showErr('Error: ' + (e?.message || e)); }
  });

  document.getElementById('btnRefreshPrices')?.addEventListener('click', async () => {
    showErr('');
    for (const c of state.cards) {
      try {
        if (!c.setCode || !c.collectorNumber) continue;
        const card = await fetchCardExact(c.setCode, c.collectorNumber);
        c.priceText = priceTextFromPrices(card.prices);
        updatePriceHistory(c, c.priceText);
        c.bestSell = bestSellPriceText(c.priceText);
        c.colorId  = computeColorId(card);
        c.color    = colorToEmojisFromCI(c.colorId);
        c.manaValue = manaValueFromCard(card);
      } catch {}
    }
    saveCards(); cloudSaveAll();
    renderCardsTable(); updateInvestmentUI(); renderSalesTable();
  });

  document.getElementById('btnExport')?.addEventListener('click', () => {
    const { downloadFile } = import('../core/utils.js').then(m => {
      m.downloadFile('cartas_mtg.json', JSON.stringify(state.cards, null, 2));
    });
  });

  document.getElementById('btnImport')?.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = async () => {
      const f = inp.files?.[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!Array.isArray(data)) throw new Error('No es un array.');
        data.forEach(it => {
          if (!Array.isArray(it.colorId)) it.colorId = [];
          it.color = colorToEmojisFromCI(it.colorId);
          if (typeof it._addedAt !== 'number') it._addedAt = Date.now();
          if (typeof it.manaValue !== 'number') it.manaValue = 0;
        });
        state.cards = data;
        saveCards(); cloudSaveAll();
        renderCardsTable(); updateInvestmentUI(); renderSalesTable();
      } catch(e) { alert('No se pudo importar: ' + e.message); }
    };
    inp.click();
  });

  document.getElementById('btnImportManaBox')?.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.csv,text/csv';
    inp.onchange = async () => {
      const f = inp.files?.[0]; if (!f) return;
      showErr('');
      try {
        const { parseCsv } = await import('../core/utils.js');
        const text = await f.text();
        const rows = parseCsv(text);
        if (!rows.length) { alert('CSV vacío.'); return; }
        const norm = s => String(s||'').trim().toLowerCase();
        const header = rows[0].map(norm);
        const dataRows = rows.slice(1);
        const col = names => { for (const n of names) { const i = header.indexOf(norm(n)); if (i !== -1) return i; } return -1; };
        const iName = col(['card name','name','nombre']);
        const iSet  = col(['set code','set','setcode']);
        const iNum  = col(['card number','collector number','number','nº','no']);
        const iQty  = col(['quantity','qty','cantidad']);
        const iFoil = col(['foil']);
        const iLang = col(['language','lang','idioma']);
        const iSid  = col(['scryfall id','scryfall_id','scryfallid']);
        if (iName === -1 && iSid === -1) { alert("No encuentro columna 'Card name'."); return; }

        for (const r of dataRows) {
          const scryId = iSid !== -1 ? String(r[iSid]||'').trim() : '';
          const name   = iName !== -1 ? String(r[iName]||'').trim() : '';
          const setRaw = iSet !== -1 ? String(r[iSet]||'').trim() : '';
          const cnRaw  = iNum !== -1 ? String(r[iNum]||'').trim() : '';
          const qty    = Math.max(1, parseInt(String(r[iQty]||'1'), 10));
          const foil   = /^(1|true|yes|sí|si|foil)$/i.test(String(r[iFoil]||''));
          const lang   = iLang !== -1 ? String(r[iLang]||'es').trim() : 'es';
          try {
            let card;
            if (scryId) { const rr = await fetch(`https://api.scryfall.com/cards/${encodeURIComponent(scryId)}`); card = await rr.json(); if (card.object==='error') throw new Error(card.details); }
            else if (setRaw && cnRaw) card = await fetchCardExact(setRaw, cnRaw);
            else card = await fetchOldestPrintingByName(name);
            const t = typesEs(card.type_line);
            const price = priceTextFromPrices(card.prices);
            const logoUrl = await fetchSetIconUrl(card.set);
            const colorId = computeColorId(card);
            state.cards.unshift({
              id: crypto.randomUUID(), _addedAt: Date.now(), inputName: name,
              name: card.name || name,
              setCode: String(card.set || setRaw || '').toUpperCase(),
              collectorNumber: String(card.collector_number || cnRaw || ''),
              type: t.main, subtype: t.sub, colorId,
              color: colorToEmojisFromCI(colorId),
              mana: manaToEmojis(card.mana_cost || card.card_faces?.[0]?.mana_cost || ''),
              manaValue: manaValueFromCard(card),
              rarity: RARITY_MAP[card.rarity] || card.rarity || '',
              logoUrl, priceText: price, proxy: false, foil, promo: false, promoPre: false,
              lang, qty, bestSell: bestSellPriceText(price), fav: false, sale: false, priceHist: []
            });
          } catch(e) { console.warn('Fila fallida:', r, e); }
        }
        saveCards(); cloudSaveAll();
        renderCardsTable(); updateInvestmentUI(); renderSalesTable();
        alert('Importación ManaBox completada.');
      } catch(e) { alert('Error al importar ManaBox CSV: ' + (e?.message || e)); }
    };
    inp.click();
  });
}