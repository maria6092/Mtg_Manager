/**
 * helpers.js
 * Funciones utilitarias puras (sin estado, sin DOM, sin Firebase).
 */

// ─── Validación ──────────────────────────────────────────────────────────────

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

export function isStrongPassword(pw) {
  return String(pw || "").length >= 6; // Firebase requiere mínimo 6
}

// ─── Texto ───────────────────────────────────────────────────────────────────

export function toTitleCase(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w)
    .join(" ");
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatTs(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

// ─── Colores / CSS ───────────────────────────────────────────────────────────

export function hexToRgba(hex, a) {
  const h = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(240,98,146,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ─── Misc ────────────────────────────────────────────────────────────────────

export function socialPairKey(a, b) {
  return [String(a || ""), String(b || "")].sort().join("__");
}

export function getPublicSellerName(user) {
  if (!user) return "Usuario";
  return user.username || user.email || "Usuario";
}

/**
 * Traduce códigos de error de Firebase Auth a mensajes en español.
 * @param {Error} err
 * @returns {string}
 */
export function fbErrorMsg(err) {
  const code = err?.code || "";
  const map = {
    "auth/user-not-found":         "No existe una cuenta con ese email.",
    "auth/wrong-password":         "Contraseña incorrecta.",
    "auth/invalid-credential":     "Email o contraseña incorrectos.",
    "auth/email-already-in-use":   "Ya existe una cuenta con ese email.",
    "auth/weak-password":          "Contraseña demasiado débil (mínimo 6 caracteres).",
    "auth/invalid-email":          "El email no es válido.",
    "auth/too-many-requests":      "Demasiados intentos. Espera un momento.",
    "auth/network-request-failed": "Sin conexión. Revisa tu red.",
  };
  return map[code] || (err?.message || "Error desconocido.");
}
