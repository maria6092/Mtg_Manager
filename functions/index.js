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

// ── Plantilla HTML compartida (tema cósmico/dorado como tu app) ──
function baseTemplate({ title, message, buttonText, link, footer }) {
  return `
  <div style="background:#0f0817;padding:40px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:460px;margin:0 auto;background:#1a0f2e;border:1px solid rgba(201,150,58,.25);border-radius:16px;padding:32px 28px;color:#e8d5b0;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:26px;font-weight:700;color:#e8b84b;letter-spacing:.05em;">✦ ${APP_NAME} ✦</div>
      </div>
      <h1 style="font-size:19px;color:#e8b84b;margin:0 0 14px;text-align:center;">${title}</h1>
      <p style="font-size:14px;line-height:1.6;color:#e8d5b0;text-align:center;margin:0 0 24px;">${message}</p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${link}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#c9963a,#8b5e1a);color:#1a0f2e;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.03em;">
          ${buttonText}
        </a>
      </div>
      <p style="font-size:11px;color:#9e86c2;text-align:center;line-height:1.5;margin:0;">${footer}</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#5a4d70;margin-top:16px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
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
