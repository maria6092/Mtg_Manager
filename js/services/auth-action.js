/**
 * auth-action.js
 * Procesa los enlaces de acción que envía Firebase por email:
 *   - verifyEmail   → confirma la verificación del correo
 *   - resetPassword → (preparado) recuperación de contraseña
 *
 * Firebase añade a la URL parámetros como:
 *   ?mode=verifyEmail&oobCode=XXXX
 *
 * Este archivo detecta esos parámetros al cargar la página, aplica la
 * acción correspondiente y limpia la URL. No toca el index salvo por
 * incluir este <script>.
 *
 * Depende de: fbAuth (definido en index.html) y window.AuthUI.
 */

(function () {

  // Lee los parámetros de la URL
  const params  = new URLSearchParams(window.location.search);
  const mode     = params.get('mode');
  const oobCode  = params.get('oobCode');

  // Si no venimos de un enlace de acción, no hacemos nada.
  if (!mode || !oobCode) return;

  /* ── Quita los parámetros de la URL sin recargar la página ──
     Así, si el usuario refresca, no se vuelve a ejecutar la acción
     (el oobCode ya está usado y daría error). */
  function cleanUrl() {
    const url = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, url);
  }

  /* ── Muestra un mensaje en la pantalla de login ── */
  function showLoginMsg(text, ok) {
    try {
      window.AuthUI?.showLoginScreen?.();
      window.AuthUI?.showView?.('login');
    } catch (_) {}
    const el = document.getElementById('authMsg');
    if (el) {
      el.style.color = ok ? '#4ade80' : '#f87171';
      el.textContent = text;
    }
  }

  /* ── Espera a que fbAuth exista antes de actuar ──
     (este script puede cargar antes de que Firebase termine de iniciar) */
  function whenReady(fn, tries = 0) {
    if (typeof fbAuth !== 'undefined' && window.AuthUI) return fn();
    if (tries > 50) return; // ~5s máximo, evita bucle infinito
    setTimeout(() => whenReady(fn, tries + 1), 100);
  }

  /* ── VERIFICAR EMAIL ── */
  async function handleVerifyEmail() {
    try {
      // Comprueba que el código es válido y aplica la verificación
      await fbAuth.checkActionCode(oobCode);
      await fbAuth.applyActionCode(oobCode);

      // Si hay sesión activa, refresca el estado para que conste verificado
      if (fbAuth.currentUser) {
        try { await fbAuth.currentUser.reload(); } catch (_) {}
      }

      cleanUrl();
      showLoginMsg('✅ Email verificado. Ya puedes iniciar sesión.', true);
    } catch (err) {
      cleanUrl();
      const map = {
        'auth/expired-action-code': 'El enlace ha caducado. Pide uno nuevo desde "Reenviar email de verificación".',
        'auth/invalid-action-code': 'Este enlace ya se usó o no es válido. Pide uno nuevo.',
        'auth/user-disabled':       'Esta cuenta está deshabilitada.',
        'auth/user-not-found':      'No se encontró la cuenta asociada.',
      };
      showLoginMsg(map[err?.code] || 'No se pudo verificar el email. Inténtalo de nuevo.', false);
    }
  }

  /* ── RESET DE CONTRASEÑA (preparado para el futuro) ──
     De momento, si llega un enlace de reset, lo dejamos pasar a la
     pantalla de login con un aviso. Cuando quieras un formulario propio
     para escribir la nueva contraseña, se amplía aquí con
     fbAuth.confirmPasswordReset(oobCode, nuevaPass). */
  function handleResetPassword() {
    cleanUrl();
    showLoginMsg('Sigue las instrucciones para restablecer tu contraseña.', true);
  }

  /* ── Enrutado según el tipo de acción ── */
  whenReady(() => {
    switch (mode) {
      case 'verifyEmail':
        handleVerifyEmail();
        break;
      case 'resetPassword':
        handleResetPassword();
        break;
      default:
        // recoverEmail u otros modos: no los manejamos aún
        cleanUrl();
        break;
    }
  });

})();
