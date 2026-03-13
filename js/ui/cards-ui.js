import { state } from '../core/state.js';
import { uid, escapeHtml } from '../core/utils.js';
import { saveCards } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { renderStats } from './stats-ui.js';

export function addCard() {
  const name = document.getElementById('newCardName')?.value.trim();
  const set = document.getElementById('newCardSet')?.value.trim();
  const lang = document.getElementById('newCardLang')?.value;
  const condition = document.getElementById('newCardCondition')?.value;
  const foil = document.getElementById('newCardFoil')?.value;
  const quantity = parseInt(document.getElementById('newCardQuantity')?.value || '1', 10) || 1;
  const price = parseFloat(document.getElementById('newCardPrice')?.value || '0') || 0;

  if (!name) {
    alert('Escribe el nombre de la carta');
    return;
  }

  state.cards.push({
    id: uid(),
    name,
    set,
    lang,
    condition,
    foil,
    quantity,
    price
  });

  saveCards();
  cloudSaveAll();
  renderCards();
  renderStats();

  document.getElementById('newCardName').value = '';
  document.getElementById('newCardSet').value = '';
  document.getElementById('newCardQuantity').value = '1';
  document.getElementById('newCardPrice').value = '';
}

export function deleteCard(id) {
  if (!confirm('¿Eliminar esta carta?')) return;
  state.cards = state.cards.filter(card => card.id !== id);
  saveCards();
  cloudSaveAll();
  renderCards();
  renderStats();
}

export function editCard(id) {
  const card = state.cards.find(item => item.id === id);
  if (!card) return;

  const name = prompt('Nombre:', card.name);
  if (name === null) return;
  card.name = name.trim() || card.name;

  const set = prompt('Edición:', card.set || '');
  if (set !== null) card.set = set.trim();

  const lang = prompt('Idioma:', card.lang || '');
  if (lang !== null) card.lang = lang.trim();

  const condition = prompt('Estado:', card.condition || '');
  if (condition !== null) card.condition = condition.trim();

  const foil = prompt('Foil (Sí/No):', card.foil || 'No');
  if (foil !== null) card.foil = foil.trim();

  const quantity = prompt('Cantidad:', String(card.quantity || 1));
  if (quantity !== null) card.quantity = parseInt(quantity, 10) || card.quantity;

  const price = prompt('Precio unitario:', String(card.price || 0));
  if (price !== null) card.price = parseFloat(price) || card.price;

  saveCards();
  cloudSaveAll();
  renderCards();
  renderStats();
}

export function sortCards(column = 'name') {
  if (state.sortState.col === column) {
    state.sortState.asc = !state.sortState.asc;
  } else {
    state.sortState = { col: column, asc: true };
  }

  const multiplier = state.sortState.asc ? 1 : -1;
  state.cards.sort((a, b) => {
    let left = a[column];
    let right = b[column];

    if (typeof left === 'string') left = left.toLowerCase();
    if (typeof right === 'string') right = right.toLowerCase();

    if (left < right) return -1 * multiplier;
    if (left > right) return 1 * multiplier;
    return 0;
  });

  renderCards();
}

export function renderCards() {
  const container = document.getElementById('cardsDiv');
  if (!container) return;

  if (!state.cards.length) {
    container.innerHTML = '<p class="hint">Todavía no has añadido cartas.</p>';
    return;
  }

  let html = `
    <div style="overflow:auto;">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Edición</th>
            <th>Idioma</th>
            <th>Estado</th>
            <th>Foil</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  state.cards.forEach(card => {
    const total = ((card.quantity || 0) * (card.price || 0)).toFixed(2);
    html += `
      <tr>
        <td>${escapeHtml(card.name)}</td>
        <td>${escapeHtml(card.set || '—')}</td>
        <td>${escapeHtml(card.lang || '—')}</td>
        <td>${escapeHtml(card.condition || '—')}</td>
        <td>${escapeHtml(card.foil || '—')}</td>
        <td>${card.quantity || 0}</td>
        <td>${Number(card.price || 0).toFixed(2)}€</td>
        <td>${total}€</td>
        <td>
          <button class="btn ghost tiny" data-edit-card="${card.id}">✏️</button>
          <button class="btn danger tiny" data-delete-card="${card.id}">🗑️</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;

  container.querySelectorAll('[data-edit-card]').forEach(button => {
    button.addEventListener('click', () => editCard(button.dataset.editCard));
  });

  container.querySelectorAll('[data-delete-card]').forEach(button => {
    button.addEventListener('click', () => deleteCard(button.dataset.deleteCard));
  });
}

export function initCardsUI() {
  document.getElementById('btnAddCard')?.addEventListener('click', addCard);
  document.getElementById('btnSortCards')?.addEventListener('click', () => sortCards('name'));
}
