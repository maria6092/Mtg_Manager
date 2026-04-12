import { PASTEL } from './constants.js';

export function qs(sel, parent = document) { return parent.querySelector(sel); }
export function qsa(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

export function uid() { return crypto.randomUUID(); }

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function toTitleCase(str) {
  return String(str || '').trim()
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
}

export function parseEuro(priceText) {
  const m = String(priceText || '').match(/(\d+(\.\d+)?)/);
  if (!m) return NaN;
  const v = parseFloat(m[1]);
  return Number.isFinite(v) ? v : NaN;
}

export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function hexToRgba(hex, a) {
  const h = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(240,98,146,${a})`;
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

export function normalizeColorId(colorId) {
  const order = ['W','U','B','R','G'];
  const set = new Set((colorId || []).map(x => String(x).toUpperCase()).filter(x => order.includes(x)));
  return order.filter(x => set.has(x));
}

export function gradientFromColorIds(colorIds) {
  const ids = normalizeColorId(colorIds);
  if (!ids.length) return '';
  const cols = ids.map(id => PASTEL[id] || '#FFFFFF');
  if (cols.length === 1) return `linear-gradient(90deg, ${cols[0]} 0%, ${cols[0]} 100%)`;
  const stops = [];
  for (let i = 0; i < cols.length; i++) {
    const s = Math.round((i / cols.length) * 100);
    const e = Math.round(((i+1) / cols.length) * 100);
    stops.push(`${cols[i]} ${s}%`, `${cols[i]} ${e}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export function colorToEmojisFromCI(ci) {
  const emojis = { W:'⚪', U:'🔵', B:'⚫', R:'🔴', G:'🟢', C:'🔘' };
  const order = ['W','U','B','R','G'];
  const arr = Array.isArray(ci) ? ci.map(x => String(x).toUpperCase()) : [];
  if (!arr.length) return '🔘';
  const set = new Set(arr);
  return order.filter(c => set.has(c)).map(c => emojis[c]).join('') || '🔘';
}

export function manaToEmojis(manaCost) {
  if (!manaCost) return '';
  const tokens = manaCost.match(/\{[^}]+\}/g) || [];
  return tokens.map(t => {
    const c = t.replace(/[{}]/g,'').toUpperCase();
    if (/^\d+$/.test(c)) return c;
    if (c==='X'||c==='Y'||c==='Z') return c;
    const base = { W:'⚪',U:'🔵',B:'⚫',R:'🔴',G:'🟢',C:'🔘' };
    if (base[c]) return base[c];
    const special = { S:'❄️',T:'↩️',Q:'↪️',E:'⚡' };
    if (special[c]) return special[c];
    if (c.endsWith('/P')) { const col = c.split('/')[0]; return (base[col]||col)+'/☠️'; }
    if (c.includes('/')) { const [a,b] = c.split('/'); return (base[a]||a)+'/'+(base[b]||b); }
    return c;
  }).join('');
}

export function manaValueFromCard(card) {
  const mv = card?.mana_value;
  if (typeof mv === 'number' && Number.isFinite(mv)) return mv;
  const cost = card?.mana_cost || card?.card_faces?.[0]?.mana_cost || '';
  const tokens = String(cost).match(/\{[^}]+\}/g) || [];
  let sum = 0;
  for (const t of tokens) {
    const c = t.replace(/[{}]/g,'').toUpperCase();
    if (/^\d+$/.test(c)) sum += parseInt(c,10);
    else if (c==='X'||c==='Y'||c==='Z') sum += 0;
    else sum += 1;
  }
  return sum;
}

export function typesEs(typeLine) {
  const superMap = { Legendary:'legendaria',Basic:'básica',Snow:'nevada',World:'mundial',Token:'ficha',Host:'anfitrión' };
  const typeMap  = { Creature:'Criatura',Instant:'Instantáneo',Sorcery:'Conjuro',Artifact:'Artefacto',Enchantment:'Encantamiento',Land:'Tierra',Planeswalker:'Planeswalker',Battle:'Batalla' };
  const subMap   = { Aura:'Aura',Equipment:'Equipo',Vehicle:'Vehículo',Elf:'Elfo',Human:'Humano',Wizard:'Hechicero',Dragon:'Dragón',Angel:'Ángel',Goblin:'Trasgo',Zombie:'Zombi',Vampire:'Vampiro',Spirit:'Espíritu',Knight:'Caballero',Cleric:'Clérigo',Beast:'Bestia',Elemental:'Elemental',Warrior:'Guerrero',Soldier:'Soldado',Cat:'Gato',Dog:'Perro',Island:'Isla',Mountain:'Montaña',Swamp:'Pantano',Forest:'Bosque',Plains:'Llanura' };
  const parts = String(typeLine || '').split(' — ');
  const left  = (parts[0] || '').trim().split(/\s+/).filter(Boolean);
  const right = parts[1] ? parts[1].trim().split(/\s+/).filter(Boolean) : [];
  const supers = [], mains = [];
  left.forEach(w => { if (superMap[w]) supers.push(superMap[w]); else if (typeMap[w]) mains.push(typeMap[w]); });
  let main = mains.join(' ');
  if (main && supers.length) main += ' ' + supers.join(' ');
  const sub = right.map(w => subMap[w] || w).join(' ');
  return { main: main || 'Tipo no disponible', sub: sub || 'Sin subtipo' };
}

export function mainTypeBucket(typeEs) {
  const t = String(typeEs || '').toLowerCase();
  if (t.includes('criatura')) return 'Criatura';
  if (t.includes('planeswalker')) return 'Planeswalker';
  if (t.includes('instant')) return 'Instantáneo';
  if (t.includes('conjuro')) return 'Conjuro';
  if (t.includes('artefact')) return 'Artefacto';
  if (t.includes('encant')) return 'Encantamiento';
  if (t.includes('tierra')) return 'Tierra';
  if (t.includes('batalla')) return 'Batalla';
  return 'Otro';
}

export function rarityClass(r) {
  const s = (r || '').toLowerCase();
  if (s.includes('mítica')) return 'r-mythic';
  if (s.includes('rara')) return 'r-rare';
  if (s.includes('poco')) return 'r-uncommon';
  if (s.includes('especial')) return 'r-special';
  return 'r-common';
}

export function isFav(card) {
  const v = card ? card.fav : false;
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

export function parseMoneyText(txt) {
  const s = String(txt || '').trim();
  if (!s) return { v: null, cur: null };
  const m = s.match(/([0-9]+(?:[.,][0-9]+)?)\s*([€$])/);
  if (!m) return { v: null, cur: null };
  const v = parseFloat(m[1].replace(',','.'));
  const cur = m[2] === '$' ? 'USD' : 'EUR';
  return { v: Number.isFinite(v) ? v : null, cur };
}

export function updatePriceHistory(obj, priceText) {
  if (!obj) return;
  const { v, cur } = parseMoneyText(priceText);
  if (!Number.isFinite(v) || !cur) return;
  if (!Array.isArray(obj.priceHist)) obj.priceHist = [];
  const last = obj.priceHist[obj.priceHist.length - 1];
  if (last && last.cur === cur && Math.abs(last.v - v) < 1e-9) return;
  obj.priceHist.push({ t: Date.now(), v, cur });
  if (obj.priceHist.length > 80) obj.priceHist.splice(0, obj.priceHist.length - 80);
}

export function fmtHistLine(h) {
  try {
    const d = new Date(h.t);
    const ds = d.toLocaleDateString('es-ES', { year:'2-digit', month:'2-digit', day:'2-digit' });
    const ts = d.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
    const sym = h.cur === 'USD' ? '$' : '€';
    return `${ds} ${ts} · ${Number(h.v).toFixed(2)}${sym}`;
  } catch { return ''; }
}

export function bestSellPriceText(priceText) {
  const eur = parseEuro(priceText);
  if (!Number.isFinite(eur)) return '';
  const dec = eur > 1 ? 0.05 : 0.01;
  return Math.max(0, eur - dec).toFixed(2);
}

export function computeColorId(card) {
  const colorId = (
    card.type_line?.includes('Land') && Array.isArray(card.produced_mana) && card.produced_mana.length
      ? card.produced_mana
      : (card.color_identity || [])
  ).map(x => String(x).toUpperCase());
  return colorId.filter(x => ['W','U','B','R','G'].includes(x));
}

export function parseCsv(text) {
  const out = [];
  let row = [], cur = '', inQ = false;
  const s = String(text || '').replace(/\r/g,'');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], nx = s[i+1];
    if (inQ) { if (ch==='"'&&nx==='"') { cur+='"'; i++; continue; } if (ch==='"') { inQ=false; continue; } cur+=ch; continue; }
    if (ch==='"') { inQ=true; continue; }
    if (ch===',') { row.push(cur); cur=''; continue; }
    if (ch==='\n') { row.push(cur); out.push(row); row=[]; cur=''; continue; }
    cur+=ch;
  }
  row.push(cur); out.push(row);
  return out.filter(r => r.some(x => String(x||'').trim()!==''));
}