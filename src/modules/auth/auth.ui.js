/**
 * auth.ui.js
 * UI de la pantalla de autenticación: login, registro, recuperación.
 * Solo toca el DOM — llama a auth.js para la lógica de Firebase.
 */

import { signIn, signUp, signOut, sendPasswordReset } from "./auth.js";

// ─── Mostrar / ocultar pantallas ──────────────────────────────────────────────

export function showLoginScreen() {
  document.body.classList.add("not-authenticated");
  document.body.classList.remove("app-enter");
  const scr = document.getElementById("authScreen");
  if (!scr) return;
  scr.style.display = "flex";
  scr.classList.remove("is-exit");
  void scr.offsetWidth; // reflow para la animación
  scr.classList.add("is-enter");
}

export function showAppScreen() {
  const scr = document.getElementById("authScreen");
  if (scr) {
    scr.classList.remove("is-enter");
    scr.classList.add("is-exit");
    setTimeout(() => { scr.style.display = "none"; }, 380);
  }
  document.body.classList.remove("not-authenticated");
  document.body.classList.add("app-enter");
  setTimeout(() => document.body.classList.remove("app-enter"), 450);
}

export function showAuthView(which) {
  const login  = document.getElementById("authLoginView");
  const signup = document.getElementById("authSignupView");
  if (!login || !signup) return;
  if (which === "signup") {
    login.style.display  = "none";
    signup.style.display = "grid";
  } else {
    signup.style.display = "none";
    login.style.display  = "grid";
  }
  _setMsg("");
  _setMsg2("");
}

/** Actualiza visibilidad del botón de cerrar sesión en el topbar */
export function syncAuthTopbar(user) {
  const btnOut        = document.getElementById("btnSignOutTop");
  const btnOutSidebar = document.getElementById("btnSignOutSidebar");
  if (btnOut)        btnOut.style.display        = user ? "" : "none";
  if (btnOutSidebar) btnOutSidebar.style.display  = user ? "" : "none";
}

// ─── Mensajes internos ───────────────────────────────────────────────────────

function _setMsg(text, ok = false) {
  const msg = document.getElementById("authMsg");
  if (!msg) return;
  msg.style.color = ok ? "#4ade80" : "#f87171";
  msg.textContent = text || "";
}

function _setMsg2(text, ok = false) {
  const msg = document.getElementById("authMsg2");
  if (!msg) return;
  msg.style.color = ok ? "#4ade80" : "#f87171";
  msg.textContent = text || "";
}

// ─── Inicializar listeners ────────────────────────────────────────────────────

/**
 * Registra todos los listeners de la pantalla de auth.
 * Llamar UNA vez cuando no hay sesión activa.
 */
export function initAuthUI({ onSignOutSuccess } = {}) {
  const emailEl    = document.getElementById("authEmail");
  const passEl     = document.getElementById("authPass");
  const btnIn      = document.getElementById("btnSignIn");
  const btnUp      = document.getElementById("btnSignUp");
  const btnForgot  = document.getElementById("btnForgotPass");
  const btnOutTop  = document.getElementById("btnSignOutTop");
  const btnOutSide = document.getElementById("btnSignOutSidebar");

  const suUserEl   = document.getElementById("suUsername");
  const suEmailEl  = document.getElementById("suEmail");
  const suEmail2El = document.getElementById("suEmail2");
  const suPassEl   = document.getElementById("suPass");
  const suPass2El  = document.getElementById("suPass2");
  const btnCreate  = document.getElementById("btnCreateAccount");
  const btnBack    = document.getElementById("btnBackToLogin");

  showLoginScreen();
  showAuthView("login");

  // ── Ir a registro ──
  if (btnUp) {
    btnUp.onclick = () => {
      _setMsg("");
      showAuthView("signup");
      const e = (emailEl?.value || "").trim();
      if (e && suEmailEl) suEmailEl.value = e;
    };
  }

  // ── Volver al login ──
  if (btnBack) {
    btnBack.onclick = () => showAuthView("login");
  }

  // ── Recuperar contraseña ──
  if (btnForgot) {
    btnForgot.onclick = async () => {
      const email = (emailEl?.value || "").trim();
      btnForgot.disabled = true;
      btnForgot.textContent = "Enviando…";
      try {
        await sendPasswordReset(email);
        _setMsg(`Email enviado a ${email}. Revisa tu bandeja.`, true);
      } catch (err) {
        _setMsg(typeof err === "string" ? err : (err?.message || "Error desconocido."));
      } finally {
        btnForgot.disabled = false;
        btnForgot.textContent = "¿Olvidaste tu contraseña?";
      }
    };
  }

  // ── Iniciar sesión ──
  if (btnIn) {
    btnIn.onclick = async () => {
      _setMsg("");
      btnIn.disabled = true;
      btnIn.textContent = "Entrando…";
      try {
        await signIn(
          (emailEl?.value || "").trim(),
          passEl?.value || ""
        );
        // onAuthStateChanged en main.js lo gestiona
      } catch (err) {
        _setMsg(typeof err === "string" ? err : (err?.message || "Error desconocido."));
      } finally {
        btnIn.disabled = false;
        btnIn.textContent = "Iniciar sesión";
      }
    };
  }

  // ── Crear cuenta ──
  if (btnCreate) {
    btnCreate.onclick = async () => {
      _setMsg2("");
      btnCreate.disabled = true;
      btnCreate.textContent = "Creando cuenta…";
      try {
        await signUp({
          username: suUserEl?.value  || "",
          email:    suEmailEl?.value || "",
          email2:   suEmail2El?.value|| "",
          pass:     suPassEl?.value  || "",
          pass2:    suPass2El?.value || "",
        });
        _setMsg2("Cuenta creada. Bienvenido.", true);
      } catch (err) {
        _setMsg2(typeof err === "string" ? err : (err?.message || "Error desconocido."));
      } finally {
        btnCreate.disabled = false;
        btnCreate.textContent = "Crear cuenta";
      }
    };
  }

  // ── Cerrar sesión (topbar y sidebar) ──
  const doSignOut = async () => {
    await signOut();
    showLoginScreen();
    showAuthView("login");
    onSignOutSuccess?.();
  };
  if (btnOutTop)  btnOutTop.onclick  = doSignOut;
  if (btnOutSide) btnOutSide.onclick = doSignOut;

  // ── Enter en inputs de login ──
  [emailEl, passEl].forEach(el => {
    el?.addEventListener("keydown", e => { if (e.key === "Enter") btnIn?.click(); });
  });
}
