import { REMEMBER_KEY } from '../core/constants.js';

export function getRememberPref() {
  try { return localStorage.getItem(REMEMBER_KEY) !== '0'; } catch { return true; }
}
export function setRememberPref(v) {
  try { localStorage.setItem(REMEMBER_KEY, v ? '1' : '0'); } catch {}
}