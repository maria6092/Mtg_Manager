import { escapeHtml } from '../core/utils.js';
import { searchScryfallCards } from '../services/scryfall-service.js';

export async function renderSearchResults() {
  const cardName = document.getElementById('searchCardName')?.value.trim();
  const setCode = document.getElementById('searchCardSet')?.value.trim();
  const lang = document.getElementById('searchLang')?.value.trim();
  const container = document.getElementById('searchResults');
  if (!container) return;

  if (!cardName) {
    alert('Escribe el nombre de una carta');
    return;
  }

  container.innerHTML = '<p class="hint">Buscando...</p>';

  try {
    const results = await searchScryfallCards(cardName, setCode, lang);
    if (!results.length) {
      container.innerHTML = '<p class="hint">No se encontraron resultados.</p>';
      return;
    }

    container.innerHTML = results.map(card => {
      const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
      const price = card.prices?.eur || '—';
      const oracle = (card.oracle_text || card.card_faces?.[0]?.oracle_text || '').slice(0, 120);
      return `
        <div class="cardrow mt10">
          <div>
            ${image ? `<img class="cardimg" src="${escapeHtml(image)}" alt="${escapeHtml(card.name)}">` : ''}
          </div>
          <div>
            <div class="cardrow-name">${escapeHtml(card.name)}</div>
            <div class="cardrow-info">
              <strong>Edición:</strong> ${escapeHtml(card.set_name || '')} (${escapeHtml(String(card.set || '').toUpperCase())})<br>
              <strong>Rareza:</strong> ${escapeHtml(card.rarity || '')}<br>
              <strong>Tipo:</strong> ${escapeHtml(card.type_line || '')}<br>
              <strong>Precio:</strong> ${escapeHtml(price)}€<br>
              <strong>Texto:</strong> ${escapeHtml(oracle)}...
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `<p class="hint" style="color:#ef4444;">Error: ${escapeHtml(error.message)}</p>`;
  }
}

export function initSearchUI() {
  document.getElementById('btnSearchScryfall')?.addEventListener('click', renderSearchResults);
}
