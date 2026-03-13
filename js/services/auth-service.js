import { REMEMBER_KEY } from '../core/constants.js';
import { fb, initFirebase } from './firebase.js';

export function getRememberPref() {
  try {
    const value = localStorage.getItem(REMEMBER_KEY);
    return value !== '0';
  } catch {
    return true;
  }
}

export function setRememberPref(value) {
  try {
    localStorage.setItem(REMEMBER_KEY, value ? '1' : '0');
  } catch {}
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

export function isStrongPassword(password) {
  const value = String(password || '');
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export async function registerUser(email, password) {
  await initFirebase();
  if (!fb.ready) throw new Error('Firebase no está disponible.');
  const result = await fb.fns.createUserWithEmailAndPassword(fb.auth, email, password);
  return result.user;
}

export async function loginUser(email, password) {
  await initFirebase();
  if (!fb.ready) throw new Error('Firebase no está disponible.');
  const result = await fb.fns.signInWithEmailAndPassword(fb.auth, email, password);
  return result.user;
}

export async function logoutUser() {
  await initFirebase();
  if (!fb.ready) return;
  await fb.fns.signOut(fb.auth);
}
