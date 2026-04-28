import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'Yoice <no-reply@yoice.local>';

const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null;

export const sendLoginEmail = async (email: string, loginUrl: string) => {
  const subject = 'Tu acceso a Yoice';
  const text = [
    'Pulsa este enlace para entrar a Yoice:',
    loginUrl,
    '',
    'Este enlace caduca en 15 minutos.'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Tu acceso a Yoice</h2>
      <p style="margin-top: 0;">Pulsa este enlace para entrar:</p>
      <p><a href="${loginUrl}">${loginUrl}</a></p>
      <p>Este enlace caduca en 15 minutos.</p>
    </div>
  `;

  if (!transporter) {
    console.log('[email-login] SMTP no configurado. Enlace generado:', loginUrl);
    return false;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject,
    text,
    html
  });

  return true;
};
