import { state } from '../core/state.js';
import { uid, escapeHtml } from '../core/utils.js';
import { saveDecks } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';

function getCurrentDeck() {
  return state.decks.find(deck => deck.id === state.currentDeckId) || null;
}

export function createDeck() {
  const input = document.getElementById('newDeckName');
  const name = input?.value.trim();
  if (!name) {
    alert('Escribe un nombre para el mazo');
    return;
  }

  state.decks.push({ id: uid(), name, cards: [] });
  saveDecks();
  cloudSaveAll();
  input.value = '';
  renderDecksList();
}

export function openDeck(deckId) {
  state.currentDeckId = deckId;
  const deck = getCurrentDeck();
  if (!deck) return;

  document.getElementById('deckEditor').style.display = '';
  document.getElementById('deckEditorTitle').textContent = `Editor · ${deck.name}`;
  renderDeckCards();
}

export function closeDeck() {
  state.currentDeckId = null;
  const editor = document.getElementById('deckEditor');
  if (editor) editor.style.display = 'none';
}

export function deleteDeck(deckId) {
  if (!confirm('¿Eliminar este mazo?')) return;
  state.decks = state.decks.filter(deck => deck.id !== deckId);
  if (state.currentDeckId === deckId) closeDeck();
  saveDecks();
  cloudSaveAll();
  renderDecksList();
}

export function addCardToDeck() {
  const deck = getCurrentDeck();
  if (!deck) return;

  const name = document.getElementById('deckCardName')?.value.trim();
  const quantity = parseInt(document.getElementById('deckCardQty')?.value || '1', 10) || 1;

  if (!name) {
    alert('Escribe el nombre de la carta');
    return;
  }

  const existing = deck.cards.find(card => card.name.toLowerCase() === name.toLowerCase());
  if (existing) existing.quantity += quantity;
  else deck.cards.push({ name, quantity });

  saveDecks();
  cloudSaveAll();
  renderDeckCards();
  renderDecksList();

  document.getElementById('deckCardName').value = '';
  document.getElementById('deckCardQty').value = '1';
}

export function removeDeckCard(cardName) {
  const deck = getCurrentDeck();
  if (!deck) return;
  deck.cards = deck.cards.filter(card => card.name !== cardName);
  saveDecks();
  cloudSaveAll();
  renderDeckCards();
  renderDecksList();
}

export function renderDeckCards() {
  const deck = getCurrentDeck();
  const container = document.getElementById('deckCardsDiv');
  if (!container) return;

  if (!deck || !deck.cards.length) {
    container.innerHTML = '<p class="hint">No hay cartas en este mazo.</p>';
    return;
  }

  let html = '<table><thead><tr><th>Carta</th><th>Cantidad</th><th>Acción</th></tr></thead><tbody>';
  deck.cards.forEach(card => {
    html += `
      <tr>
        <td>${escapeHtml(card.name)}</td>
        <td>${card.quantity}</td>
        <td><button class="btn danger tiny" data-remove-deck-card="${escapeHtml(card.name)}">🗑️</button></td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('[data-remove-deck-card]').forEach(button => {
    button.addEventListener('click', () => removeDeckCard(button.dataset.removeDeckCard));
  });
}

export function renderDecksList() {
  const container = document.getElementById('decksDiv');
  if (!container) return;

  if (!state.decks.length) {
    container.innerHTML = '<p class="hint">No tienes mazos todavía.</p>';
    return;
  }

  container.innerHTML = state.decks.map(deck => {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
    return `
      <div class="deck-card">
        <div>
          <div><strong>${escapeHtml(deck.name)}</strong></div>
          <div class="hint">${totalCards} cartas</div>
        </div>
        <div class="row">
          <button class="btn ghost tiny" data-open-deck="${deck.id}">Abrir</button>
          <button class="btn danger tiny" data-delete-deck="${deck.id}">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-open-deck]').forEach(button => {
    button.addEventListener('click', () => openDeck(button.dataset.openDeck));
  });

  container.querySelectorAll('[data-delete-deck]').forEach(button => {
    button.addEventListener('click', () => deleteDeck(button.dataset.deleteDeck));
  });
}

export function initDecksUI() {
  document.getElementById('btnCreateDeck')?.addEventListener('click', createDeck);
  document.getElementById('btnAddCardToDeck')?.addEventListener('click', addCardToDeck);
  document.getElementById('btnCloseDeck')?.addEventListener('click', closeDeck);
}
