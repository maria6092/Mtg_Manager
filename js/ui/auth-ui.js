import { clearSession } from '../core/storage.js';
import { cloudLoadAll } from '../services/cloud-service.js';

function showLogin() {
  const scr = document.getElementById('authScreen');
  if (!scr) return;
  scr.style.display = 'flex';
  scr.classList.remove('is-exit');
  void scr.offsetWidth;
  scr.classList.add('is-enter');
}

function showApp() {
  const scr = document.getElementById('authScreen');
  if (!scr) return;
  scr.classList.remove('is-enter');
  scr.classList.add('is-exit');
  setTimeout(() => { scr.style.display = 'none'; }, 380);
  document.getElementById('btnSignOutTop')?.style && (document.getElementById('btnSignOutTop').style.display = '');
  document.getElementById('btnSignOutSidebar')?.style && (document.getElementById('btnSignOutSidebar').style.display = '');
}

function showAuthView(which) {
  const login  = document.getElementById('authLoginView');
  const signup = document.getElementById('authSignupView');
  if (!login || !signup) return;
  login.style.display  = which === 'signup' ? 'none' : 'grid';
  signup.style.display = which === 'signup' ? 'grid' : 'none';
}

function setMsg(text, ok = false) {
  const el = document.getElementById('authMsg');
  if (el) { el.style.color = ok ? '#16a34a' : '#ef4444'; el.textContent = text || ''; }
}

function setMsg2(text, ok = false) {
  const el = document.getElementById('authMsg2');
  if (el) { el.style.color = ok ? '#16a34a' : '#ef4444'; el.textContent = text || ''; }
}

function isValidEmail(e)    { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e||'').trim()); }
function isStrongPassword(p){ return String(p||'').length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p); }

function signOut() {
  window._fbFns?.signOut?.(window._fbAuth);
  clearSession();
  document.getElementById('btnSignOutTop')?.style     && (document.getElementById('btnSignOutTop').style.display = 'none');
  document.getElementById('btnSignOutSidebar')?.style && (document.getElementById('btnSignOutSidebar').style.display = 'none');
  showLogin();
}

export function initAuthUI() {
  showLogin();
  showAuthView('login');

  document.getElementById('btnBackToLogin')?.addEventListener('click', () => showAuthView('login'));

  document.getElementById('btnSignUp')?.addEventListener('click', () => {
    setMsg('');
    showAuthView('signup');
    const emailEl = document.getElementById('authEmail');
    const suEmail = document.getElementById('suEmail');
    if (emailEl?.value && suEmail) suEmail.value = emailEl.value;
  });

  document.getElementById('btnForgotPass')?.addEventListener('click', async () => {
    const email = document.getElementById('authEmail')?.value.trim();
    if (!email) { setMsg('Escribe tu email primero.'); return; }
    try {
      const { sendPasswordResetEmail } = window._fbFns;
      await sendPasswordResetEmail(window._fbAuth, email);
      setMsg('Email de recuperación enviado ✅', true);
    } catch(e) {
      setMsg('Error: ' + (e?.message || e));
    }
  });

  document.getElementById('btnSignOutTop')?.addEventListener('click', signOut);
  document.getElementById('btnSignOutSidebar')?.addEventListener('click', signOut);

  document.getElementById('btnCreateAccount')?.addEventListener('click', async () => {
    setMsg2('');
    const username = document.getElementById('suUsername')?.value.trim();
    const email1   = document.getElementById('suEmail')?.value.trim();
    const email2   = document.getElementById('suEmail2')?.value.trim();
    const pass1    = document.getElementById('suPass')?.value  || '';
    const pass2    = document.getElementById('suPass2')?.value || '';

    if (!username)                                          return setMsg2('Escribe un nombre de usuario.');
    if (!email1 || !email2)                                 return setMsg2('Completa y confirma el email.');
    if (email1.toLowerCase() !== email2.toLowerCase())      return setMsg2('Los emails no coinciden.');
    if (!isValidEmail(email1))                              return setMsg2('El email no es válido.');
    if (!pass1 || !pass2)                                   return setMsg2('Completa y repite la contraseña.');
    if (pass1 !== pass2)                                    return setMsg2('Las contraseñas no coinciden.');
    if (!isStrongPassword(pass1))                           return setMsg2('Mínimo 8 caracteres, letras y números.');

    try {
      const { createUserWithEmailAndPassword, doc, setDoc } = window._fbFns;
      const cred = await createUserWithEmailAndPassword(window._fbAuth, email1, pass1);
      await setDoc(doc(window._fbDb, 'users', cred.user.uid, 'profile', 'main'), {
        username, email: email1, createdAt: Date.now(),
      });
      showAuthView('login');
      const emailEl = document.getElementById('authEmail');
      if (emailEl) emailEl.value = email1;
      setMsg('Cuenta creada ✅ Ya puedes iniciar sesión.', true);
    } catch(e) {
      const msgs = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/weak-password':        'Contraseña demasiado débil.',
        'auth/invalid-email':        'Email no válido.',
      };
      setMsg2(msgs[e.code] || 'Error: ' + e.message);
    }
  });

  document.getElementById('btnSignIn')?.addEventListener('click', async () => {
    setMsg('');
    const email    = document.getElementById('authEmail')?.value.trim();
    const password = document.getElementById('authPass')?.value || '';
    if (!email || !password) { setMsg('Completa email y contraseña.'); return; }
    try {
      const { signInWithEmailAndPassword } = window._fbFns;
      const cred = await signInWithEmailAndPassword(window._fbAuth, email, password);
      window._fbCurrentUser = cred.user;
      await cloudLoadAll();
      showApp();
    } catch(e) {
      const msgs = {
        'auth/invalid-credential':  'Email o contraseña incorrectos.',
        'auth/user-not-found':      'No existe esa cuenta.',
        'auth/wrong-password':      'Contraseña incorrecta.',
        'auth/too-many-requests':   'Demasiados intentos. Espera.',
      };
      setMsg(msgs[e.code] || 'Error: ' + e.message);
    }
  });

  window._onAuthReady = async (user) => {
    if (user) {
      window._fbCurrentUser = user;
      await cloudLoadAll();
      showApp();
    }
  };
}