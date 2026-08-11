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

// ── Plantilla HTML compartida (tema cósmico/dorado, igual que la app) ──
function baseTemplate({ title, message, buttonText, link, footer }) {
  const year = new Date().getFullYear();
  return `
  <div style="margin:0;padding:0;background-color:#0f0817;">
    <div style="
      background:
        radial-gradient(ellipse 70% 50% at 15% 0%, rgba(93,40,140,.35) 0%, transparent 60%),
        radial-gradient(ellipse 60% 45% at 85% 100%, rgba(45,24,84,.45) 0%, transparent 55%),
        #0f0817;
      padding:48px 16px;
      font-family:Georgia,'Cinzel Decorative',serif;
    ">
      <div style="max-width:460px;margin:0 auto;">

        <!-- Marca -->
        <div style="text-align:center;margin-bottom:22px;">
          <div style="
            display:inline-block;width:56px;height:56px;border-radius:14px;
            background:linear-gradient(135deg,#3d2060,#21143d);
            border:1px solid rgba(201,150,58,.4);
            line-height:56px;font-size:24px;color:#e8b84b;
          ">✦</div>
          <div style="margin-top:10px;font-size:21px;font-weight:700;color:#e8b84b;letter-spacing:.08em;text-transform:uppercase;font-family:Georgia,'Cinzel Decorative',serif;">
            ${APP_NAME}
          </div>
          <div style="margin-top:3px;font-size:11px;color:#9e86c2;font-style:italic;letter-spacing:.03em;font-family:Verdana,Arial,sans-serif;">
            Tu colección, sin complicaciones
          </div>
        </div>

        <!-- Tarjeta -->
        <div style="
          background:linear-gradient(180deg, rgba(45,24,84,.55) 0%, rgba(26,15,46,.96) 100%);
          border:1px solid rgba(201,150,58,.28);
          border-radius:18px;
          padding:36px 30px;
          box-shadow:0 20px 50px rgba(0,0,0,.5);
        ">
          <div style="text-align:center;font-size:10px;letter-spacing:.35em;color:rgba(201,150,58,.5);margin-bottom:16px;">
            ✦ ✦ ✦
          </div>

          <h1 style="
            margin:0 0 14px;font-size:19px;color:#e8b84b;text-align:center;
            font-family:Georgia,'Cinzel Decorative',serif;letter-spacing:.03em;font-weight:700;
          ">${title}</h1>

          <p style="
            margin:0 0 28px;font-size:14px;line-height:1.7;color:#e8d5b0;text-align:center;
            font-family:Verdana,Arial,sans-serif;
          ">${message}</p>

          <div style="text-align:center;">
            <a href="${link}" style="
              display:inline-block;padding:14px 32px;
              background:linear-gradient(135deg,#c9963a,#8b5e1a);
              color:#1a0f2e;border-radius:8px;text-decoration:none;
              font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;
              font-family:Georgia,'Cinzel Decorative',serif;
              box-shadow:0 8px 22px rgba(201,150,58,.28);
            ">${buttonText}</a>
          </div>

          <p style="
            margin:22px 0 0;font-size:11px;color:#7a6a95;text-align:center;line-height:1.5;
            font-family:Verdana,Arial,sans-serif;word-break:break-all;
          ">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${link}" style="color:#c9a24e;text-decoration:underline;">${link}</a>
          </p>

          <div style="text-align:center;font-size:10px;letter-spacing:.35em;color:rgba(201,150,58,.35);margin-top:22px;">
            ✦ ✦ ✦
          </div>
        </div>

        <p style="
          font-size:11px;color:#9e86c2;text-align:center;line-height:1.6;margin:22px 0 0;
          font-style:italic;font-family:Verdana,Arial,sans-serif;
        ">${footer}</p>

        <p style="
          text-align:center;font-size:10px;color:#5a4d70;margin-top:14px;letter-spacing:.05em;
          font-family:Verdana,Arial,sans-serif;
        ">© ${year} ${APP_NAME} · ✦</p>
      </div>
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