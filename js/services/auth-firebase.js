/**
 * auth-firebase.js
 * Toda la lógica de autenticación Firebase centralizada.
 * Se expone como window.AuthService para que el monolito lo use.
 */

const AuthService = (() => {

  /* ── helpers de mensaje ── */
  function errMsg(err) {
    const map = {
      'auth/user-not-found':         'No existe una cuenta con ese email.',
      'auth/wrong-password':         'Contraseña incorrecta.',
      'auth/invalid-credential':     'Email o contraseña incorrectos.',
      'auth/email-already-in-use':   'Ya existe una cuenta con ese email.',
      'auth/weak-password':          'Contraseña demasiado débil (mínimo 6 caracteres).',
      'auth/invalid-email':          'El email no es válido.',
      'auth/too-many-requests':      'Demasiados intentos. Espera un momento.',
      'auth/network-request-failed': 'Sin conexión. Revisa tu red.',
      'auth/email-not-verified':     'Debes verificar tu email antes de entrar. Revisa tu bandeja.',
      'auth/permission-denied':      'No tienes permisos para realizar esta operación.',
    };

    return map[err?.code] || err?.message || 'Error desconocido.';
  }


  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
      String(e || '').trim()
    );
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
     se crea nada.
  */
  async function createProfileAndReserveUsername(user, rawUsername) {

    const uname = normalizeUsername(rawUsername);

    if (!uname) {
      throw new Error('El nombre de usuario no es válido.');
    }

    const usernameRef = fbDb
      .collection('usernames')
      .doc(uname);

    const userRef = fbDb
      .collection('users')
      .doc(user.uid);


    await fbDb.runTransaction(async (tx) => {

      // Comprobar si el username ya existe
      const existing = await tx.get(usernameRef);

      if (existing.exists) {
        throw new Error('Ese nombre de usuario ya está en uso.');
      }


      // Reservar el username
      tx.set(usernameRef, {
        uid: user.uid
      });


      // Crear el perfil público
      tx.set(userRef, {
        uid: user.uid,
        username: uname,
        displayName: rawUsername.trim(),
        email: user.email
          ? user.email.toLowerCase()
          : '',
        avatarUrl: '',
        bio: '',
        isPublic: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    });
  }


  /* ── REGISTRO ── */
  async function register({ username, email, password }) {

    if (!username) {
      throw new Error('Escribe un nombre de usuario.');
    }

    if (!isValidEmail(email)) {
      throw new Error('El email no es válido.');
    }

    if (!isValidPassword(password)) {
      throw new Error(
        'Contraseña demasiado corta (mínimo 6 caracteres).'
      );
    }


    // 1. Crear el usuario en Firebase Authentication.
    // Desde este momento debería existir request.auth en Firestore.
    const cred = await fbAuth.createUserWithEmailAndPassword(
      email.trim(),
      password
    );


    try {

      // 2. Asegurar que tenemos un token actualizado.
      // Esto ayuda a evitar problemas de sincronización Auth -> Firestore.
      await cred.user.getIdToken(true);


      // 3. Comprobar que el usuario creado es el usuario actualmente autenticado.
      if (
        !fbAuth.currentUser ||
        fbAuth.currentUser.uid !== cred.user.uid
      ) {
        throw new Error(
          'No se pudo establecer la sesión de Firebase.'
        );
      }


      // 4. Guardar el nombre visible en Firebase Authentication.
      await cred.user.updateProfile({
        displayName: username.trim()
      });


      // 5. Reservar username y crear perfil en Firestore.
     await createProfileAndReserveUsername(
        cred.user,
        username
      );

            // Crear perfil y reservar username
      await createProfileAndReserveUsername(
        cred.user,
        username
      );

      // Enviar correo de verificación directamente con Firebase
      await cred.user.sendEmailVerification();

      console.log(
        'VERIFICACIÓN: correo solicitado para',
        cred.user.email
      );

      return cred.user;
    } catch (err) {

      /*
       * IMPORTANTE:
       * Si Firebase Auth creó la cuenta pero Firestore falló,
       * eliminamos la cuenta Auth para no dejar un usuario
       * creado a medias.
       */
      try {
        await cred.user.delete();
      } catch (deleteErr) {
        console.error(
          'No se pudo eliminar la cuenta Auth después del error:',
          deleteErr
        );
      }

      throw err;
    }
  }


  /* ── LOGIN ── */
  async function login({ email, password }) {

    if (!isValidEmail(email)) {
      throw new Error('El email no es válido.');
    }

    if (!password) {
      throw new Error('Escribe tu contraseña.');
    }


    const cred = await fbAuth.signInWithEmailAndPassword(
      email.trim(),
      password
    );


    /*
     * DESARROLLO:
     * window.DEV_SKIP_EMAIL_VERIFICATION permite entrar
     * sin verificar el email.
     *
     * Pon esta variable a false antes de publicar.
     */
    if (
      !window.DEV_SKIP_EMAIL_VERIFICATION &&
      !cred.user.emailVerified
    ) {

      await fbAuth.signOut();

      const err = new Error(
        'Debes verificar tu email antes de entrar. Revisa tu bandeja.'
      );

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

    if (!isValidEmail(email)) {
      throw new Error('El email no es válido.');
    }

    const fn = fbFunctions.httpsCallable(
      'sendPasswordResetEmail'
    );

    await fn({
      email
    });
  }


  /* ── REENVIAR VERIFICACIÓN ── */
  async function resendVerification(email, password) {

    if (!isValidEmail(email)) {
      throw new Error('El email no es válido.');
    }

    if (!password) {
      throw new Error(
        'Escribe tu contraseña para reenviar.'
      );
    }


    const cred = await fbAuth.signInWithEmailAndPassword(
      email.trim(),
      password
    );


    if (cred.user.emailVerified) {

      await fbAuth.signOut();

      throw new Error(
        'Este email ya está verificado. Puedes iniciar sesión.'
      );
    }


    const fn = fbFunctions.httpsCallable(
      'resendVerificationEmail'
    );

    await fn({
      email
    });


    await fbAuth.signOut();
  }


  /* ── API pública ── */
  return {
    register,
    login,
    logout,
    sendPasswordReset,
    resendVerification,
    errMsg,
    isValidEmail
  };

})();


/*
 * Exponer el servicio globalmente para auth-ui.js
 */
window.AuthService = AuthService;