import { state } from '../core/state.js';
import { downloadFile } from '../core/utils.js';
import { saveCards, saveDecks, saveWishlist } from '../core/storage.js';
import { renderCards } from './cards-ui.js';
import { renderDecksList } from './decks-ui.js';
import { renderWishlist } from './wishlist-ui.js';
import { renderStats } from './stats-ui.js';

function importJsonFile(input, onLoad) {
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ''));
        onLoad(data);
      } catch {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  });
}

export function initImportUI() {
  document.getElementById('btnExportCards')?.addEventListener('click', () => {
    downloadFile('mtg_cards.json', JSON.stringify(state.cards, null, 2));
  });

  document.getElementById('btnExportDecks')?.addEventListener('click', () => {
    downloadFile('mtg_decks.json', JSON.stringify(state.decks, null, 2));
  });

  document.getElementById('btnExportWishlist')?.addEventListener('click', () => {
    downloadFile('mtg_wishlist.json', JSON.stringify(state.wishlist, null, 2));
  });

  importJsonFile(document.getElementById('importCardsFile'), data => {
    if (!Array.isArray(data)) return alert('El JSON de cartas debe ser un array.');
    state.cards = data;
    saveCards();
    renderCards();
    renderStats();
    alert('Colección importada.');
  });

  importJsonFile(document.getElementById('importDecksFile'), data => {
    if (!Array.isArray(data)) return alert('El JSON de mazos debe ser un array.');
    state.decks = data;
    saveDecks();
    renderDecksList();
    alert('Mazos importados.');
  });

  importJsonFile(document.getElementById('importWishlistFile'), data => {
    if (!Array.isArray(data)) return alert('El JSON de wishlist debe ser un array.');
    state.wishlist = data;
    saveWishlist();
    renderWishlist();
    alert('Wishlist importada.');
  });
}
