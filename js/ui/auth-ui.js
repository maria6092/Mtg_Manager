// FASE 2: mueve aquí showApp, showLogin y mensajes de auth.
import { fakeLogin, fakeRegister, getRememberPref, setRememberPref } from '../services/auth-service.js';

export function initAuthUI() {
  const remember = document.getElementById('rememberSession');
  if (remember) remember.checked = getRememberPref();
}

export function initAuthButtons() {
  const btnLogin = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');
  const authMsg = document.getElementById('authMsg');
  const authMsg2 = document.getElementById('authMsg2');
  const remember = document.getElementById('rememberSession');

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      try {
        fakeLogin(email, password);
        setRememberPref(!!remember?.checked);
        if (authMsg) authMsg.textContent = '';
        document.body.classList.add('app-ready');
      } catch (e) {
        if (authMsg) authMsg.textContent = e.message;
      }
    });
  }

  if (btnRegister) {
    btnRegister.addEventListener('click', () => {
      const email = document.getElementById('registerEmail')?.value.trim();
      const password = document.getElementById('registerPassword')?.value;

      try {
        fakeRegister(email, password);
        if (authMsg2) authMsg2.textContent = 'Cuenta creada correctamente.';
      } catch (e) {
        if (authMsg2) authMsg2.textContent = e.message;
      }
    });
  }
}