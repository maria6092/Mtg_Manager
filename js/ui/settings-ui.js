// FASE 2: mueve aquí applySettings, loadSettingsIntoUI, manualCloudSave, manualCloudLoad.
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
  const themeSelect = document.getElementById('themeSelect');
  const densitySelect = document.getElementById('densitySelect');
  const motionSelect = document.getElementById('motionSelect');
  const fontSizeSelect = document.getElementById('fontSizeSelect');

  if (themeSelect) {
    themeSelect.addEventListener('change', e => {
      state.settings.theme = e.target.value;
      applySettings();
      saveSettings();
    });
  }

  if (densitySelect) {
    densitySelect.addEventListener('change', e => {
      state.settings.density = e.target.value;
      applySettings();
      saveSettings();
    });
  }

  if (motionSelect) {
    motionSelect.addEventListener('change', e => {
      state.settings.motion = e.target.value;
      applySettings();
      saveSettings();
    });
  }

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', e => {
      state.settings.fontSize = e.target.value;
      applySettings();
      saveSettings();
    });
  }
}