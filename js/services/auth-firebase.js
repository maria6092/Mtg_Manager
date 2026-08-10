
/**
 * auth-firebase.js
 * Toda la lógica de autenticación Firebase centralizada.
 * Se expone como window.AuthService para que el monolito lo use.
 */

const AuthService = (() => {

  /* ── helpers de mensaje ── */

  function errMsg(err) {
    const map = {
      'auth/user-not-found':
        'No existe una cuenta con ese email.',

      'auth/wrong-password':
        'Contraseña incorrecta.',

      'auth/invalid-credential':
        'Email o contraseña incorrectos.',

      'auth/email-already-in-use':
        'Ya existe una cuenta con ese email.',

      'auth/weak-password':
        'Contraseña demasiado débil (mínimo 6 caracteres).',

      'auth/invalid-email':
        'El email no es válido.',

      'auth/too-many-requests':
        'Demasiados intentos. Espera un momento.',

      'auth/network-request-failed':
        'Sin conexión. Revisa tu red.',

      'auth/email-not-verified':
        'Debes verificar tu email antes de entrar. Revisa tu bandeja.',

      'auth/permission-denied':
        'No tienes permisos para realizar esta operación.',
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


  /* ── normaliza username ── */

  function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
  }


  /* ── crear perfil + reservar username ── */

  async function createProfileAndReserveUsername(
    user,
    rawUsername
  ) {

    const uname = normalizeUsername(rawUsername);

    if (!uname) {
      throw new Error(
        'El nombre de usuario no es válido.'
      );
    }

    const usernameRef = fbDb
      .collection('usernames')
      .doc(uname);

    const userRef = fbDb
      .collection('users')
      .doc(user.uid);


    await fbDb.runTransaction(async (tx) => {

      const existing = await tx.get(usernameRef);

      if (existing.exists) {
        throw new Error(
          'Ese nombre de usuario ya está en uso.'
        );
      }


      tx.set(usernameRef, {
        uid: user.uid
      });


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

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp(),

      });

    });
  }


  /* ── REGISTRO ── */

  async function register({
    username,
    email,
    password
  }) {

    if (!username) {
      throw new Error(
        'Escribe un nombre de usuario.'
      );
    }

    if (!isValidEmail(email)) {
      throw new Error(
        'El email no es válido.'
      );
    }

    if (!isValidPassword(password)) {
      throw new Error(
        'Contraseña demasiado corta (mínimo 6 caracteres).'
      );
    }


    // 1. Crear usuario en Firebase Authentication.

    const cred =
      await fbAuth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );


    try {

      // 2. Obtener token actualizado.

      await cred.user.getIdToken(true);


      // 3. Comprobar sesión.

      if (
        !fbAuth.currentUser ||
        fbAuth.currentUser.uid !== cred.user.uid
      ) {

        throw new Error(
          'No se pudo establecer la sesión de Firebase.'
        );

      }


      // 4. Guardar nombre visible.

      await cred.user.updateProfile({
        displayName: username.trim()
      });


      // 5. Crear perfil y reservar username.

      await createProfileAndReserveUsername(
        cred.user,
        username
      );


      // 6. ENVIAR VERIFICACIÓN DIRECTAMENTE CON FIREBASE.
      //
      // NO usamos ActionCodeSettings aquí.
      // Firebase utilizará su propio manejador de
      // verificación de correo.

      console.log(
        'Enviando verificación a:',
        cred.user.email
      );

      await cred.user.sendEmailVerification();

      console.log(
        'Correo de verificación aceptado por Firebase.'
      );


      // 7. Registro terminado.

      return cred.user;


    } catch (err) {

      /*
       * Si algo falla después de crear Auth,
       * intentamos eliminar la cuenta para no
       * dejar un usuario incompleto.
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

  async function login({
    email,
    password
  }) {

    if (!isValidEmail(email)) {
      throw new Error(
        'El email no es válido.'
      );
    }

    if (!password) {
      throw new Error(
        'Escribe tu contraseña.'
      );
    }


    const cred =
      await fbAuth.signInWithEmailAndPassword(
        email.trim(),
        password
      );


    /*
     * DESARROLLO:
     * permite entrar sin verificar.
     */

    if (
      !window.DEV_SKIP_EMAIL_VERIFICATION &&
      !cred.user.emailVerified
    ) {

      await fbAuth.signOut();

      const err = new Error(
        'Debes verificar tu email antes de entrar. Revisa tu bandeja.'
      );

      err.code =
        'auth/email-not-verified';

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
      throw new Error(
        'El email no es válido.'
      );
    }


    const fn =
      fbFunctions.httpsCallable(
        'sendPasswordResetEmail'
      );


    await fn({
      email
    });
  }


  /* ── REENVIAR VERIFICACIÓN ── */

  async function resendVerification(
    email,
    password
  ) {

    if (!isValidEmail(email)) {
      throw new Error(
        'El email no es válido.'
      );
    }

    if (!password) {
      throw new Error(
        'Escribe tu contraseña para reenviar.'
      );
    }


    const cred =
      await fbAuth.signInWithEmailAndPassword(
        email.trim(),
        password
      );


    if (cred.user.emailVerified) {

      await fbAuth.signOut();

      throw new Error(
        'Este email ya está verificado. Puedes iniciar sesión.'
      );
    }


    /*
     * Para el reenvío usamos directamente Firebase,
     * igual que en el registro.
     *
     * Esto evita depender de Resend para la
     * verificación estándar.
     */

    await cred.user.sendEmailVerification();


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
 * Exponer globalmente para auth-ui.js
 */

window.AuthService = AuthService;
