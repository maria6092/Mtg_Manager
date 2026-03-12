// FASE 2: mueve aquí addCard, deleteCard, editCard, sortCards, renderCards.
import { state } from '../core/state.js';
import { uid } from '../core/utils.js';
import { saveCards } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';

export function addCard() {
  const name = document.getElementById('newCardName').value.trim();
  const set = document.getElementById('newCardSet').value.trim();
  const lang = document.getElementById('newCardLang').value;
  const cond = document.getElementById('newCardCondition').value;
  const foil = document.getElementById('newCardFoil').value;
  const qty = parseInt(document.getElementById('newCardQuantity').value) || 1;
  const price = parseFloat(document.getElementById('newCardPrice').value) || 0;

  if (!name) {
    alert('Escribe el nombre de la carta');
    return;
  }

  state.cards.push({
    id: uid(),
    name,
    set,
    lang,
    condition: cond,
    foil,
    quantity: qty,
    price
  });

  saveCards();
  cloudSaveAll();
  renderCards();

  document.getElementById('newCardName').value = '';
  document.getElementById('newCardSet').value = '';
  document.getElementById('newCardQuantity').value = '1';
  document.getElementById('newCardPrice').value = '';
}

export function deleteCard(id) {
  if (!confirm('¿Eliminar esta carta?')) return;
  state.cards = state.cards.filter(c => c.id !== id);
  saveCards();
  cloudSaveAll();
  renderCards();
}

export function toggleSortCards() {
  state.sortState.asc = !state.sortState.asc;
  renderCards();
}

export function renderCards() {
  const div = document.getElementById('cardsDiv');
  if (!div) return;

  const items = [...state.cards].sort((a, b) => {
    const va = String(a.name || '').toLowerCase();
    const vb = String(b.name || '').toLowerCase();
    return state.sortState.asc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  if (items.length === 0) {
    div.innerHTML = "<p class='hint'>No hay cartas todavía.</p>";
    return;
  }

  let html = "<table><thead><tr><th>Carta</th><th>Edición</th><th>Idioma</th><th>Estado</th><th>Foil</th><th>Cant.</th><th>Precio</th><th>Acción</th></tr></thead><tbody>";

  items.forEach(c => {
    html += `
      <tr>
        <td>${c.name}</td>
        <td>${c.set || '—'}</td>
        <td>${c.lang || '—'}</td>
        <td>${c.condition || '—'}</td>
        <td>${c.foil || 'No'}</td>
        <td>${c.quantity || 1}</td>
        <td>${(c.price || 0).toFixed(2)}€</td>
        <td><button class="btn danger tiny" data-delete-card="${c.id}">🗑️</button></td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  div.innerHTML = html;

  div.querySelectorAll('[data-delete-card]').forEach(btn => {
    btn.addEventListener('click', () => deleteCard(btn.dataset.deleteCard));
  });
}

export function initCardsUI() {
  const btnAddCard = document.getElementById('btnAddCard');
  const btnSortCards = document.getElementById('btnSortCards');

  if (btnAddCard) btnAddCard.addEventListener('click', addCard);
  if (btnSortCards) btnSortCards.addEventListener('click', toggleSortCards);
}