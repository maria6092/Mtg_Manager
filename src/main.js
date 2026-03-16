/**
 * main.js
 * Punto de entrada de la app.
 * Orquesta autenticación, estado y módulos de UI.
 */

// ─── Firebase (efecto de importación — inicializa la app) ─────────────────────
import "./services/firebase.js";

// ─── Estado ───────────────────────────────────────────────────────────────────
import {
  setCards, setDecks, setWishlist,
  setProfile, setSettings, setSortState,
} from "./state/store.js";

// ─── Lógica ───────────────────────────────────────────────────────────────────
import { onAuthStateChange }                          from "./modules/auth/auth.js";
import { initAuthUI, showLoginScreen, showAppScreen,
         syncAuthTopbar }                             from "./modules/auth/auth.ui.js";
import { loadCards }                                  from "./modules/collection/collection.js";
import { loadDecks }                                  from "./modules/decks/decks.js";
import { loadProfile, fsSaveProfile,
         fsLoadSocialData }                           from "./modules/profile/profile.js";
import { loadSettings, loadSortState,
         applySettings, startAutoBackup }             from "./modules/settings/settings.js";
import { userLoad, LS_WISHLIST }                      from "./utils/storage.js";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { initSidebarUI, initTabs,
         showPage, getLastTab }                       from "./modules/sidebar/sidebar.ui.js";

// ─── Arranque ─────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {

  // UI estática que no depende de sesión
  initSidebarUI();

  // Listener de Firebase Auth
  onAuthStateChange(

    // ── onLogin ──────────────────────────────────────────────────────────────
    async (firebaseUser) => {
      // 1. Cargar datos del usuario desde localStorage
      const cards     = loadCards();
      const decks     = loadDecks();
      const wishlist  = userLoad(LS_WISHLIST, [], []);
      const profile   = loadProfile();
      const settings  = loadSettings();
      const sortState = loadSortState();

      setWishlist(wishlist);
      setSortState(sortState);

      // 2. Aplicar ajustes visuales
      applySettings();
      startAutoBackup();

      // 3. Actualizar UI de auth
      syncAuthTopbar(firebaseUser);

      // 4. Generar tabs de navegación (requieren sesión)
      initTabs();

      // 5. Navegar a la última pestaña visitada
      showPage(getLastTab());

      // 6. Mostrar la app
      showAppScreen();

      // 7. Sincronizar con Firestore en segundo plano
      fsSaveProfile().catch(() => {});
      fsLoadSocialData().catch(() => {});
    },

    // ── onLogout ─────────────────────────────────────────────────────────────
    async () => {
      // Limpiar estado
      setCards([]);
      setDecks([]);
      setWishlist([]);
      setProfile({});

      // Actualizar UI
      syncAuthTopbar(null);
      showLoginScreen();

      // Registrar listeners de la pantalla de auth
      initAuthUI({
        onSignOutSuccess: () => {
          setCards([]);
          setDecks([]);
        },
      });
    }
  );
});
