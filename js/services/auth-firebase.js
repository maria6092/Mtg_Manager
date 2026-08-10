/**
 * auth-firebase.js
 * Toda la lógica de autenticación Firebase centralizada.
 * Se expone como window.AuthService para que el monolito lo use.
 */

const AuthService = (() => {

  /* ── HELPERS DE MENSAJE ── */

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
        'No tienes permisos para realizar esta operación.'
    };

    return map[err?.code] || err?.message || 'Error desconocido.';
  }


  /* ── VALIDAR EMAIL ── */

  function isValidEmail(e) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
      String(e || '').trim()
    );

  }


  /* ── VALIDAR PASSWORD ── */

  function isValidPassword(p) {

    return String(p || '').length >= 6;

  }


  /* ── NORMALIZAR USERNAME ── */

  function normalizeUsername(username) {

    return String(username || '')
      .trim()
      .toLowerCase();

  }


  /* ─────────────────────────────────────────────
     CREAR PERFIL + RESERVAR USERNAME
     ───────────────────────────────────────────── */

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


    console.log(
      'Comprobando disponibilidad del username:',
      uname
    );


    await fbDb.runTransaction(async (tx) => {

      /* Comprobar si el username ya existe */

      const existing =
        await tx.get(usernameRef);


      if (existing.exists) {

        throw new Error(
          'Ese nombre de usuario ya está en uso.'
        );

      }


      /* Reservar username */

      tx.set(usernameRef, {

        uid: user.uid

      });


      /* Crear perfil */

      tx.set(userRef, {

        uid: user.uid,

        username: uname,

        displayName:
          rawUsername.trim(),

        email:
          user.email
            ? user.email.toLowerCase()
            : '',

        avatarUrl: '',

        bio: '',

        isPublic: true,

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });

    });


    console.log(
      'Perfil y username creados correctamente.'
    );

  }


  /* ─────────────────────────────────────────────
     REGISTRO
     ───────────────────────────────────────────── */

  async function register({
    username,
    email,
    password
  }) {

    /* Validaciones */

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


    console.log(
      'Creando usuario en Firebase Authentication...'
    );


    /* Crear usuario en Firebase Authentication */

    const cred =
      await fbAuth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );


    console.log(
      'Usuario creado:',
      cred.user.uid
    );


    try {

      /* ── Actualizar token ── */

      await cred.user.getIdToken(true);


      console.log(
        'Token de Firebase actualizado.'
      );


      /* ── Comprobar sesión ── */

      if (
        !fbAuth.currentUser ||
        fbAuth.currentUser.uid !== cred.user.uid
      ) {

        throw new Error(
          'No se pudo establecer la sesión de Firebase.'
        );

      }


      /* ── Guardar nombre visible ── */

      await cred.user.updateProfile({

        displayName:
          username.trim()

      });


      console.log(
        'Nombre de usuario guardado en Authentication.'
      );


      /* ── Crear perfil y reservar username ── */

      await createProfileAndReserveUsername(
        cred.user,
        username
      );


      /* ── ENVIAR CORREO DE VERIFICACIÓN ── */

      console.log(
        'Enviando correo de verificación a:',
        cred.user.email
      );


      await cred.user.sendEmailVerification();


      console.log(
        'Correo de verificación aceptado por Firebase.'
      );


      /* ── Registro terminado ── */

      return cred.user;


    } catch (err) {

      /*
       * IMPORTANTE:
       *
       * NO eliminamos aquí la cuenta de Firebase.
       *
       * Si algo falla queremos conservar el usuario
       * en Authentication para poder detectar el problema.
       */

      console.error(
        'ERROR DURANTE EL REGISTRO:',
        err
      );


      console.error(
        'Código del error:',
        err?.code
      );


      console.error(
        'Mensaje del error:',
        err?.message
      );


      throw err;

    }

  }


  /* ─────────────────────────────────────────────
     LOGIN
     ───────────────────────────────────────────── */

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


    console.log(
      'Intentando iniciar sesión con:',
      email.trim()
    );


    const cred =
      await fbAuth.signInWithEmailAndPassword(
        email.trim(),
        password
      );


    console.log(
      'Login correcto:',
      cred.user.uid
    );


    /*
     * Comprobar verificación del email.
     *
     * Si DEV_SKIP_EMAIL_VERIFICATION es true,
     * permite entrar aunque el email no esté verificado.
     */

    if (
      !window.DEV_SKIP_EMAIL_VERIFICATION &&
      !cred.user.emailVerified
    ) {

      await fbAuth.signOut();


      const err =
        new Error(
          'Debes verificar tu email antes de entrar. Revisa tu bandeja.'
        );


      err.code =
        'auth/email-not-verified';


      throw err;

    }


    return cred.user;

  }


  /* ─────────────────────────────────────────────
     LOGOUT
     ───────────────────────────────────────────── */

  async function logout() {

    await fbAuth.signOut();

  }


  /* ─────────────────────────────────────────────
     RECUPERAR CONTRASEÑA
     ───────────────────────────────────────────── */

  async function sendPasswordReset(email) {

    if (!isValidEmail(email)) {

      throw new Error(
        'El email no es válido.'
      );

    }


    console.log(
      'Solicitando recuperación de contraseña para:',
      email
    );


    const fn =
      fbFunctions.httpsCallable(
        'sendPasswordResetEmail'
      );


    await fn({

      email

    });


    console.log(
      'Solicitud de recuperación enviada.'
    );

  }


  /* ─────────────────────────────────────────────
     REENVIAR VERIFICACIÓN
     ───────────────────────────────────────────── */

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


    console.log(
      'Iniciando sesión para reenviar verificación...'
    );


    const cred =
      await fbAuth.signInWithEmailAndPassword(
        email.trim(),
        password
      );


    /* Si ya está verificado */

    if (cred.user.emailVerified) {

      await fbAuth.signOut();


      throw new Error(
        'Este email ya está verificado. Puedes iniciar sesión.'
      );

    }


    console.log(
      'Reenviando correo de verificación a:',
      cred.user.email
    );


    /*
     * Envío directo mediante Firebase Authentication.
     */

    await cred.user.sendEmailVerification();


    console.log(
      'Correo de verificación reenviado correctamente.'
    );


    /* Cerrar sesión */

    await fbAuth.signOut();

  }


  /* ─────────────────────────────────────────────
     API PÚBLICA
     ───────────────────────────────────────────── */

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


/* ─────────────────────────────────────────────
   EXPONER GLOBALMENTE
   ───────────────────────────────────────────── */

window.AuthService = AuthService;