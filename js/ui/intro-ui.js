import { STORAGE_KEYS } from '../core/constants.js';
import { fetchAllSets } from '../services/scryfall-service.js';
import { escapeHtml } from '../core/utils.js';

export async function loadIntroSets() {
  const info = document.getElementById('introSetsInfo');
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.introSets);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) { renderIntroSets(parsed); if(info) info.textContent = `${parsed.length} colecciones`; return; }
    }
    const sets = await fetchAllSets();
    localStorage.setItem(STORAGE_KEYS.introSets, JSON.stringify(sets));
    renderIntroSets(sets);
    if (info) info.textContent = `${sets.length} colecciones`;
  } catch {
    if (info) info.textContent = 'No se pudieron cargar las colecciones.';
  }
}

function renderIntroSets(sets) {
  const tbody = document.querySelector('#tblIntroSets tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  sets.slice().sort((a,b) => a.name.localeCompare(b.name,'es',{sensitivity:'base'})).forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.icon ? `<img class="setIcon" src="${escapeHtml(s.icon)}" alt="">` : ''}</td>
      <td>${escapeHtml(s.name)}</td>
      <td class="mono">${escapeHtml(s.code)}</td>
    `;
    tbody.appendChild(tr);
  });
}