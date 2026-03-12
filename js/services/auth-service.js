// FASE 2: mueve aquí login, registro, logout y remember session.
import { REMEMBER_KEY } from '../core/constants.js';

export function getRememberPref() {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1';
  } catch {
    return false;
  }
}

export function setRememberPref(value) {
  try {
    localStorage.setItem(REMEMBER_KEY, value ? '1' : '0');
  } catch {}
}

export function fakeLogin(email, password) {
  if (!email || !password) {
    throw new Error('Completa email y contraseña.');
  }
  return { email };
}

export function fakeRegister(email, password) {
  if (!email || !password) {
    throw new Error('Completa email y contraseña.');
  }
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }
  return { email };
}