import { clearLocalData } from '../core/storage.js';
import { loginUser, logoutUser, registerUser, getRememberPref, setRememberPref, isValidEmail, isStrongPassword } from '../services/auth-service.js';
import { cloudLoadAll } from '../services/cloud-service.js';
import { renderCards } from './cards-ui.js';
import { renderDecksList, closeDeck } from './decks-ui.js';
import { renderWishlist } from './wishlist-ui.js';
import { renderStats } from './stats-ui.js';
import { loadSettingsIntoUI } from './settings-ui.js';

export function showLogin() {
  document.body.classList.remove('app-ready');
}

export function showApp() {
  document.body.classList.add('app-ready');
}

export function setMsg(text = '', ok = false) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#16a34a' : '#ef4444';
}

export function setMsg2(text = '', ok = false) {
  const el = document.getElementById('authMsg2');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#16a34a' : '#ef4444';
}

export async function handleAuthUser(user) {
  if (user) {
    await cloudLoadAll();
    renderCards();
    renderDecksList();
    closeDeck();
    renderWishlist();
    renderStats();
    loadSettingsIntoUI();
    showApp();
  } else {
    showLogin();
  }
}

export function initAuthUI() {
  const remember = document.getElementById('rememberSession');
  if (remember) remember.checked = getRememberPref();
}

export function initAuthButtons() {
  document.getElementById('btnLogin')?.addEventListener('click', async () => {
    setMsg('');
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value || '';
    const remember = !!document.getElementById('rememberSession')?.checked;

    if (!email || !password) return setMsg('Completa email y contraseña.');
    if (!isValidEmail(email)) return setMsg('El email no es válido.');

    try {
      await loginUser(email, password);
      setRememberPref(remember);
      setMsg('Acceso correcto ✅', true);
    } catch (error) {
      const messages = {
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/user-not-found': 'No existe esa cuenta.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.'
      };
      setMsg(messages[error.code] || `Error: ${error.message}`);
    }
  });

  document.getElementById('btnRegister')?.addEventListener('click', async () => {
    setMsg2('');
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value || '';

    if (!email || !password) return setMsg2('Completa email y contraseña.');
    if (!isValidEmail(email)) return setMsg2('El email no es válido.');
    if (!isStrongPassword(password)) return setMsg2('Usa mínimo 8 caracteres, letras y números.');

    try {
      await registerUser(email, password);
      setMsg2('Cuenta creada correctamente ✅', true);
    } catch (error) {
      const messages = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/weak-password': 'Contraseña demasiado débil.',
        'auth/invalid-email': 'Email no válido.'
      };
      setMsg2(messages[error.code] || `Error: ${error.message}`);
    }
  });

  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await logoutUser();
    clearLocalData();
    renderCards();
    renderDecksList();
    renderWishlist();
    renderStats();
    showLogin();
  });
}
