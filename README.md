# MTG Manager — Fase 0: Refactor

## Estructura de carpetas

```
src/
├── main.js                        ← Punto de entrada único
├── services/
│   └── firebase.js                ← Config e instancias de Firebase
├── state/
│   └── store.js                   ← Estado global centralizado
├── utils/
│   ├── storage.js                 ← Helpers de localStorage (claves, load/save)
│   └── helpers.js                 ← Funciones puras (validadores, formateo, etc.)
└── modules/
    ├── auth/
    │   ├── auth.js                ← Lógica: signIn, signUp, signOut
    │   └── auth.ui.js             ← UI: pantalla login/registro
    ├── collection/
    │   └── collection.js          ← Lógica: cartas, CRUD, sync Firestore
    ├── decks/
    │   └── decks.js               ← Lógica: mazos, CRUD, import/export
    ├── market/
    │   └── market.js              ← Lógica: listings, filtros, sync local
    ├── friends/
    │   └── friends.js             ← Lógica: solicitudes, aceptar, eliminar
    ├── profile/
    │   └── profile.js             ← Lógica: perfil, uploads, Firestore
    └── settings/
        └── settings.js            ← Lógica: configuración, backups, auto-backup
```

---

## Cómo migrar de index.html a esta estructura

### Paso 1 — Sustituir la etiqueta `<script>` en index.html

Reemplaza el bloque `<script>` del final del `index.html` por:

```html
<!-- Firebase SDK (sigue cargándose desde CDN) -->
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js"></script>

<!-- App modular -->
<script type="module" src="src/main.js"></script>
```

> ⚠️ `type="module"` activa los imports de ES Modules. Necesitas servir el proyecto
> desde un servidor local (VS Code Live Server, `npx serve`, etc.) — no abriendo
> el HTML directamente como `file://`.

---

### Paso 2 — Migrar los módulos de UI (pendiente)

Los archivos `.ui.js` todavía no están extraídos. El proceso para cada uno:

1. Crear `src/modules/[modulo]/[modulo].ui.js`
2. Mover todas las funciones `render*` e `init*UI` del `index.html` al archivo
3. Sustituir acceso a variables globales (`cards`, `decks`...) por getters del store:
   ```js
   // ❌ antes
   cards.filter(...)
   // ✅ después
   import { getCards } from "../../state/store.js";
   getCards().filter(...)
   ```
4. Importar desde `main.js` y llamar en el momento correcto

**Orden recomendado para migrar UIs:**
1. `sidebar.ui.js` (navegación — base de todo)
2. `collection.ui.js` (tabla de cartas)
3. `decks.ui.js`
4. `market.ui.js`
5. `profile.ui.js`
6. `friends.ui.js`
7. `settings.ui.js`

---

### Paso 3 — Eliminar las funciones migradas de index.html

Una vez que un módulo funciona correctamente importado:
- Borra las funciones correspondientes del `<script>` de `index.html`
- Verifica que no haya referencias rotas en el HTML (atributos `onclick`, etc.)
- Sustituye `onclick="miFuncion()"` en el HTML por listeners en el `.ui.js`

---

## Reglas del proyecto (no negociables)

| Regla | Detalles |
|-------|----------|
| **El store es la única fuente de verdad** | Nada guarda estado en variables locales de módulo. Siempre `getCards()`, `getDecks()`... |
| **Los servicios no tocan el DOM** | `firebase.js`, `auth.js`, `collection.js`... nunca llaman a `document.*` |
| **Las UIs no llaman a Firebase directamente** | Siempre a través del módulo de lógica correspondiente |
| **Un módulo = una responsabilidad** | `auth.js` solo auth. `collection.js` solo colección. |
| **Sin variables globales nuevas** | Todo pasa por el store o por parámetros |

---

## Variables globales que quedan en index.html (temporalmente)

Mientras se completa la migración, estas variables siguen siendo globales.
Hay que eliminarlas una a una conforme se migran sus módulos:

- `cards` → migrar a `store.js` ✅ (ya en store, pendiente de quitar del HTML)
- `decks` → migrar a `store.js` ✅
- `wishlist` → migrar a `store.js` ✅
- `profile` → migrar a `store.js` ✅
- `settings` → migrar a `store.js` ✅
- `sortState` → migrar a `store.js` ✅
- `_fbUser` → migrar a `store.js` ✅
- `chartRarity`, `chartColors`, etc. → quedan en sus módulos UI

---

## Estado actual de la migración

| Archivo | Estado |
|---------|--------|
| `services/firebase.js` | ✅ Listo |
| `state/store.js` | ✅ Listo |
| `utils/storage.js` | ✅ Listo |
| `utils/helpers.js` | ✅ Listo |
| `modules/auth/auth.js` | ✅ Listo |
| `modules/auth/auth.ui.js` | ✅ Listo |
| `modules/collection/collection.js` | ✅ Listo |
| `modules/decks/decks.js` | ✅ Listo |
| `modules/market/market.js` | ✅ Listo |
| `modules/friends/friends.js` | ✅ Listo |
| `modules/profile/profile.js` | ✅ Listo |
| `modules/settings/settings.js` | ✅ Listo |
| `main.js` | ✅ Listo |
| Módulos UI (`*.ui.js`) | ⏳ Pendiente de extraer del index.html |
