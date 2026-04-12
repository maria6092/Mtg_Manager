import { state } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { cloudSaveAll } from '../services/cloud-service.js';
import { applySettings, applyThemePreset } from '../core/theme.js';
import { DEFAULT_SETTINGS } from '../core/constants.js';
import { saveBackupLocal, getLastBackup } from '../core/storage.js';
import { downloadFile } from '../core/utils.js';
import { renderCardsTable } from './cards-ui.js';
import { renderDecks } from './decks-ui.js';
import { renderColorStats, renderTypeStats, updateInvestmentUI } from './stats-ui.js';
import { renderSalesTable } from './sales-ui.js';

let autoBackupTimer = null;

function formatTs(ts) { try { return new Date(ts).toLocaleString(); } catch { return ''; } }

function buildBackupPayload() {
  return { ts:Date.now(), version:'v1', cards:state.cards, decks:state.decks, settings:state.settings, sortState:state.sortState };
}

function doBackupNow(silent = false) {
  saveBackupLocal(buildBackupPayload());
  updateBackupInfoUI();
  if (!silent) alert('Backup guardado ✅');
}

function updateBackupInfoUI() {
  const info = document.getElementById('backupInfo');
  if (!info) return;
  const last = getLastBackup();
  info.textContent = last
    ? `Último backup: ${formatTs(last.ts)} · Cartas: ${last.cards?.length||0} · Mazos: ${last.decks?.length||0}`
    : 'No hay backups aún.';
}

function startAutoBackupTimer() {
  if (autoBackupTimer) clearInterval(autoBackupTimer);
  autoBackupTimer = null;
  if (!state.settings.autoBackupEnabled) return;
  const min = Math.max(5, parseInt(state.settings.autoBackupEveryMin||'30', 10));
  autoBackupTimer = setInterval(() => doBackupNow(true), min * 60 * 1000);
}

export function initSettingsUI() {
  const el = id => document.getElementById(id);
  const themeSel   = el('setTheme');
  const fontRange  = el('setFontSize');
  const fontLabel  = el('fontPxLabel');
  const compactChk = el('setCompact');
  const motionChk  = el('setReducedMotion');
  const currencySel= el('setCurrency');
  if (!themeSel) return;

  themeSel.value   = state.settings.theme;
  fontRange.value  = state.settings.fontPx;
  if (fontLabel) fontLabel.textContent = String(state.settings.fontPx);
  compactChk.checked = state.settings.density === 'compact';
  motionChk.checked  = state.settings.motion  === 'reduced';
  currencySel.value  = state.settings.currency;

  document.querySelectorAll('.theme-swatch').forEach(sw => {
    sw.onclick = () => {
      state.settings.theme = sw.dataset.t;
      saveSettings(); cloudSaveAll(); applySettings();
      if (themeSel) themeSel.value = state.settings.theme;
    };
  });

  themeSel.onchange = () => { state.settings.theme = themeSel.value; saveSettings(); cloudSaveAll(); applySettings(); };

  fontRange.oninput = () => {
    const v = parseInt(fontRange.value, 10); state.settings.fontPx = v;
    if (fontLabel) fontLabel.textContent = String(v);
    saveSettings(); cloudSaveAll(); applySettings();
  };

  compactChk.onchange = () => { state.settings.density = compactChk.checked?'compact':'normal'; saveSettings(); cloudSaveAll(); applySettings(); };
  motionChk.onchange  = () => { state.settings.motion  = motionChk.checked?'reduced':'normal'; saveSettings(); cloudSaveAll(); applySettings(); };

  currencySel.onchange = () => {
    state.settings.currency = currencySel.value;
    saveSettings(); cloudSaveAll();
    renderCardsTable(); updateInvestmentUI(); renderSalesTable();
  };

  el('btnResetSettings')?.addEventListener('click', () => {
    if (!confirm('¿Resetear ajustes?')) return;
    state.settings = { ...DEFAULT_SETTINGS };
    saveSettings(); cloudSaveAll(); applySettings();
    initSettingsUI();
  });

  // Backup UI
  const chk = el('setAutoBackup'), sel = el('setAutoBackupEvery');
  const btnNow = el('btnBackupNow'), btnDl = el('btnBackupDownload'), btnRestore = el('btnBackupRestore');
  if (chk && sel) {
    chk.checked = !!state.settings.autoBackupEnabled;
    sel.value   = String(state.settings.autoBackupEveryMin||'30');
    chk.onchange = () => { state.settings.autoBackupEnabled = chk.checked; saveSettings(); startAutoBackupTimer(); updateBackupInfoUI(); };
    sel.onchange = () => { state.settings.autoBackupEveryMin = sel.value; saveSettings(); startAutoBackupTimer(); };
  }
  btnNow?.addEventListener('click', () => doBackupNow(false));
  btnDl?.addEventListener('click', () => {
    const payload = buildBackupPayload();
    downloadFile(`mtg_backup_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload,null,2));
  });
  btnRestore?.addEventListener('click', () => {
    const last = getLastBackup(); if (!last) { alert('No hay backup.'); return; }
    if (!confirm(`¿Restaurar backup del ${formatTs(last.ts)}?`)) return;
    state.cards    = Array.isArray(last.cards) ? last.cards : [];
    state.decks    = Array.isArray(last.decks) ? last.decks : [];
    state.settings = { ...DEFAULT_SETTINGS, ...(last.settings||{}) };
    state.sortState = { ...state.sortState, ...(last.sortState||{}) };
    import('../core/storage.js').then(m => { m.saveCards(); m.saveDecks(); m.saveSettings(); m.saveSortState(); });
    applySettings(); initSettingsUI();
    renderCardsTable(); renderDecks(); updateInvestmentUI(); renderSalesTable();
    updateBackupInfoUI(); alert('Backup restaurado ✅');
  });

  updateBackupInfoUI();
  startAutoBackupTimer();
}