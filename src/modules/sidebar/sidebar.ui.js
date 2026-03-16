/**
 * sidebar.ui.js
 * Sidebar, navegación entre páginas y sistema de tabs.
 *
 * Exporta:
 *  - initSidebarUI()   → registra listeners del sidebar (llamar UNA vez al cargar)
 *  - initTabs()        → genera los botones de navegación (llamar tras login)
 *  - showPage(id)      → navega a una sección
 *  - getLastTab()      → recupera la última pestaña visitada
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const LAST_TAB_KEY = "mtg_rosita_last_tab_v9";
const OLD_TAB_KEYS = [
  "mtg_rosita_last_tab_v8",
  "mtg_rosita_last_tab_v7",
  "mtg_rosita_last_tab_v6",
  "mtg_rosita_last_tab_v5",
  "mtg_rosita_last_tab_v4",
  "mtg_rosita_last_tab_v3",
];

// Páginas disponibles en el sidebar
const PAGES = [
  { id: "intro",     label: "Introducción" },
  { id: "cartas",    label: "Cartas"       },
  { id: "stats",     label: "Stats"        },
  { id: "buscador",  label: "Buscador"     },
  { id: "coleccion", label: "Colección"    },
  { id: "mazos",     label: "Mazos"        },
  { id: "deseos",    label: "Deseos"       },
  { id: "tienda",    label: "Tienda"       },
  { id: "mis_ventas",label: "Ventas"       },
  { id: "usuario",   label: "Perfil"       },
];

// ─── Navegación ───────────────────────────────────────────────────────────────

/**
 * Muestra la sección con el id dado y oculta el resto.
 * Actualiza el tab activo en la sidebar y persiste la selección.
 * @param {string} id
 */
export function showPage(id) {
  const sections = Array.from(document.querySelectorAll("section[data-page]"));
  const exists   = pid => !!document.querySelector(`section[data-page="${pid}"]`);

  if (!id || !exists(id)) id = "intro";

  for (const s of sections) {
    const isActive = s.dataset.page === id;
    s.classList.toggle("is-hidden", !isActive);
    s.style.display = isActive ? "" : "none";
    if (isActive) void s.offsetWidth; // fuerza reflow para la animación CSS
  }

  // Actualizar botones del sidebar
  document.querySelectorAll("#tabs .tabbtn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === id);
  });

  // Persistir
  try { localStorage.setItem(LAST_TAB_KEY, id); } catch {}
}

/**
 * Devuelve el id de la última pestaña visitada (con migración de claves antiguas).
 * @returns {string}
 */
export function getLastTab() {
  try {
    const raw = localStorage.getItem(LAST_TAB_KEY);
    if (raw) return raw;
  } catch {}
  for (const k of OLD_TAB_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) return raw;
    } catch {}
  }
  return "intro";
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

/**
 * Genera los botones de navegación en #tabs.
 * Llamar después del login (los tabs requieren sesión activa).
 */
export function initTabs() {
  const tabsEl = document.getElementById("tabs");
  if (!tabsEl) return;

  tabsEl.innerHTML = "";

  PAGES.forEach(p => {
    const btn        = document.createElement("button");
    btn.className    = "tabbtn";
    btn.dataset.page = p.id;
    btn.textContent  = p.label;
    tabsEl.appendChild(btn);
  });

  tabsEl.addEventListener("click", e => {
    const btn = e.target.closest(".tabbtn");
    if (!btn) return;
    showPage(btn.dataset.page);
  });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/**
 * Cierra el sidebar.
 * En móvil: elimina la clase sidebar-open.
 * En escritorio: no hace nada (el sidebar se colapsa con toggleSidebar).
 */
export function closeSidebar() {
  const appShell = document.getElementById("appShell");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!appShell) return;

  if (window.innerWidth <= 820) {
    appShell.classList.remove("sidebar-open");
    backdrop?.classList.remove("is-open");
  }
}

/**
 * Alterna el sidebar abierto/cerrado.
 * En móvil: toggle de sidebar-open.
 * En escritorio: toggle de sidebar-collapsed.
 */
export function toggleSidebar() {
  const appShell = document.getElementById("appShell");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!appShell) return;

  if (window.innerWidth <= 820) {
    const willOpen = !appShell.classList.contains("sidebar-open");
    appShell.classList.toggle("sidebar-open", willOpen);
    backdrop?.classList.toggle("is-open", willOpen);
  } else {
    appShell.classList.toggle("sidebar-collapsed");
  }
}

/**
 * Sincroniza el estado del sidebar con el tamaño actual de la ventana.
 * Llamar en resize y al inicializar.
 */
export function syncSidebarMode() {
  const appShell = document.getElementById("appShell");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!appShell) return;

  if (window.innerWidth <= 820) {
    appShell.classList.remove("sidebar-collapsed");
    appShell.classList.remove("sidebar-open");
    backdrop?.classList.remove("is-open");
  } else {
    appShell.classList.add("sidebar-collapsed");
    appShell.classList.remove("sidebar-open");
    backdrop?.classList.remove("is-open");
  }
}

/**
 * Inicializa todos los listeners del sidebar.
 * Llamar UNA vez cuando el DOM esté listo.
 */
export function initSidebarUI() {
  const toggle   = document.getElementById("menuToggle");
  const backdrop = document.getElementById("sidebarBackdrop");

  syncSidebarMode();

  if (toggle)   toggle.addEventListener("click", toggleSidebar);
  if (backdrop) backdrop.addEventListener("click", closeSidebar);

  window.addEventListener("resize", syncSidebarMode);

  // Cerrar sidebar al navegar desde él (en móvil)
  document.querySelectorAll(".sidebar .tabbtn").forEach(btn => {
    btn.addEventListener("click", closeSidebar);
  });
}
