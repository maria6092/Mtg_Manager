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

  /* ── normaliza el username a un id válido y consistente ── */
  function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
  }

  /* ── crear perfil público + reservar username en una transacción ──
     Garantiza unicidad: si el username ya está reservado, falla y no
     se crea nada. Las reglas de Firestore impiden sobrescribir un
     usernames/{name} existente, así que la unicidad es real. */
  async function createProfileAndReserveUsername(user, rawUsername) {
    const uname      = normalizeUsername(rawUsername);
    const usernameRef = fbDb.collection('usernames').doc(uname);
    const userRef     = fbDb.collection('users').doc(user.uid);

    await fbDb.runTransaction(async (tx) => {
      const existing = await tx.get(usernameRef);
      if (existing.exists) {
        throw new Error('Ese nombre de usuario ya está en uso.');
      }
      // Reserva el username
      tx.set(usernameRef, { uid: user.uid });
      // Crea el perfil público
      tx.set(userRef, {
        uid:         user.uid,
        username:    uname,
        displayName: rawUsername.trim(),
        email:       user.email.toLowerCase(),
        avatarUrl:   '',
        bio:         '',
        isPublic:    true,
        createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  /* ── REGISTRO ── */
  async function register({ username, email, password }) {
    if (!username)                  throw new Error('Escribe un nombre de usuario.');
    if (!isValidEmail(email))       throw new Error('El email no es válido.');
    if (!isValidPassword(password)) throw new Error('Contraseña demasiado corta (mínimo 6 caracteres).');

    // 1. Crear el usuario en Auth (a partir de aquí ya hay sesión)
    const cred = await fbAuth.createUserWithEmailAndPassword(email, password);

    try {
      // 2. Nombre visible en Auth
      await cred.user.updateProfile({ displayName: username.trim() });
      // 3. Reservar username + crear perfil (unicidad garantizada por reglas)
      await createProfileAndReserveUsername(cred.user, username);
      // 4. Email de verificación
      await cred.user.sendEmailVerification();
    } catch (err) {
      // Si algo falla DESPUÉS de crear el usuario (p.ej. username pillado),
      // borramos el usuario recién creado para no dejar cuentas a medias.
      try { await cred.user.delete(); } catch (_) {}
      throw err;
    }

    return cred.user;
  }

  /* ── LOGIN ── */
  async function login({ email, password }) {
    if (!isValidEmail(email))  throw new Error('El email no es válido.');
    if (!password)             throw new Error('Escribe tu contraseña.');

    const cred = await fbAuth.signInWithEmailAndPassword(email, password);

    // ⚠️ DESARROLLO: window.DEV_SKIP_EMAIL_VERIFICATION (definida en index.html)
    // permite entrar sin verificar el email. Ponla a false antes de publicar.
    if (!window.DEV_SKIP_EMAIL_VERIFICATION && !cred.user.emailVerified) {
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