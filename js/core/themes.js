import { state } from './state.js';
import { THEME_PRESETS } from './constants.js';

export function applyThemePreset(key) {
  const preset = THEME_PRESETS[key] || THEME_PRESETS.pink;
  const root = document.documentElement;
  root.style.setProperty('--bg',         preset.bg);
  root.style.setProperty('--card',       preset.card);
  root.style.setProperty('--pink',       preset.pink);
  root.style.setProperty('--pink2',      preset.pink2);
  root.style.setProperty('--soft',       preset.soft);
  root.style.setProperty('--line',       preset.line);
  root.style.setProperty('--text',       preset.text);
  root.style.setProperty('--muted',      preset.muted);
  root.style.setProperty('--input-bg',   preset.inputBg);
  root.style.setProperty('--input-text', preset.inputText);
  root.style.setProperty('--table-bg',   preset.tableBg);
  root.style.setProperty('--shadow',     preset.shadow);
  document.body.dataset.theme = key;
}

export function applySettings() {
  applyThemePreset(state.settings.theme);
  document.documentElement.style.setProperty('--base-font', `${state.settings.fontPx}px`);
  document.body.dataset.density = state.settings.density;
  document.documentElement.dataset.motion = state.settings.motion === 'reduced' ? 'reduced' : 'normal';
}