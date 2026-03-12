// Reservado para una intro o dashboard inicial.
import { searchScryfallCards } from '../services/scryfall-service.js';

export async function searchCardScryfall() {
  const nameEl = document.getElementById('searchCardName');
  const setEl = document.getElementById('searchCardSet');
  const langEl = document.getElementById('searchLang');
  const resultsDiv = document.getElementById('searchResults');

  if (!nameEl || !resultsDiv) return;

  const cardName = nameEl.value.trim();
  if (!cardName) {
    alert('Escribe el nombre de una carta');
    return;
  }

  resultsDiv.innerHTML = '<p>Buscando...</p>';

  try {
    const data = await searchScryfallCards(cardName, setEl?.value || '', langEl?.value || '');

    if (!data.length) {
      resultsDiv.innerHTML = '<p>No se encontraron resultados.</p>';
      return;
    }

    let html = '';
    data.forEach(card => {
      const imgUrl = card.image_uris
        ? card.image_uris.normal
        : (card.card_faces && card.card_faces[0].image_uris
            ? card.card_faces[0].image_uris.normal
            : '');

      const setName = card.set_name || '';
      const rarity = card.rarity || '';
      const type = card.type_line || '';
      const oracle = card.oracle_text || '';
      const price = card.prices?.eur || '—';

      html += `
        <div class="cardrow mb10">
          <div class="cardrow-left">
            ${imgUrl ? `<img class="cardimg" src="${imgUrl}" alt="${card.name}"/>` : ''}
          </div>
          <div class="cardrow-main">
            <div class="cardrow-name">${card.name}</div>
            <div class="cardrow-info">
              <strong>Edición:</strong> ${setName} (${(card.set || '').toUpperCase()})<br>
              <strong>Rareza:</strong> ${rarity}<br>
              <strong>Tipo:</strong> ${type}<br>
              <strong>Precio:</strong> ${price}€<br>
              <strong>Texto:</strong> ${oracle.substring(0, 120)}...
            </div>
          </div>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
  } catch (e) {
    resultsDiv.innerHTML = `<p style="color:#ef4444">Error: ${e.message}</p>`;
  }
}

export function initSearchUI() {
  const btn = document.getElementById('btnSearchScryfall');
  if (btn) btn.addEventListener('click', searchCardScryfall);
}