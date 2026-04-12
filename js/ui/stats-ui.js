import { state } from '../core/state.js';
import { parseEuro, getCssVar, hexToRgba, normalizeColorId, mainTypeBucket } from '../core/utils.js';

let chartColors = null, chartTypes = null, chartRarity = null;

function colorBucketFromColorId(colorId) {
  const ids = normalizeColorId(colorId);
  if (!ids.length) return 'Incoloro';
  if (ids.length === 1) return { W:'Blanco',U:'Azul',B:'Negro',R:'Rojo',G:'Verde' }[ids[0]] || 'Incoloro';
  return 'Multicolor';
}

export function updateInvestmentUI() {
  let invReal = 0, invAll = 0;
  for (const c of state.cards) {
    const qty = c.qty||1, eur = parseEuro(c.priceText);
    if (Number.isFinite(eur)) { invAll += eur*qty; if (!c.proxy) invReal += eur*qty; }
  }
  const el = id => document.getElementById(id);
  if (el('invReal')) el('invReal').textContent = `${invReal.toFixed(2)}€`;
  if (el('invAll'))  el('invAll').textContent  = `${invAll.toFixed(2)}€`;
}

export function renderColorStats() {
  const buckets = ['Blanco','Azul','Negro','Rojo','Verde','Multicolor','Incoloro'];
  const counts = Object.fromEntries(buckets.map(b=>[b,0]));
  let total = 0;
  for (const c of state.cards) {
    const qty = c.qty||1; total += qty;
    const b = colorBucketFromColorId(c.colorId);
    counts[b] = (counts[b]||0) + qty;
  }
  const accent = getCssVar('--pink'), accent2 = getCssVar('--pink2');
  const ctx = document.getElementById('chartColors');
  if (ctx) {
    if (chartColors) chartColors.destroy();
    chartColors = new Chart(ctx, {
      type:'bar',
      data:{ labels:buckets, datasets:[{ label:'Cartas por color', data:buckets.map(b=>counts[b]||0), backgroundColor:hexToRgba(accent,.30), borderColor:hexToRgba(accent2,.90), borderWidth:1 }] },
      options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:hexToRgba(accent,.08) } }, y:{ grid:{ color:hexToRgba(accent,.08) } } } }
    });
  }
  const sumDiv = document.getElementById('colorsSummary');
  if (sumDiv) sumDiv.innerHTML = buckets.map(b=>`<div>${b}: <b>${counts[b]||0}</b></div>`).join('') + `<div style="margin-top:8px;">Total: <b>${total}</b></div>`;
}

export function renderTypeStats() {
  const typeCounts = new Map(), rarCounts = new Map(), setCounts = new Map();
  for (const c of state.cards) {
    const qty = c.qty||1;
    const bucket = mainTypeBucket(c.type);
    typeCounts.set(bucket, (typeCounts.get(bucket)||0)+qty);
    const r = c.rarity||'—';
    rarCounts.set(r, (rarCounts.get(r)||0)+qty);
    const s = c.setCode||'—';
    setCounts.set(s, (setCounts.get(s)||0)+qty);
  }
  const accent = getCssVar('--pink'), accent2 = getCssVar('--pink2');
  const typeLabels = [...typeCounts.keys()].sort((a,b)=>(typeCounts.get(b)-typeCounts.get(a)));
  const ctxT = document.getElementById('chartTypes');
  if (ctxT) {
    if (chartTypes) chartTypes.destroy();
    chartTypes = new Chart(ctxT, {
      type:'bar', data:{ labels:typeLabels, datasets:[{ label:'Tipos', data:typeLabels.map(k=>typeCounts.get(k)), backgroundColor:hexToRgba(accent,.22), borderColor:hexToRgba(accent2,.90), borderWidth:1 }] },
      options:{ responsive:true, plugins:{ legend:{ display:false } } }
    });
  }
  const rarLabels = [...rarCounts.keys()];
  const ctxR = document.getElementById('chartRarity');
  if (ctxR) {
    if (chartRarity) chartRarity.destroy();
    chartRarity = new Chart(ctxR, {
      type:'doughnut', data:{ labels:rarLabels, datasets:[{ label:'Rarezas', data:rarLabels.map(k=>rarCounts.get(k)), backgroundColor:['rgba(255,255,255,.95)','rgba(220,220,220,.95)','rgba(255,225,160,.95)','rgba(255,170,120,.95)','rgba(248,187,208,.95)'], borderColor:'rgba(216,27,96,.35)', borderWidth:1 }] },
      options:{ responsive:true }
    });
  }
  // Top sets
  const setEntries = [...setCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
  const ctxS = document.getElementById('chartSets');
  if (ctxS) {
    if (window._chartSets) window._chartSets.destroy();
    window._chartSets = new Chart(ctxS, {
      type:'bar', data:{ labels:setEntries.map(e=>e[0]), datasets:[{ label:'Cantidad', data:setEntries.map(e=>e[1]), backgroundColor:getCssVar('--pink') }] },
      options:{ responsive:true, scales:{ y:{ beginAtZero:true } }, plugins:{ legend:{ display:false } } }
    });
  }
  updateInvestmentUI();
}

export function renderStats() { renderColorStats(); renderTypeStats(); }