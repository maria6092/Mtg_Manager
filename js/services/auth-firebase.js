/**
 * auth-firebase.js
 * Toda la lógica de autenticación Firebase centralizada.
 * Se expone como window.AuthService para que el monolito lo use.
 */

const AuthService = (() => {

  /* ── helpers de mensaje ── */
  function errMsg(err) {
    const map = {
      'auth/user-not-found':        'No existe una cuenta con ese email.',
      'auth/wrong-password':        'Contraseña incorrecta.',
      'auth/invalid-credential':    'Email o contraseña incorrectos.',
      'auth/email-already-in-use':  'Ya existe una cuenta con ese email.',
      'auth/weak-password':         'Contraseña demasiado débil (mínimo 6 caracteres).',
      'auth/invalid-email':         'El email no es válido.',
      'auth/too-many-requests':     'Demasiados intentos. Espera un momento.',
      'auth/network-request-failed':'Sin conexión. Revisa tu red.',
    };
    return map[err?.code] || err?.message || 'Error desconocido.';
  }

  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
  }

  function isValidPassword(p) {
    return String(p || '').length >= 6;
  }

  /* ── username único en Firestore ── */
  async function isUsernameTaken(username) {
    const snap = await fbDb
      .collection('users')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();
    return !snap.empty;
  }

  /* ── crear perfil público en Firestore ── */
  async function createFirestoreProfile(user, username) {
    await fbDb.collection('users').doc(user.uid).set({
      uid:         user.uid,
      username:    username.toLowerCase(),
      displayName: username,
      email:       user.email.toLowerCase(),
      avatarUrl:   '',
      bio:         '',
      isPublic:    true,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  /* ── REGISTRO ── */
  async function register({ username, email, password }) {
    if (!username)                  throw new Error('Escribe un nombre de usuario.');
    if (!isValidEmail(email))       throw new Error('El email no es válido.');
    if (!isValidPassword(password)) throw new Error('Contraseña demasiado corta (mínimo 6 caracteres).');

    const taken = await isUsernameTaken(username);
    if (taken) throw new Error('Ese nombre de usuario ya está en uso.');

    const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: username });
    await createFirestoreProfile(cred.user, username);
    await cred.user.sendEmailVerification();
    return cred.user;
  }

  /* ── LOGIN ── */
  async function login({ email, password }) {
    if (!isValidEmail(email))  throw new Error('El email no es válido.');
    if (!password)             throw new Error('Escribe tu contraseña.');

    const cred = await fbAuth.signInWithEmailAndPassword(email, password);

    if (!cred.user.emailVerified) {
      await fbAuth.signOut();
      const err = new Error('Debes verificar tu email antes de entrar. Revisa tu bandeja.');
      err.code = 'auth/email-not-verified';
      throw err;
    }

    return cred.user;
  }

  /* ── LOGOUT ── */
  async function logout() {
    await fbAuth.signOut();
  }

  /* ── RECUPERAR CONTRASEÑA ── */
  async function sendPasswordReset(email) {
    if (!isValidEmail(email)) throw new Error('El email no es válido.');
    await fbAuth.sendPasswordResetEmail(email, {
      url: window.location.origin,
      handleCodeInApp: false,
    });
  }

  /* ── REENVIAR VERIFICACIÓN ── */
  async function resendVerification(email, password) {
    if (!isValidEmail(email)) throw new Error('El email no es válido.');
    if (!password)            throw new Error('Escribe tu contraseña para reenviar.');

    const cred = await fbAuth.signInWithEmailAndPassword(email, password);
    if (cred.user.emailVerified) {
      throw new Error('Este email ya está verificado. Puedes iniciar sesión.');
    }
    await cred.user.sendEmailVerification();
    await fbAuth.signOut();
  }

  return { register, login, logout, sendPasswordReset, resendVerification, errMsg, isValidEmail };
})();

window.AuthService = AuthService;