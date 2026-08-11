const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore'); 
const authV1 = require('firebase-functions/v1');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

// ── Config general ──
const APP_NAME    = 'MTG Manager';
const FROM_EMAIL  = 'MTG Manager <onboarding@resend.dev>';
const CONTINUE_URL = 'https://maria6092.github.io/Mtg_Manager/'; 

// ── Plantilla HTML compartida · Tema MTG Manager ──
function baseTemplate({ title, message, buttonText, link, footer }) {
  return `
  <div style="
    margin:0;
    padding:40px 16px;
    background:
      radial-gradient(ellipse 80% 50% at 20% 10%,rgba(93,40,140,.35) 0%,transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 80%,rgba(45,24,84,.55) 0%,transparent 55%),
      #120a22;
    font-family:'Raleway','Segoe UI',Arial,sans-serif;
  ">

    <!-- Estrellas -->
    <div style="
      max-width:520px;
      margin:0 auto;
      position:relative;
    ">

      <!-- Tarjeta principal -->
      <div style="
        position:relative;
        background:rgba(33,20,61,.96);
        border:1px solid rgba(201,150,58,.30);
        border-radius:16px;
        padding:36px 32px;
        color:#e8d5b0;
        box-shadow:
          0 40px 80px rgba(0,0,0,.60),
          0 0 40px rgba(201,150,58,.08);
        overflow:hidden;
      ">

        <!-- Borde interior decorativo -->
        <div style="
          position:absolute;
          inset:10px;
          border:1px solid rgba(201,150,58,.12);
          border-radius:10px;
          pointer-events:none;
        "></div>

        <!-- Decoración superior -->
        <div style="
          position:absolute;
          top:14px;
          left:18px;
          color:rgba(201,150,58,.35);
          font-size:11px;
        ">✦</div>

        <div style="
          position:absolute;
          top:14px;
          right:18px;
          color:rgba(201,150,58,.35);
          font-size:11px;
        ">✦</div>

        <!-- Marca -->
        <div style="
          position:relative;
          text-align:center;
          margin-bottom:28px;
        ">

          <div style="
            width:58px;
            height:58px;
            margin:0 auto 14px;
            border-radius:50%;
            border:2px solid rgba(201,150,58,.40);
            background:linear-gradient(
              135deg,
              rgba(61,32,96,.9),
              rgba(26,15,46,.95)
            );
            box-shadow:0 0 28px rgba(201,150,58,.25);
            display:flex;
            align-items:center;
            justify-content:center;
            color:#e8b84b;
            font-size:25px;
          ">✦</div>

          <div style="
            color:#e8b84b;
            font-family:'Cinzel Decorative','Cinzel',Georgia,serif;
            font-size:21px;
            font-weight:700;
            letter-spacing:.06em;
            line-height:1.2;
          ">
            ✦ MTG Manager ✦
          </div>

          <div style="
            margin-top:7px;
            color:#9e86c2;
            font-family:'Raleway','Segoe UI',Arial,sans-serif;
            font-size:12px;
            font-style:italic;
            letter-spacing:.02em;
          ">
            Tu colección, sin complicaciones
          </div>
        </div>

        <!-- Separador -->
        <div style="
          position:relative;
          height:1px;
          background:rgba(201,150,58,.20);
          margin:0 0 24px;
        ">
          <span style="
            position:absolute;
            left:50%;
            top:50%;
            transform:translate(-50%,-50%);
            padding:0 10px;
            background:#21143d;
            color:rgba(201,150,58,.45);
            font-size:9px;
          ">◆</span>
        </div>

        <!-- Título -->
        <h1 style="
          position:relative;
          margin:0 0 14px;
          text-align:center;
          color:#e8b84b;
          font-family:'Cinzel','Georgia',serif;
          font-size:19px;
          font-weight:700;
          letter-spacing:.06em;
          text-transform:uppercase;
        ">
          ${title}
        </h1>

        <!-- Mensaje -->
        <p style="
          position:relative;
          margin:0 auto 26px;
          max-width:420px;
          text-align:center;
          color:#e8d5b0;
          font-family:'Raleway','Segoe UI',Arial,sans-serif;
          font-size:14px;
          line-height:1.7;
        ">
          ${message}
        </p>

        <!-- Botón -->
        <div style="
          position:relative;
          text-align:center;
          margin-bottom:26px;
        ">
          <a
            href="${link}"
            style="
              display:inline-block;
              padding:13px 30px;
              background:linear-gradient(
                135deg,
                #c9963a,
                #8b5e1a
              );
              border:1px solid rgba(232,184,75,.45);
              color:#1a0f2e;
              border-radius:6px;
              text-decoration:none;
              font-family:'Cinzel','Georgia',serif;
              font-size:13px;
              font-weight:700;
              letter-spacing:.07em;
              text-transform:uppercase;
              box-shadow:0 0 18px rgba(201,150,58,.18);
            "
          >
            ✦ ${buttonText} ✦
          </a>
        </div>

        <!-- Footer interno -->
        <div style="
          position:relative;
          padding-top:18px;
          border-top:1px solid rgba(201,150,58,.12);
        ">
          <p style="
            margin:0;
            text-align:center;
            color:#9e86c2;
            font-family:'Raleway','Segoe UI',Arial,sans-serif;
            font-size:11px;
            line-height:1.6;
            font-style:italic;
          ">
            ${footer}
          </p>
        </div>

        <!-- Decoración inferior -->
        <div style="
          position:absolute;
          bottom:14px;
          left:18px;
          color:rgba(201,150,58,.30);
          font-size:10px;
        ">✦</div>

        <div style="
          position:absolute;
          bottom:14px;
          right:18px;
          color:rgba(201,150,58,.30);
          font-size:10px;
        ">✦</div>

      </div>

      <!-- Copyright -->
      <p style="
        margin:16px 0 0;
        text-align:center;
        color:#5a4d70;
        font-family:'Raleway','Segoe UI',Arial,sans-serif;
        font-size:11px;
      ">
        ✦ © ${new Date().getFullYear()} MTG Manager ✦
      </p>

    </div>
  </div>`;
}

function verifyEmailHtml(link) {
  return baseTemplate({
    title: '¡Bienvenido a tu colección!',
    message: 'Confirma tu email para activar tu cuenta y empezar a gestionar tus cartas, mazos y deseos.',
    buttonText: 'Verificar mi cuenta',
    link,
    footer: 'Si no creaste esta cuenta, puedes ignorar este correo con total tranquilidad.',
  });
}

function resetPasswordHtml(link) {
  return baseTemplate({
    title: 'Restablece tu contraseña',
    message: 'Hemos recibido una solicitud para cambiar tu contraseña. Si fuiste tú, pulsa el botón de abajo.',
    buttonText: 'Restablecer contraseña',
    link,
    footer: 'Si no solicitaste este cambio, ignora este correo — tu contraseña actual seguirá funcionando.',
  });
}

async function sendMail(resendKey, { to, subject, html }) {
  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  if (error) throw new Error(error.message || 'Error enviando el email.');
}

// ── 1. Se dispara SOLO al crear un usuario nuevo (registro) ──
exports.onUserCreated = authV1
  .runWith({ secrets: [RESEND_API_KEY] })
  .auth.user()
  .onCreate(async (user) => {
    if (!user.email) return;
    try {
      const link = await admin.auth().generateEmailVerificationLink(user.email, {
        url: CONTINUE_URL,
      });
      await sendMail(RESEND_API_KEY.value(), {
        to: user.email,
        subject: `✦ Verifica tu cuenta en ${APP_NAME}`,
        html: verifyEmailHtml(link),
      });
    } catch (err) {
      console.error('onUserCreated / envío verificación:', err);
    }
  });

// ── 2. Callable: reenviar verificación (botón "Reenviar email de verificación") ──
exports.resendVerificationEmail = onCall({ secrets: [RESEND_API_KEY] }, async (req) => {
  const email = String(req.data?.email || '').trim();
  if (!email) throw new HttpsError('invalid-argument', 'Falta el email.');

  try {
    const link = await admin.auth().generateEmailVerificationLink(email, { url: CONTINUE_URL });
    await sendMail(RESEND_API_KEY.value(), {
      to: email,
      subject: `✦ Verifica tu cuenta en ${APP_NAME}`,
      html: verifyEmailHtml(link),
    });
    return { ok: true };
  } catch (err) {
    console.error('resendVerificationEmail:', err);
    throw new HttpsError('internal', 'No se pudo reenviar el email de verificación.');
  }
});

// ── 3. Callable: enviar email de restablecer contraseña ──
exports.sendPasswordResetEmail = onCall({ secrets: [RESEND_API_KEY] }, async (req) => {
  const email = String(req.data?.email || '').trim();
  if (!email) throw new HttpsError('invalid-argument', 'Falta el email.');

  try {
    const link = await admin.auth().generatePasswordResetLink(email, { url: CONTINUE_URL });
    await sendMail(RESEND_API_KEY.value(), {
      to: email,
      subject: `✦ Restablece tu contraseña — ${APP_NAME}`,
      html: resetPasswordHtml(link),
    });
    return { ok: true };
  } catch (err) {
    // No revelamos si el email existe o no, por seguridad
    console.error('sendPasswordResetEmail:', err);
    return { ok: true };
  }
});
