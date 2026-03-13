import { FIREBASE_CONFIG } from '../core/constants.js';

export const fb = {
  app: null,
  auth: null,
  db: null,
  fns: null,
  currentUser: null,
  ready: false,
  readyPromise: null
};

window._fbCurrentUser = null;
window._fbDb = null;
window._fbFns = null;
window._fbAuth = null;

export async function initFirebase() {
  if (fb.readyPromise) return fb.readyPromise;

  fb.readyPromise = (async () => {
    try {
      const [{ initializeApp }, authMod, firestoreMod] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
      ]);

      fb.app = initializeApp(FIREBASE_CONFIG);
      fb.auth = authMod.getAuth(fb.app);
      fb.db = firestoreMod.getFirestore(fb.app);
      fb.fns = {
        createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
        signOut: authMod.signOut,
        onAuthStateChanged: authMod.onAuthStateChanged,
        doc: firestoreMod.doc,
        setDoc: firestoreMod.setDoc,
        getDoc: firestoreMod.getDoc
      };

      window._fbDb = fb.db;
      window._fbFns = fb.fns;
      window._fbAuth = fb.auth;
      fb.ready = true;
    } catch (error) {
      console.error('Firebase no se pudo inicializar:', error);
      fb.ready = false;
    }

    return fb;
  })();

  return fb.readyPromise;
}

export async function onFirebaseAuthChange(callback) {
  await initFirebase();
  if (!fb.ready || !fb.fns?.onAuthStateChanged) return () => {};

  return fb.fns.onAuthStateChanged(fb.auth, user => {
    fb.currentUser = user || null;
    window._fbCurrentUser = fb.currentUser;
    callback?.(fb.currentUser);
  });
}
