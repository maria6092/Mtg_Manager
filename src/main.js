/**
 * main.js
 * Punto de entrada de la app.
 * Orquesta autenticación, estado y módulos de UI.
 */

// ─── Firebase ─────────────────────────────────────────────────────────────────
import "./services/firebase.js";

// ─── Estado ───────────────────────────────────────────────────────────────────
import {
  setCards, setDecks, setWishlist,
  setProfile, setSettings, setSortState,
} from "./state/store.js";

// ─── Lógica de auth ───────────────────────────────────────────────────────────
import { onAuthStateChange } from "./modules/auth/auth.js";

// ─── UI de auth ───────────────────────────────────────────────────────────────
import {
  showLoginScreen,
  showAppScreen,
  showAuthView,
  syncAuthTopbar,
  initAuthUI,
} from "./modules/auth/auth.ui.js";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
import {
  initSidebarUI,
  initTabs,
  showPage,
  getLastTab,
  closeSidebar,
  toggleSidebar,
} from "./modules/sidebar/sidebar.ui.js";

// ─── Lógica de datos ──────────────────────────────────────────────────────────
import { loadCards }                             from "./modules/collection/collection.js";
import { loadDecks }                             from "./modules/decks/decks.js";
import { loadProfile, fsSaveProfile,
         fsLoadSocialData }                      from "./modules/profile/profile.js";
import { loadSettings, loadSortState,
         applySettings, startAutoBackup }        from "./modules/settings/settings.js";
import { userLoad, LS_WISHLIST }                 from "./utils/storage.js";

// ─── Arranque ─────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {

  // UI estática que no depende de sesión
  initSidebarUI();

  // Exponer funciones al scope global para que el monolito pueda llamarlas
  // mientras se completa la migración de los módulos de UI restantes.
  window.showPage       = showPage;
  window.getLastTab     = getLastTab;
  window.closeSidebar   = closeSidebar;
  window.toggleSidebar  = toggleSidebar;
  window.showLogin      = showLoginScreen;
  window.showApp        = showAppScreen;
  window.showAuthView   = showAuthView;

  // Listener de Firebase Auth
  onAuthStateChange(

    // ── onLogin ────────────────────────────────────────────────────────────
    async (firebaseUser) => {
      // Cargar datos del usuario
      loadCards();
      loadDecks();
      const wishlist  = userLoad(LS_WISHLIST, [], []);
      loadProfile();
      loadSettings();
      const sortState = loadSortState();

      setWishlist(wishlist);
      setSortState(sortState);

      applySettings();
      startAutoBackup();

      // Actualizar UI de auth
      syncAuthTopbar(firebaseUser);

      // Generar tabs (requieren sesión)
      initTabs();

      // Mostrar app — el monolito sigue renderizando el contenido
      showAppScreen();
    },

    // ── onLogout ───────────────────────────────────────────────────────────
    async () => {
      setCards([]);
      setDecks([]);
      setWishlist([]);
      setProfile({});

      syncAuthTopbar(null);
      showLoginScreen();

      initAuthUI({
        onSignOutSuccess: () => {
          setCards([]);
          setDecks([]);
        },
      });
    }
  );
});
