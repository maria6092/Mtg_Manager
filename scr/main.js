/**
 * main.js
 * Punto de entrada de la app.
 *
 * Responsabilidades:
 * 1. Inicializar la UI estática (una sola vez al cargar el DOM)
 * 2. Escuchar cambios de sesión de Firebase
 * 3. Cargar el estado del usuario al hacer login
 * 4. Renderizar la app
 *
 * NO contiene lógica de negocio — delega en los módulos.
 */

// ─── Servicios ────────────────────────────────────────────────────────────────
import "./services/firebase.js"; // inicializa Firebase (efecto de importación)

// ─── Estado ───────────────────────────────────────────────────────────────────
import { setCards, setDecks, setWishlist, setProfile, setSettings, setSortState } from "./state/store.js";

// ─── Módulos de lógica ────────────────────────────────────────────────────────
import { onAuthStateChange } from "./modules/auth/auth.js";
import { initAuthUI, showLoginScreen, showAppScreen, syncAuthTopbar } from "./modules/auth/auth.ui.js";
import { loadCards }         from "./modules/collection/collection.js";
import { loadDecks }         from "./modules/decks/decks.js";
import { loadProfile, fsSaveProfile, fsLoadSocialData } from "./modules/profile/profile.js";
import { loadSettings, loadSortState, applySettings, startAutoBackup } from "./modules/settings/settings.js";
import { userLoad, LS_WISHLIST, getLastTab } from "./utils/storage.js";

// ─── TODO: importar módulos de UI cuando se extraigan ─────────────────────────
// import { initCollectionUI, renderCardsTableFull } from "./modules/collection/collection.ui.js";
// import { initDecksUI, renderDecks }               from "./modules/decks/decks.ui.js";
// import { renderUserProfilePage }                  from "./modules/profile/profile.ui.js";
// import { initSettingsUI }                         from "./modules/settings/settings.ui.js";
// import { initSidebarUI, showPage }                from "./ui/sidebar.js";

// ─── Inicialización al cargar el DOM ─────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {

  // 1. Inicializar UI estática (no depende de sesión)
  // initAppUI(); ← cuando esté extraída

  // 2. Registrar el listener de autenticación
  onAuthStateChange(
    // ── onLogin ──────────────────────────────────────────────────────────────
    async (firebaseUser) => {
      // Cargar estado del usuario desde localStorage
      const cards    = loadCards();
      const decks    = loadDecks();
      const wishlist = userLoad(LS_WISHLIST, [], []);
      const profile  = loadProfile();
      const settings = loadSettings();
      const sortState= loadSortState();

      setWishlist(wishlist);
      setSortState(sortState);

      applySettings();
      startAutoBackup();

      syncAuthTopbar(firebaseUser);

      // Renderizar con datos locales (respuesta inmediata)
      // showPage(getLastTab());
      // renderCardsTableFull();
      // renderDecks();
      // updateInvestmentUI();
      // renderSalesTable();

      showAppScreen();

      // Sincronizar con Firestore en segundo plano
      fsSaveProfile().catch(() => {});
      fsLoadSocialData().catch(() => {});
      // fsSyncAllSaleCards().catch(() => {}); ← en collection.js
    },

    // ── onLogout ─────────────────────────────────────────────────────────────
    async () => {
      // Limpiar estado
      setCards([]);
      setDecks([]);
      setWishlist([]);
      setProfile({});

      syncAuthTopbar(null);
      showLoginScreen();

      // Inicializar UI de auth
      initAuthUI({
        onSignOutSuccess: () => {
          setCards([]);
          setDecks([]);
        },
      });
    }
  );
});
