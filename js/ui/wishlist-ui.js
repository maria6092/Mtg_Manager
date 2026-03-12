// FASE 2: mueve aquí addWish, deleteWish y renderWishlist.
import { state } from '../core/state.js';
import { uid } from '../core/utils.js';
import { saveWishlist } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';

export function addWish() {
  const name = document.getElementById('wishName').value.trim();
  const set = document.getElementById('wishSet').value.trim();
  const priority = document.getElementById('wishPriority').value;

  if (!name) {
    alert('Escribe el nombre de la carta');
    return;
  }

  state.wishlist.push({
    id: uid(),
    name,
    set,
    priority
  });

  saveWishlist();
  cloudSaveAll();
  renderWishlist();

  document.getElementById('wishName').value = '';
  document.getElementById('wishSet').value = '';
  document.getElementById('wishPriority').value = 'Alta';
}

export function deleteWish(id) {
  if (!confirm('¿Eliminar de la wishlist?')) return;
  state.wishlist = state.wishlist.filter(w => w.id !== id);
  saveWishlist();
  cloudSaveAll();
  renderWishlist();
}

export function renderWishlist() {
  const div = document.getElementById('wishlistDiv');
  if (!div) return;

  if (state.wishlist.length === 0) {
    div.innerHTML = "<p class='hint'>Tu wishlist está vacía.</p>";
    return;
  }

  let html = "<table><thead><tr><th>Carta</th><th>Edición</th><th>Prioridad</th><th>Acción</th></tr></thead><tbody>";
  state.wishlist.forEach(w => {
    html += `
      <tr>
        <td>${w.name}</td>
        <td>${w.set || '—'}</td>
        <td><span class="pill">${w.priority}</span></td>
        <td><button class="btn danger tiny" data-delete-wish="${w.id}">🗑️</button></td>
      </tr>
    `;
  });
  html += '</tbody></table>';

  div.innerHTML = html;

  div.querySelectorAll('[data-delete-wish]').forEach(btn => {
    btn.addEventListener('click', () => deleteWish(btn.dataset.deleteWish));
  });
}

export function initWishlistUI() {
  const btn = document.getElementById('btnAddWish');
  if (btn) btn.addEventListener('click', addWish);
}