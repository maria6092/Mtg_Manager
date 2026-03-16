/**
 * settings.js
 * Lógica de configuración y backups.
 */

import { getSettings, setSettings, getAppPayload } from "../../state/store.js";
import { userLoad, userSave, LS_SETTINGS, LS_SORT, LS_BACKUP_LAST, LS_BACKUP_HISTORY } from "../../utils/storage.js";
import { loadJson, saveJson } from "../../utils/storage.js";
import { formatTs } from "../../utils/helpers.js";

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  theme:         "dark",
  fontSize:      16,
  compact:       false,
  motion:        "normal",
  currency:      "EUR",
  colFavFilter:  "all",
  autoBackup:    false,
  autoBackupEvery: 30,
};

// ─── Carga ────────────────────────────────────────────────────────────────────

export function loadSettings() {
  const raw = userLoad(LS_SETTINGS, null, []);
  const settings = raw ? { ...DEFAULT_SETTINGS, ...raw } : { ...DEFAULT_SETTINGS };
  setSettings(settings);
  return settings;
}

export function loadSortState() {
  const raw  = userLoad(LS_SORT, null, []);
  const base = { key: "added", dir: "desc" };
  return raw ? { ...base, ...raw } : base;
}

// ─── Guardado ─────────────────────────────────────────────────────────────────

export function saveSettings() {
  userSave(LS_SETTINGS, getSettings());
}

export function saveSortState(sortState) {
  userSave(LS_SORT, sortState);
}

// ─── Aplicar al DOM ───────────────────────────────────────────────────────────

export function applySettings() {
  const s = getSettings();
  document.documentElement.style.setProperty("--base-font", `${s.fontSize || 16}px`);
  document.body.dataset.density = s.compact ? "compact" : "normal";
  document.documentElement.dataset.motion = s.motion === "reduced" ? "reduced" : "normal";
}

// ─── Backups ──────────────────────────────────────────────────────────────────

export function buildBackupPayload() {
  const payload = getAppPayload();
  return {
    ts:      Date.now(),
    version: "v1",
    ...payload,
  };
}

export function saveBackupLocal(payload) {
  saveJson(LS_BACKUP_LAST, payload);
  try {
    const arr  = loadJson(LS_BACKUP_HISTORY, []);
    const next = Array.isArray(arr) ? arr : [];
    next.unshift({
      ts:        payload.ts,
      sizeCards: payload.cards?.length  || 0,
      sizeDecks: payload.decks?.length  || 0,
    });
    while (next.length > 10) next.pop();
    saveJson(LS_BACKUP_HISTORY, next);
  } catch {}
}

export function getLastBackup() {
  return loadJson(LS_BACKUP_LAST, null);
}

export function doBackupNow(silent = false) {
  const payload = buildBackupPayload();
  saveBackupLocal(payload);
  if (!silent) alert("Backup guardado.");
  return payload;
}

export function getBackupInfoText() {
  const last = getLastBackup();
  return last
    ? `Último backup: ${formatTs(last.ts)} · Cartas: ${last.cards?.length || 0} · Mazos: ${last.decks?.length || 0}`
    : "No hay backups aún.";
}

export function downloadBackup() {
  const last = getLastBackup();
  if (!last) { alert("No hay ningún backup guardado."); return; }
  const blob = new Blob([JSON.stringify(last, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `mtg-backup-${new Date(last.ts).toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Auto-backup ──────────────────────────────────────────────────────────────

let _autoBackupTimer = null;

export function startAutoBackup() {
  stopAutoBackup();
  const s = getSettings();
  if (!s.autoBackup) return;
  const ms = (s.autoBackupEvery || 30) * 60 * 1000;
  _autoBackupTimer = setInterval(() => doBackupNow(true), ms);
}

export function stopAutoBackup() {
  if (_autoBackupTimer) {
    clearInterval(_autoBackupTimer);
    _autoBackupTimer = null;
  }
}
