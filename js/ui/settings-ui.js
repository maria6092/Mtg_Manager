import { state } from '../core/state.js';
import { saveSettings } from '../core/storage.js';

export function applySettings() {
  document.documentElement.style.setProperty('--base-font', state.settings.fontSize || '16px');
  document.body.dataset.theme = state.settings.theme || 'default';
  document.body.dataset.density = state.settings.density || 'normal';
  document.body.dataset.motion = state.settings.motion || 'normal';
}

export function loadSettingsIntoUI() {
  const themeSelect = document.getElementById('themeSelect');
  const densitySelect = document.getElementById('densitySelect');
  const motionSelect = document.getElementById('motionSelect');
  const fontSizeSelect = document.getElementById('fontSizeSelect');

  if (themeSelect) themeSelect.value = state.settings.theme;
  if (densitySelect) densitySelect.value = state.settings.density;
  if (motionSelect) motionSelect.value = state.settings.motion;
  if (fontSizeSelect) fontSizeSelect.value = state.settings.fontSize;

  applySettings();
}

export function initSettingsUI() {
  document.getElementById('themeSelect')?.addEventListener('change', event => {
    state.settings.theme = event.target.value;
    saveSettings();
    applySettings();
  });

  document.getElementById('densitySelect')?.addEventListener('change', event => {
    state.settings.density = event.target.value;
    saveSettings();
    applySettings();
  });

  document.getElementById('motionSelect')?.addEventListener('change', event => {
    state.settings.motion = event.target.value;
    saveSettings();
    applySettings();
  });

  document.getElementById('fontSizeSelect')?.addEventListener('change', event => {
    state.settings.fontSize = event.target.value;
    saveSettings();
    applySettings();
  });
}
