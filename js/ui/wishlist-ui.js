import { state } from '../core/state.js';
import { uid, escapeHtml } from '../core/utils.js';
import { saveWishlist } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';

export function addWish() {
  const name = document.getElementById('wishName')?.value.trim();
  const set = document.getElementById('wishSet')?.value.trim();
  const priority = document.getElementById('wishPriority')?.value || 'Alta';

  if (!name) {
    alert('Escribe el nombre de la carta');
    return;
  }

  state.wishlist.push({ id: uid(), name, set, priority });
  saveWishlist();
  cloudSaveAll();
  renderWishlist();

  document.getElementById('wishName').value = '';
  document.getElementById('wishSet').value = '';
  document.getElementById('wishPriority').value = 'Alta';
}

export function deleteWish(id) {
  if (!confirm('¿Eliminar de la wishlist?')) return;
  state.wishlist = state.wishlist.filter(item => item.id !== id);
  saveWishlist();
  cloudSaveAll();
  renderWishlist();
}

export function renderWishlist() {
  const container = document.getElementById('wishlistDiv');
  if (!container) return;

  if (!state.wishlist.length) {
    container.innerHTML = '<p class="hint">Tu wishlist está vacía.</p>';
    return;
  }

  let html = '<table><thead><tr><th>Carta</th><th>Edición</th><th>Prioridad</th><th>Acción</th></tr></thead><tbody>';
  state.wishlist.forEach(item => {
    html += `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.set || '—')}</td>
        <td><span class="pill">${escapeHtml(item.priority)}</span></td>
        <td><button class="btn danger tiny" data-delete-wish="${item.id}">🗑️</button></td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('[data-delete-wish]').forEach(button => {
    button.addEventListener('click', () => deleteWish(button.dataset.deleteWish));
  });
}

export function initWishlistUI() {
  document.getElementById('btnAddWish')?.addEventListener('click', addWish);
}
