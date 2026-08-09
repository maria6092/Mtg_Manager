// Selector de avatar/banner predefinidos.
// De momento son placeholders (SVG de color) en /assets/avatars y /assets/banners.
// Cuando tengas las imágenes definitivas, solo hay que sustituir esos archivos
// (mismo nombre, mismo número) o ampliar los arrays de abajo.

const AVATAR_PRESETS = ['av-01', 'av-02', 'av-03', 'av-04', 'av-05', 'av-06'];
const BANNER_PRESETS = ['bn-01', 'bn-02', 'bn-03', 'bn-04'];

const avatarPath = id => `assets/avatars/${id}.svg`;
const bannerPath = id => `assets/banners/${id}.svg`;

function paintPreview(kind, id) {
  const path = kind === 'avatar' ? avatarPath(id) : bannerPath(id);
  const previewImgIds = kind === 'avatar'
    ? ['profileEditAvatarPreview', 'profileEditAvatarLarge']
    : [];
  previewImgIds.forEach(elId => {
    const el = document.getElementById(elId);
    if (el) el.src = path;
  });
  if (kind === 'banner') {
    const hero = document.getElementById('profileHeroEditPreview');
    if (hero) hero.style.backgroundImage = `url(${path})`;
  }
}

function buildGrid(containerId, kind, presets, selectedId, hiddenInputId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  presets.forEach(id => {
    const path = kind === 'avatar' ? avatarPath(id) : bannerPath(id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'presetItem' + (id === selectedId ? ' selected' : '');
    item.dataset.presetId = id;
    item.style.backgroundImage = `url(${path})`;
    item.setAttribute('aria-label', `Elegir ${id}`);
    item.addEventListener('click', () => {
      grid.querySelectorAll('.presetItem').forEach(n => n.classList.remove('selected'));
      item.classList.add('selected');
      const hidden = document.getElementById(hiddenInputId);
      if (hidden) hidden.value = id;
      paintPreview(kind, id);
    });
    grid.appendChild(item);
  });
}

export function initProfilePresetsUI(currentAvatarId = 'av-01', currentBannerId = 'bn-01') {
  buildGrid('avatarPresetGrid', 'avatar', AVATAR_PRESETS, currentAvatarId, 'profileAvatarChoice');
  buildGrid('bannerPresetGrid', 'banner', BANNER_PRESETS, currentBannerId, 'profileBannerChoice');
  paintPreview('avatar', currentAvatarId);
  paintPreview('banner', currentBannerId);
}

export { AVATAR_PRESETS, BANNER_PRESETS, avatarPath, bannerPath };
