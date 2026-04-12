export const STORAGE_KEYS = {
  cards:    'mtg_cards_v9',
  decks:    'mtg_decks_v9',
  wishlist: 'mtg_wishlist_v1',
  settings: 'mtg_settings_v9',
  sortState:'mtg_sort_v9',
  lastTab:  'mtg_last_tab_v9',
  search:   'mtg_search_v9',
  backupLast:    'mtg_backup_last_v1',
  backupHistory: 'mtg_backup_history_v1',
  introSets:     'mtg_intro_sets_v1',
};

export const REMEMBER_KEY = 'mtg_rosita_remember_v1';

export const TABS = [
  'intro','cartas','stats_colores','stats_tipos',
  'coleccion','buscador','mazos','deseos','ventas','ajustes'
];

export const RARITY_MAP = {
  common:'Común', uncommon:'Poco común',
  rare:'Rara', mythic:'Mítica', special:'Especial'
};

export const THEME_PRESETS = {
  pink:  { bg:'#fff0f6', card:'#ffffff', pink:'#f06292', pink2:'#d81b60', soft:'#f8bbd0', line:'#f2c5d5', text:'#4a2c37', muted:'#7a4a5a', inputBg:'#ffffff', inputText:'#111827', tableBg:'#ffffff', shadow:'0 10px 24px rgba(216,27,96,.10)' },
  white: { bg:'#fafaf7', card:'#ffffff', pink:'#c8a84b', pink2:'#8b6914', soft:'#f5f0dc', line:'#e8dfc4', text:'#2a2416', muted:'#6b5a38', inputBg:'#ffffff', inputText:'#111827', tableBg:'#ffffff', shadow:'0 10px 24px rgba(139,105,20,.10)' },
  blue:  { bg:'#eff6ff', card:'#ffffff', pink:'#3b82f6', pink2:'#1d4ed8', soft:'#bfdbfe', line:'#c7d2fe', text:'#1e2a44', muted:'#4b5b7a', inputBg:'#ffffff', inputText:'#111827', tableBg:'#ffffff', shadow:'0 10px 24px rgba(29,78,216,.12)' },
  black: { bg:'#0b0b10', card:'#111827', pink:'#a78bfa', pink2:'#7c3aed', soft:'#1f2937', line:'#374151', text:'#e5e7eb', muted:'#9ca3af', inputBg:'#0f172a', inputText:'#e5e7eb', tableBg:'#0f172a', shadow:'0 10px 26px rgba(0,0,0,.45)' },
  red:   { bg:'#fff1f1', card:'#ffffff', pink:'#ef4444', pink2:'#b91c1c', soft:'#fecaca', line:'#f5b5b5', text:'#3a1f1f', muted:'#7a4a4a', inputBg:'#ffffff', inputText:'#111827', tableBg:'#ffffff', shadow:'0 10px 24px rgba(185,28,28,.12)' },
  green: { bg:'#ecfdf5', card:'#ffffff', pink:'#22c55e', pink2:'#15803d', soft:'#bbf7d0', line:'#a7f3d0', text:'#15352a', muted:'#3f6b57', inputBg:'#ffffff', inputText:'#111827', tableBg:'#ffffff', shadow:'0 10px 24px rgba(21,128,61,.12)' },
  gold:  { bg:'#fffbeb', card:'#ffffff', pink:'#d97706', pink2:'#92400e', soft:'#fde68a', line:'#fcd34d', text:'#3d2a08', muted:'#78550e', inputBg:'#ffffff', inputText:'#111827', tableBg:'#ffffff', shadow:'0 10px 24px rgba(146,64,14,.12)' },
};

export const DEFAULT_SETTINGS = {
  theme: 'pink',
  fontPx: 16,
  density: 'normal',
  motion: 'normal',
  currency: 'EUR',
  autoBackupEnabled: false,
  autoBackupEveryMin: '30',
  colFavFilter: 'all',
};

export const DECK_TYPE_ORDER = [
  'Criatura','Planeswalker','Instantáneo','Conjuro',
  'Artefacto','Encantamiento','Tierra','Batalla','Otro'
];

export const PASTEL = { W:'#FFF4C9', U:'#DDEBFF', B:'#E6E8EE', R:'#FFE1E6', G:'#DFF7E3', C:'#FFFFFF' };