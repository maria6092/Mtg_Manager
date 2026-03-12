// FASE 2: mueve aquí createDeck, renderDecksList, openDeck, closeDeck, deleteDeck, addCardToDeck, removeDeckCard, renderDeckCards.
import { state } from '../core/state.js';
import { uid } from '../core/utils.js';
import { saveDecks } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';

export function createDeck() {
  const nameEl = document.getElementById('newDeckName');
  if (!nameEl) return;

  const name = nameEl.value.trim();
  if (!name) {
    alert('Escribe un nombre para el mazo');
    return;
  }

  state.decks.push({ id: uid(), name, cards: [] });
  saveDecks();
  cloudSaveAll();
  nameEl.value = '';
  renderDecksList();
}

export function openDeck(id) {
  state.currentDeckId = id;
  const deck = state.decks.find(d => d.id === id);
  const editor = document.getElementById('deckEditor');
  const title = document.getElementById('deckEditorTitle');

  if (editor) editor.style.display = 'block';
  if (title) title.textContent = `Editor de mazo: ${deck?.name || ''}`;

  renderDeckCards();
}

export function closeDeck() {
  state.currentDeckId = null;
  const editor = document.getElementById('deckEditor');
  if (editor) editor.style.display = 'none';
}

export function deleteDeck(id) {
  if (!confirm('¿Eliminar este mazo?')) return;
  state.decks = state.decks.filter(d => d.id !== id);
  if (state.currentDeckId === id) closeDeck();
  saveDecks();
  cloudSaveAll();
  renderDecksList();
}

export function addCardToDeck() {
  const deck = state.decks.find(d => d.id === state.currentDeckId);
  if (!deck) return;

  const name = document.getElementById('deckCardName').value.trim();
  const qty = parseInt(document.getElementById('deckCardQty').value) || 1;

  if (!name) {
    alert('Escribe el nombre de la carta');
    return;
  }

  deck.cards.push({ id: uid(), name, quantity: qty });
  saveDecks();
  cloudSaveAll();
  renderDeckCards();

  document.getElementById('deckCardName').value = '';
  document.getElementById('deckCardQty').value = '1';
}

export function removeDeckCard(cardId) {
  const deck = state.decks.find(d => d.id === state.currentDeckId);
  if (!deck) return;

  deck.cards = deck.cards.filter(c => c.id !== cardId);
  saveDecks();
  cloudSaveAll();
  renderDeckCards();
}

export function renderDecksList() {
  const div = document.getElementById('decksDiv');
  if (!div) return;

  if (state.decks.length === 0) {
    div.innerHTML = "<p class='hint'>No hay mazos creados.</p>";
    return;
  }

  div.innerHTML = state.decks.map(d => `
    <div class="deck-card">
      <strong>${d.name}</strong>
      <div class="row">
        <button class="btn tiny" data-open-deck="${d.id}">Abrir</button>
        <button class="btn danger tiny" data-delete-deck="${d.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  div.querySelectorAll('[data-open-deck]').forEach(btn => {
    btn.addEventListener('click', () => openDeck(btn.dataset.openDeck));
  });

  div.querySelectorAll('[data-delete-deck]').forEach(btn => {
    btn.addEventListener('click', () => deleteDeck(btn.dataset.deleteDeck));
  });
}

export function renderDeckCards() {
  const deck = state.decks.find(d => d.id === state.currentDeckId);
  const div = document.getElementById('deckCardsDiv');
  if (!div) return;

  if (!deck) {
    div.innerHTML = '';
    return;
  }

  if (!deck.cards.length) {
    div.innerHTML = "<p class='hint'>Este mazo todavía no tiene cartas.</p>";
    return;
  }

  let html = "<table><thead><tr><th>Carta</th><th>Cantidad</th><th>Acción</th></tr></thead><tbody>";
  deck.cards.forEach(c => {
    html += `
      <tr>
        <td>${c.name}</td>
        <td>${c.quantity}</td>
        <td><button class="btn danger tiny" data-remove-deck-card="${c.id}">🗑️</button></td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  div.innerHTML = html;

  div.querySelectorAll('[data-remove-deck-card]').forEach(btn => {
    btn.addEventListener('click', () => removeDeckCard(btn.dataset.removeDeckCard));
  });
}

export function initDecksUI() {
  const btnCreateDeck = document.getElementById('btnCreateDeck');
  const btnAddCardToDeck = document.getElementById('btnAddCardToDeck');
  const btnCloseDeck = document.getElementById('btnCloseDeck');

  if (btnCreateDeck) btnCreateDeck.addEventListener('click', createDeck);
  if (btnAddCardToDeck) btnAddCardToDeck.addEventListener('click', addCardToDeck);
  if (btnCloseDeck) btnCloseDeck.addEventListener('click', closeDeck);
}