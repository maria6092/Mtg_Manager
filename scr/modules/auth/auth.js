/**
 * auth.js
 * Lógica de autenticación con Firebase Auth.
 * Sin DOM — solo lógica pura y llamadas a Firebase.
 */

import { fbAuth } from "../../services/firebase.js";
import { setFbUser, getFbUser } from "../../state/store.js";
import { isValidEmail, isStrongPassword, fbErrorMsg } from "../../utils/helpers.js";

/**
 * Inicia sesión con email y contraseña.
 * @throws {string} mensaje de error legible
 */
export async function signIn(email, password) {
  if (!email || !password) throw "Completa email y contraseña.";
  if (!isValidEmail(email))  throw "El email no es válido.";
  await fbAuth.signInWithEmailAndPassword(email, password);
}

/**
 * Crea una cuenta nueva.
 * @throws {string} mensaje de error legible
 */
export async function signUp({ username, email, email2, pass, pass2 }) {
  if (!username)                                     throw "Escribe un nombre de usuario.";
  if (!email || !email2)                             throw "Completa y confirma el email.";
  if (email.toLowerCase() !== email2.toLowerCase())  throw "Los emails no coinciden.";
  if (!isValidEmail(email))                          throw "El email no es válido.";
  if (!pass || !pass2)                               throw "Completa y repite la contraseña.";
  if (pass !== pass2)                                throw "Las contraseñas no coinciden.";
  if (!isStrongPassword(pass))                       throw "Contraseña demasiado corta (mínimo 6 caracteres).";

  const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
  await cred.user.updateProfile({ displayName: username });
}

/**
 * Cierra la sesión actual.
 */
export async function signOut() {
  await fbAuth.signOut();
  setFbUser(null);
}

/**
 * Envía email de recuperación de contraseña.
 * @throws {string} mensaje de error legible
 */
export async function sendPasswordReset(email) {
  if (!email || !isValidEmail(email)) throw "Escribe tu email arriba y pulsa este botón.";
  await fbAuth.sendPasswordResetEmail(email);
}

/**
 * Registra el listener de cambio de estado de autenticación.
 * @param {(user: firebase.User | null) => void} onLogin
 * @param {() => void} onLogout
 */
export function onAuthStateChange(onLogin, onLogout) {
  fbAuth.onAuthStateChanged(user => {
    if (user) {
      setFbUser(user);
      onLogin(user);
    } else {
      setFbUser(null);
      onLogout();
    }
  });
}
