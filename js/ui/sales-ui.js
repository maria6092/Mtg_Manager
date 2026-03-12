// Reservado por si luego separas ventas.
import { state } from '../core/state.js';
import { downloadFile } from '../core/utils.js';
import { saveCards, saveDecks, saveWishlist } from '../core/storage.js';
import { renderCards } from './cards-ui.js';
import { renderDecksList } from './decks-ui.js';
import { renderWishlist } from './wishlist-ui.js';

function importJsonFile(input, onLoad) {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        onLoad(data);
      } catch {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  });
}

export function initImportUI() {
  const btnExportCards = document.getElementById('btnExportCards');
  const btnExportDecks = document.getElementById('btnExportDecks');
  const btnExportWishlist = document.getElementById('btnExportWishlist');

  const importCardsFile = document.getElementById('importCardsFile');
  const importDecksFile = document.getElementById('importDecksFile');
  const importWishlistFile = document.getElementById('importWishlistFile');

  if (btnExportCards) {
    btnExportCards.addEventListener('click', () => {
      downloadFile('mtg_cards.json', JSON.stringify(state.cards, null, 2));
    });
  }

  if (btnExportDecks) {
    btnExportDecks.addEventListener('click', () => {
      downloadFile('mtg_decks.json', JSON.stringify(state.decks, null, 2));
    });
  }

  if (btnExportWishlist) {
    btnExportWishlist.addEventListener('click', () => {
      downloadFile('mtg_wishlist.json', JSON.stringify(state.wishlist, null, 2));
    });
  }

  if (importCardsFile) {
    importJsonFile(importCardsFile, data => {
      if (!Array.isArray(data)) return alert('El JSON de cartas debe ser un array.');
      state.cards = data;
      saveCards();
      renderCards();
      alert('Colección importada.');
    });
  }

  if (importDecksFile) {
    importJsonFile(importDecksFile, data => {
      if (!Array.isArray(data)) return alert('El JSON de mazos debe ser un array.');
      state.decks = data;
      saveDecks();
      renderDecksList();
      alert('Mazos importados.');
    });
  }

  if (importWishlistFile) {
    importJsonFile(importWishlistFile, data => {
      if (!Array.isArray(data)) return alert('El JSON de wishlist debe ser un array.');
      state.wishlist = data;
      saveWishlist();
      renderWishlist();
      alert('Wishlist importada.');
    });
  }
}