/**
 * auth-ui.js
 * Controla la pantalla de login/registro.
 * Depende de window.AuthService (auth-firebase.js).
 * Se llama desde el DOMContentLoaded del index.
 */

const AuthUI = (() => {

  /* ── refs DOM ── */
  const $ = id => document.getElementById(id);

  /* ── mostrar/ocultar vistas ── */
  function showView(which) {
    const login  = $('authLoginView');
    const signup = $('authSignupView');
    const forgot = $('authForgotView');
    const resend = $('authResendView');

    [login, signup, forgot, resend].forEach(el => {
      if (el) el.style.display = 'none';
    });

    const target = {
      login:  login,
      signup: signup,
      forgot: forgot,
      resend: resend,
    }[which];

    if (target) target.style.display = 'grid';
    clearMsgs();
  }

  function clearMsgs() {
    ['authMsg','authMsg2','authMsgForgot','authMsgResend'].forEach(id => {
      const el = $(id);
      if (el) el.textContent = '';
    });
  }

  function setMsg(id, text, ok = false) {
    const el = $(id);
    if (!el) return;
    el.style.color = ok ? '#4ade80' : '#f87171';
    el.textContent = text || '';
  }

  /* ── pantalla login/app ── */
  function showLoginScreen() {
    document.body.classList.add('not-authenticated');
    document.body.classList.remove('app-enter');
    const scr = $('authScreen');
    if (scr) {
      scr.style.display = 'flex';
      scr.classList.remove('is-exit');
      void scr.offsetWidth;
      scr.classList.add('is-enter');
    }
    showView('login');
  }

  function showAppScreen() {
    const scr = $('authScreen');
    if (scr) {
      scr.classList.remove('is-enter');
      scr.classList.add('is-exit');
      setTimeout(() => { scr.style.display = 'none'; }, 380);
    }
    document.body.classList.remove('not-authenticated');
    document.body.classList.add('app-enter');
    setTimeout(() => document.body.classList.remove('app-enter'), 450);
  }

  /* ── setDisabled helper ── */
  function setBusy(btn, label, busy) {
    btn.disabled = busy;
    btn.textContent = busy ? label + '…' : label;
  }

  /* ── init ── */
  function init() {
    showView('login');

    /* ── Navegar entre vistas ── */
    $('btnSignUp')?.addEventListener('click', () => {
      const email = $('authEmail')?.value.trim();
      if (email && $('suEmail')) $('suEmail').value = email;
      showView('signup');
    });
    $('btnBackToLogin')?.addEventListener('click', () => showView('login'));
    $('btnGoForgot')?.addEventListener('click', () => {
      const email = $('authEmail')?.value.trim();
      if (email && $('forgotEmail')) $('forgotEmail').value = email;
      showView('forgot');
    });
    $('btnBackFromForgot')?.addEventListener('click', () => showView('login'));
    $('btnGoResend')?.addEventListener('click', () => {
      const email = $('authEmail')?.value.trim();
      if (email && $('resendEmail')) $('resendEmail').value = email;
      showView('resend');
    });
    $('btnBackFromResend')?.addEventListener('click', () => showView('login'));

    /* ── LOGIN ── */
    async function doLogin() {
      const btn = $('btnSignIn');
      const email    = $('authEmail')?.value.trim()  || '';
      const password = $('authPass')?.value          || '';
      setBusy(btn, 'Iniciar sesión', true);
      try {
        await window.AuthService.login({ email, password });
        // onAuthStateChanged lo gestiona — no hacemos nada más aquí
      } catch(err) {
        setMsg('authMsg', window.AuthService.errMsg(err));
      } finally {
        setBusy(btn, 'Iniciar sesión', false);
      }
    }

    $('btnSignIn')?.addEventListener('click', doLogin);
    [$('authEmail'), $('authPass')].forEach(el => {
      el?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    });

    /* ── REGISTRO ── */
    $('btnCreateAccount')?.addEventListener('click', async () => {
      const btn      = $('btnCreateAccount');
      const username = $('suUsername')?.value.trim()  || '';
      const email1   = $('suEmail')?.value.trim()     || '';
      const email2   = $('suEmail2')?.value.trim()    || '';
      const pass1    = $('suPass')?.value             || '';
      const pass2    = $('suPass2')?.value            || '';

      if (!username)                                        return setMsg('authMsg2', 'Escribe un nombre de usuario.');
      if (!email1 || !email2)                               return setMsg('authMsg2', 'Completa y confirma el email.');
      if (email1.toLowerCase() !== email2.toLowerCase())    return setMsg('authMsg2', 'Los emails no coinciden.');
      if (!pass1 || !pass2)                                 return setMsg('authMsg2', 'Completa y repite la contraseña.');
      if (pass1 !== pass2)                                  return setMsg('authMsg2', 'Las contraseñas no coinciden.');

      setBusy(btn, 'Crear cuenta', true);
      try {
        await window.AuthService.register({ username, email: email1, password: pass1 });
        setMsg('authMsg2', '¡Cuenta creada! Revisa tu email para verificarla. ✅', true);
        setTimeout(() => showView('login'), 3000);
      } catch(err) {
        setMsg('authMsg2', window.AuthService.errMsg(err));
      } finally {
        setBusy(btn, 'Crear cuenta', false);
      }
    });

    /* ── RECUPERAR CONTRASEÑA ── */
    $('btnSendReset')?.addEventListener('click', async () => {
      const btn   = $('btnSendReset');
      const email = $('forgotEmail')?.value.trim() || '';
      setBusy(btn, 'Enviar email', true);
      try {
        await window.AuthService.sendPasswordReset(email);
        setMsg('authMsgForgot', `Email enviado a ${email}. Revisa tu bandeja. ✅`, true);
        setTimeout(() => showView('login'), 3500);
      } catch(err) {
        setMsg('authMsgForgot', window.AuthService.errMsg(err));
      } finally {
        setBusy(btn, 'Enviar email', false);
      }
    });

    /* ── REENVIAR VERIFICACIÓN ── */
    $('btnSendResend')?.addEventListener('click', async () => {
      const btn      = $('btnSendResend');
      const email    = $('resendEmail')?.value.trim()  || '';
      const password = $('resendPass')?.value          || '';
      setBusy(btn, 'Reenviar', true);
      try {
        await window.AuthService.resendVerification(email, password);
        setMsg('authMsgResend', 'Email de verificación reenviado. ✅ Revisa tu bandeja.', true);
        setTimeout(() => showView('login'), 3500);
      } catch(err) {
        setMsg('authMsgResend', window.AuthService.errMsg(err));
      } finally {
        setBusy(btn, 'Reenviar', false);
      }
    });

    /* ── CERRAR SESIÓN ── */
    $('btnSignOutTop')?.addEventListener('click', async () => {
      await window.AuthService.logout();
    });
  }

  return { init, showLoginScreen, showAppScreen, showView };
})();

window.AuthUI = AuthUI;