import { state } from '../core/state.js';
import { saveDecks } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { escapeHtml, downloadFile, isFav } from '../core/utils.js';
import { fetchCardExact, fetchCardByName } from '../services/scryfall-service.js';
import { DECK_TYPE_ORDER } from '../core/constants.js';
import { manaToEmojis, typesEs, mainTypeBucket } from '../core/utils.js';
import { showPage } from './router.js';
import { addMissingDeckToWishlist } from './wishlist-ui.js';

const deckCardCache = new Map();
const deckTypeCache = new Map();

function touchDeck(d) { d._updatedAt = Date.now(); }

function uniqueDeckName(name) {
  const base = String(name||'Mazo').trim() || 'Mazo';
  if (!state.decks.some(d => d.name.toLowerCase() === base.toLowerCase())) return base;
  let i = 2;
  while (true) {
    const c = `${base} (${i})`;
    if (!state.decks.some(d => d.name.toLowerCase() === c.toLowerCase())) return c;
    i++;
  }
}

function selectedDeck() {
  const id = document.getElementById('deckSelect')?.value;
  return state.decks.find(d => d.id === id) || null;
}

function collectionStatusForDeckItem(it) {
  const nameKey = String(it.name||'').trim().toLowerCase();
  const setKey  = String(it.set||'').trim().toUpperCase();
  const cnKey   = String(it.cn||'').trim();
  const exact = state.cards.find(c =>
    String(c.name||'').trim().toLowerCase() === nameKey &&
    String(c.setCode||'').trim().toUpperCase() === setKey &&
    String(c.collectorNumber||'').trim() === cnKey
  );
  if (exact) {
    const have = exact.qty||1, need = it.qty||1;
    return have >= need
      ? { cls:'ok', text:'✓', title:`En colección exacta: ${have}/${need}` }
      : { cls:'warn', text:`${have}/${need}`, title:`Tienes: ${have}/${need}` };
  }
  const byName = state.cards.find(c => String(c.name||'').trim().toLowerCase() === nameKey);
  if (byName) return { cls:'alt', text:'✓', title:`Otra impresión: ${byName.setCode}#${byName.collectorNumber}` };
  return { cls:'no', text:'0', title:'No está en tu colección' };
}

async function fetchDeckCardDetails(it) {
  const key = it.key || String(it.name||'').toLowerCase();
  if (deckCardCache.has(key)) return deckCardCache.get(key);
  try {
    const card = it.set && it.cn ? await fetchCardExact(it.set, it.cn) : await fetchCardByName(it.name);
    deckCardCache.set(key, card); return card;
  } catch { deckCardCache.set(key, null); return null; }
}

function getMainTypeForItem(it) {
  const key = it.key || String(it.name||'').toLowerCase();
  if (deckTypeCache.has(key)) return deckTypeCache.get(key);
  const owned = state.cards.find(c => String(c.name||'').toLowerCase() === String(it.name||'').toLowerCase());
  if (owned?.type) return mainTypeBucket(owned.type);
  return 'Otro';
}

function groupItemsByType(items) {
  const groups = new Map(DECK_TYPE_ORDER.map(t => [t, []]));
  for (const it of items) {
    const bucket = getMainTypeForItem(it);
    (groups.get(bucket) || groups.get('Otro')).push(it);
  }
  const out = [];
  for (const t of DECK_TYPE_ORDER) {
    const arr = groups.get(t)||[];
    if (!arr.length) continue;
    arr.sort((a,b) => String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'}));
    out.push([t, arr]);
  }
  return out;
}

export function renderDecks() {
  const list = document.getElementById('deckList');
  const sel  = document.getElementById('deckSelect');
  if (!list || !sel) return;

  const q = (document.getElementById('deckListQ')?.value||'').trim().toLowerCase();
  const sort = document.getElementById('deckListSort')?.value || 'recent';
  const prevId = sel.value;

  sel.innerHTML = '';
  state.decks.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id; opt.textContent = d.name; sel.appendChild(opt);
  });
  if (prevId && state.decks.some(d => d.id === prevId)) sel.value = prevId;

  list.innerHTML = '';
  let view = state.decks.slice();
  if (q) view = view.filter(d => String(d.name||'').toLowerCase().includes(q));
  if (sort === 'az') view.sort((a,b) => String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'}));
  else if (sort === 'za') view.sort((a,b) => String(b.name||'').localeCompare(String(a.name||''),'es',{sensitivity:'base'}));
  else view.sort((a,b) => (b._updatedAt||0) - (a._updatedAt||0));

  for (const d of view) {
    const count = (d.items||[]).reduce((s,it) => s+(it.qty||1), 0);
    const cmd = d.commander?.name ? ` · CMD: ${d.commander.name}` : '';
    const row = document.createElement('div');
    row.className = 'cardrow';
    row.innerHTML = `
      <div>
        <b>${escapeHtml(d.name)}</b>
        <div class="small mono">${count} cartas${escapeHtml(cmd)}</div>
      </div>
      <div class="row" style="gap:6px;justify-content:flex-end;">
        <button class="btn ghost tiny" data-act="open">Abrir</button>
        <button class="btn ghost tiny" data-act="rename">Renombrar</button>
        <button class="btn ghost tiny" data-act="dup">Duplicar</button>
        <button class="btn danger tiny" data-act="del">Eliminar</button>
      </div>
    `;
    row.querySelector('[data-act="open"]').onclick   = e => { e.stopPropagation(); openDeckView(d.id); };
    row.querySelector('[data-act="rename"]').onclick = e => { e.stopPropagation(); renameDeck(d.id); };
    row.querySelector('[data-act="dup"]').onclick    = e => { e.stopPropagation(); duplicateDeck(d.id); };
    row.querySelector('[data-act="del"]').onclick    = e => { e.stopPropagation(); deleteDeck(d.id); };
    row.onclick = () => openDeckView(d.id);
    list.appendChild(row);
  }

  document.getElementById('deckCount').textContent = state.decks.length;
  setCommanderLabel();
}

function setCommanderLabel() {
  const label = document.getElementById('deckCommanderLabel');
  if (!label) return;
  const d = selectedDeck();
  if (!d?.commander) { label.textContent = '—'; return; }
  const c = d.commander;
  label.textContent = c.set && c.cn ? `${c.name} (${c.set} #${c.cn})` : c.name;
}

function renameDeck(deckId) {
  const d = state.decks.find(x => x.id === deckId);
  if (!d) return;
  const next = prompt('Nuevo nombre del mazo:', d.name);
  if (next == null) return;
  const name = String(next).trim(); if (!name) return;
  d.name = uniqueDeckName(name); touchDeck(d);
  saveDecks(); cloudSaveAll(); renderDecks();
}

function duplicateDeck(deckId) {
  const d = state.decks.find(x => x.id === deckId);
  if (!d) return;
  const clone = JSON.parse(JSON.stringify(d));
  clone.id = crypto.randomUUID();
  clone.name = uniqueDeckName(`${d.name} (copia)`);
  clone._createdAt = Date.now(); clone._updatedAt = Date.now();
  state.decks.push(clone);
  saveDecks(); cloudSaveAll(); renderDecks();
  document.getElementById('deckSelect').value = clone.id;
  setCommanderLabel();
}

function deleteDeck(deckId) {
  const d = state.decks.find(x => x.id === deckId);
  if (!d) return;
  if (!confirm(`¿Eliminar el mazo "${d.name}"?`)) return;
  const prevSel = document.getElementById('deckSelect')?.value;
  state.decks = state.decks.filter(x => x.id !== d.id);
  saveDecks(); cloudSaveAll();
  const sel = document.getElementById('deckSelect');
  if (sel) { const still = state.decks.find(x => x.id === prevSel); sel.value = still?.id || state.decks[0]?.id || ''; }
  renderDecks();
  if (state.deckViewState.deckId === d.id) { state.deckViewState.deckId = null; showPage('mazos'); }
}

function openDeckView(deckId) {
  state.deckViewState.deckId = deckId;
  state.deckViewState.q = ''; state.deckViewState.selectedKey = null;
  const d = state.decks.find(x => x.id === deckId);
  const titleEl = document.getElementById('deckViewTitle');
  if (titleEl) titleEl.textContent = d?.name || 'Mazo';
  const qEl = document.getElementById('deckViewQ'); if (qEl) qEl.value = '';
  renderDeckView(true);
  showPage('deck_view');
  if (d) validateCommanderForDeck(d).then(msgs => renderCommanderWarnings(msgs));
}

async function renderDeckView(doPrefetch = false) {
  const deckId = state.deckViewState.deckId;
  const d = state.decks.find(x => x.id === deckId);
  const listEl    = document.getElementById('deckViewList');
  const metaEl    = document.getElementById('deckViewMeta');
  const detailsEl = document.getElementById('deckViewDetails');
  if (!d || !listEl || !metaEl || !detailsEl) return;

  const q = (state.deckViewState.q||'').trim().toLowerCase();
  let items = (d.items||[]).slice();
  if (q) items = items.filter(it => String(it.name||'').toLowerCase().includes(q));

  if (doPrefetch) {
    await Promise.allSettled(items.map(async it => {
      const key = it.key || String(it.name||'').toLowerCase();
      if (deckTypeCache.has(key)) return;
      const owned = state.cards.find(c => String(c.name||'').toLowerCase() === String(it.name||'').toLowerCase());
      if (owned?.type) { deckTypeCache.set(key, mainTypeBucket(owned.type)); return; }
      const card = await fetchDeckCardDetails(it);
      if (card?.type_line) { const t = typesEs(card.type_line); deckTypeCache.set(key, mainTypeBucket(t.main)); }
      else deckTypeCache.set(key, 'Otro');
    }));
  }

  const totalCards = items.reduce((a,it) => a+(it.qty||1), 0);
  metaEl.textContent = `Entradas: ${items.length} · Total cartas: ${totalCards}`;
  listEl.innerHTML = '';

  const renderRow = (it, prefix = '') => {
    const row = document.createElement('div');
    row.className = 'cardrow'; row.dataset.key = it.key || it.name;
    const st = collectionStatusForDeckItem(it);
    row.innerHTML = `
      <div>
        <b>${escapeHtml(prefix)}${escapeHtml(it.qty||1)}x ${escapeHtml(it.name)}</b>
        <div class="mini">
          <span class="pill mono">${escapeHtml(it.set||'')}${it.cn?'#'+escapeHtml(it.cn):''}</span>
          <span class="ownBadge ${st.cls}" title="${escapeHtml(st.title||'')}">${escapeHtml(st.text)}</span>
        </div>
      </div>
      <div class="mini"><span class="pill">Ver</span></div>
    `;
    row.onclick = async () => {
      state.deckViewState.selectedKey = row.dataset.key;
      detailsEl.innerHTML = '<div class="hint">Cargando…</div>';
      const card = await fetchDeckCardDetails(it);
      if (!card) { detailsEl.innerHTML = '<div class="err" style="display:block;">No se pudo cargar.</div>'; return; }
      const img = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
      const mana = manaToEmojis(card.mana_cost || card.card_faces?.[0]?.mana_cost || '');
      const t = typesEs(card.type_line);
      detailsEl.innerHTML = `
        ${img ? `<img src="${escapeHtml(img)}" alt="" style="width:100%;border-radius:16px;border:1px solid var(--line);box-shadow:var(--shadow);margin-bottom:10px;">` : ''}
        <div><b>${escapeHtml(card.name||it.name)}</b></div>
        <div class="mini" style="margin-top:6px;">
          <span class="pill">${escapeHtml(it.set||card.set||'')}${it.cn?'#'+escapeHtml(it.cn):''}</span>
          ${mana ? `<span class="pill">${escapeHtml(mana)}</span>` : ''}
          <span class="pill">${escapeHtml(t.main)}</span>
        </div>
        <div class="hint" style="margin-top:10px;white-space:pre-wrap;">${escapeHtml(card.oracle_text||card.card_faces?.[0]?.oracle_text||'')}</div>
      `;
    };
    listEl.appendChild(row);
  };

  if (d.commander) {
    const h = document.createElement('div');
    h.className = 'pill'; h.style.justifyContent = 'space-between';
    h.innerHTML = `<b>Comandante</b><span class="mono">1</span>`;
    listEl.appendChild(h);
    renderRow({ ...d.commander, qty: 1 }, '👑 ');
  }

  const groups = state.deckViewState.group === 'none' ? [['Cartas', items]] : groupItemsByType(items);
  for (const [gname, arr] of groups) {
    const h = document.createElement('div');
    h.className = 'pill'; h.style.justifyContent = 'space-between';
    h.innerHTML = `<b>${escapeHtml(gname)}</b><span class="mono">${arr.reduce((a,it)=>a+(it.qty||1),0)}</span>`;
    listEl.appendChild(h);
    arr.forEach(it => renderRow(it));
  }
}

async function validateCommanderForDeck(d) {
  const out = [];
  if (!d) return out;
  if (!d.commander) { out.push({ level:'warn', msg:'No has configurado comandante.' }); return out; }
  let cmdCard = null;
  try { cmdCard = d.commander.set && d.commander.cn ? await fetchCardExact(d.commander.set, d.commander.cn) : await fetchCardByName(d.commander.name); } catch {}
  if (!cmdCard) { out.push({ level:'bad', msg:`No pude validar: "${d.commander.name}".` }); return out; }
  const tl = String(cmdCard.type_line||''), oracle = String(cmdCard.oracle_text||'');
  const legal = (tl.includes('Legendary')&&tl.includes('Creature')) || (/can be your commander/i.test(oracle));
  out.push(legal ? { level:'ok', msg:`Comandante OK: ${cmdCard.name}` } : { level:'bad', msg:`No legal como comandante: ${cmdCard.name}` });
  const total = (d.items||[]).reduce((a,it)=>a+(it.qty||1),0) + 1;
  if (total !== 100) out.push({ level:'warn', msg:`Tamaño: ${total}/100 cartas.` });
  return out;
}

function renderCommanderWarnings(messages) {
  const box = document.getElementById('deckCmdWarnings');
  if (!box) return;
  if (!messages?.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
  const icon = l => l==='ok'?'✅':l==='bad'?'⛔':'⚠️';
  const cls  = l => l==='ok'?'ownBadge ok':l==='bad'?'ownBadge bad':'ownBadge warn';
  box.style.display = '';
  box.innerHTML = `<div class="row" style="gap:10px;flex-wrap:wrap;">
    <div><b>Validación comandante</b></div>
    <div>${messages.map(m=>`<div class="mini" style="margin:4px 0;"><span class="${cls(m.level)}">${icon(m.level)}</span> ${escapeHtml(m.msg)}</div>`).join('')}</div>
  </div>`;
}

function deckToText(d) {
  const lines = [`Mazo: ${d.name}`];
  if (d.commander) {
    const c = d.commander;
    lines.push(c.set&&c.cn ? `Comandante: ${c.name} (${c.set} #${c.cn})` : `Comandante: ${c.name}`);
    lines.push('');
  }
  for (const it of (d.items||[])) lines.push(it.set&&it.cn ? `${it.qty}x ${it.name} (${it.set} #${it.cn})` : `${it.qty}x ${it.name}`);
  return lines.join('\n');
}

export function initDecksUI() {
  document.getElementById('btnCreateDeck')?.addEventListener('click', () => {
    const nameEl = document.getElementById('deckName');
    const name = nameEl?.value.trim(); if (!name) { alert('Pon un nombre.'); return; }
    state.decks.push({ id: crypto.randomUUID(), name: uniqueDeckName(name), commander: null, items: [], _createdAt: Date.now(), _updatedAt: Date.now() });
    saveDecks(); cloudSaveAll();
    if (nameEl) nameEl.value = ''; renderDecks();
  });

  document.getElementById('deckSelect')?.addEventListener('change', () => {
    setCommanderLabel();
    const d = selectedDeck();
    if (!d) return;
    if (document.getElementById('deckCmdName')) document.getElementById('deckCmdName').value = d.commander?.name||'';
    if (document.getElementById('deckCmdSet'))  document.getElementById('deckCmdSet').value  = d.commander?.set||'';
    if (document.getElementById('deckCmdCn'))   document.getElementById('deckCmdCn').value   = d.commander?.cn||'';
  });

  document.getElementById('btnSetCommander')?.addEventListener('click', () => {
    const d = selectedDeck(); if (!d) { alert('Selecciona un mazo.'); return; }
    const name = document.getElementById('deckCmdName')?.value.trim(); if (!name) { alert('Pon el nombre.'); return; }
    const set  = document.getElementById('deckCmdSet')?.value.trim().toUpperCase()||'';
    const cn   = document.getElementById('deckCmdCn')?.value.trim()||'';
    d.commander = { name, set, cn, key: set&&cn?`${set}#${cn}`:'' };
    touchDeck(d); saveDecks(); cloudSaveAll(); renderDecks(); alert('Comandante guardado ✅');
  });

  document.getElementById('btnClearCommander')?.addEventListener('click', () => {
    const d = selectedDeck(); if (!d) return;
    d.commander = null; touchDeck(d); saveDecks(); cloudSaveAll();
    ['deckCmdName','deckCmdSet','deckCmdCn'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    renderDecks();
  });

  document.getElementById('btnAddToDeck')?.addEventListener('click', () => {
    const d = selectedDeck(); if (!d) { alert('Selecciona un mazo.'); return; }
    const name = document.getElementById('deckCardName')?.value.trim();
    const set  = document.getElementById('deckCardSet')?.value.trim().toUpperCase()||'';
    const cn   = document.getElementById('deckCardCn')?.value.trim()||'';
    const qty  = Math.max(1, parseInt(document.getElementById('deckCardQty')?.value||'1', 10));
    if (!name||!set||!cn) { alert('Rellena nombre + setCode + nº.'); return; }
    const key = `${set}#${cn}`;
    const existing = d.items.find(it => it.key===key && it.name.toLowerCase()===name.toLowerCase());
    if (existing) existing.qty += qty; else d.items.push({ key, name, set, cn, qty });
    touchDeck(d); saveDecks(); cloudSaveAll(); renderDecks();
  });

  document.getElementById('btnDeckRename')?.addEventListener('click',    () => renameDeck(selectedDeck()?.id));
  document.getElementById('btnDeckDuplicate')?.addEventListener('click', () => duplicateDeck(selectedDeck()?.id));
  document.getElementById('btnDeckDelete')?.addEventListener('click',    () => deleteDeck(selectedDeck()?.id));

  document.getElementById('btnDeckExportOneTxt')?.addEventListener('click', () => {
    const d = selectedDeck(); if(!d) return;
    downloadFile(`mazo_${d.name.replace(/\s+/g,'_')}.txt`, deckToText(d), 'text/plain');
  });
  document.getElementById('btnDeckExportOneJson')?.addEventListener('click', () => {
    const d = selectedDeck(); if(!d) return;
    downloadFile(`mazo_${d.name.replace(/\s+/g,'_')}.json`, JSON.stringify(d,null,2));
  });
  document.getElementById('btnDeckCopyTxt')?.addEventListener('click', async () => {
    const d = selectedDeck(); if(!d) return;
    try { await navigator.clipboard.writeText(deckToText(d)); alert('Copiado ✅'); }
    catch { alert('Error al copiar.'); }
  });

  document.getElementById('btnDeckExport')?.addEventListener('click', () => {
    downloadFile('mazos_mtg.json', JSON.stringify(state.decks, null, 2));
  });
  document.getElementById('btnDeckImport')?.addEventListener('click', () => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='.json,.txt';
    inp.onchange = async () => {
      const f = inp.files?.[0]; if(!f) return;
      const text = await f.text();
      try {
        let imported;
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext==='json') {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) throw new Error('No es array.');
          imported = data;
        } else {
          imported = parseDecksTxt(text);
        }
        imported.forEach(d => {
          state.decks.push({ id:crypto.randomUUID(), name:uniqueDeckName(d.name||'Mazo'), items:d.items||[], commander:d.commander||null, _createdAt:Date.now(), _updatedAt:Date.now() });
        });
        saveDecks(); cloudSaveAll(); renderDecks();
        alert(`Importados: ${imported.length} mazo(s).`);
      } catch(e) { alert('Error: ' + e.message); }
    };
    inp.click();
  });

  document.getElementById('deckListQ')?.addEventListener('input', () => renderDecks());
  document.getElementById('deckListSort')?.addEventListener('change', () => renderDecks());

  document.getElementById('btnDeckBack')?.addEventListener('click', () => showPage('mazos'));
  document.getElementById('deckViewQ')?.addEventListener('input', async e => { state.deckViewState.q = e.target.value; await renderDeckView(true); });
  document.getElementById('deckViewGroup')?.addEventListener('change', async e => { state.deckViewState.group = e.target.value; await renderDeckView(true); });

  document.getElementById('btnDeckViewExportTxt')?.addEventListener('click', () => {
    const d = state.decks.find(x => x.id === state.deckViewState.deckId); if(!d) return;
    downloadFile(`mazo_${d.name.replace(/\s+/g,'_')}.txt`, deckToText(d), 'text/plain');
  });
  document.getElementById('btnDeckViewDelete')?.addEventListener('click', () => {
    if (state.deckViewState.deckId) deleteDeck(state.deckViewState.deckId);
  });
  document.getElementById('btnDeckToWish')?.addEventListener('click', () => addMissingDeckToWishlist(selectedDeck()));
}

function parseDecksTxt(text) {
  const out = [];
  let current = null;
  const flush = () => { if (current?.name) out.push(current); current = null; };
  const ensure = () => { if (!current) current = { name:'Mazo importado', items:[], commander:null, _createdAt:Date.now(), _updatedAt:Date.now() }; };
  for (const raw of String(text||'').replace(/\r/g,'').split('\n')) {
    const line = raw.trim();
    if (!line||line.startsWith('#')||line.startsWith('//')) continue;
    const mDeck = line.match(/^mazo:\s*(.+)$/i);
    if (mDeck) { flush(); current = { name:mDeck[1].trim(), items:[], commander:null, _createdAt:Date.now(), _updatedAt:Date.now() }; continue; }
    const mCmd = line.match(/^(comandante|commander)\s*:\s*(.+)$/i);
    if (mCmd) {
      ensure();
      const rest = mCmd[2].trim();
      const m = rest.match(/^(.+?)\s*\(\s*([A-Za-z0-9]{2,10})\s*#?\s*([A-Za-z0-9]+)\s*\)\s*$/i);
      if (m) { current.commander = { name:m[1].trim(), set:m[2].toUpperCase(), cn:m[3].trim(), key:`${m[2].toUpperCase()}#${m[3].trim()}` }; }
      else current.commander = { name:rest, set:'', cn:'', key:rest };
      continue;
    }
    ensure();
    let m = line.match(/^(\d+)\s*x\s*(.+?)\s*\(\s*([A-Za-z0-9]{2,10})\s*#?\s*([A-Za-z0-9]+)\s*\)\s*$/i);
    if (m) { const qty=parseInt(m[1],10),name=m[2].trim(),set=m[3].toUpperCase(),cn=m[4].trim(); current.items.push({key:`${set}#${cn}`,name,set,cn,qty}); continue; }
    m = line.match(/^(\d+)\s*x?\s*(.+?)\s*$/i);
    if (m) { current.items.push({key:m[2].trim(),name:m[2].trim(),set:'',cn:'',qty:parseInt(m[1],10)}); }
  }
  flush(); return out;
}