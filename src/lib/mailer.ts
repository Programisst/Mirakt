import nodemailer from "nodemailer";

export type MailIntent = "login" | "register";

function buildHtml(code: string, intent: MailIntent): string {
  const subtitle =
    intent === "register"
      ? "Введите его в Mirakt, чтобы завершить регистрацию"
      : "Введите его в Mirakt для входа в аккаунт";
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050403;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050403;padding:40px 16px;">
    <tr><td align="center">
      <table width="400" cellpadding="0" cellspacing="0" style="background:#0a0806;border-radius:20px;border:1px solid rgba(212,175,55,0.2);padding:40px 36px;">
        <tr><td>
          <!-- Logo -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
            <tr>
              <td style="color:#D4AF37;font-size:16px;font-weight:700;letter-spacing:0.12em;">Mirakt</td>
            </tr>
          </table>
          <!-- Title -->
          <p style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:700;">Код подтверждения</p>
          <p style="margin:0 0 32px;color:rgba(255,255,255,0.38);font-size:14px;">${subtitle}</p>
          <!-- Code box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center" style="background:rgba(212,175,55,0.07);border:1px solid rgba(212,175,55,0.28);border-radius:14px;padding:24px;">
              <span style="font-size:42px;font-weight:900;letter-spacing:0.38em;color:#D4AF37;font-family:monospace;">${code}</span>
            </td></tr>
          </table>
          <!-- Footer note -->
          <p style="margin:0;color:rgba(255,255,255,0.2);font-size:12px;text-align:center;line-height:1.6;">
            Код действителен <strong style="color:rgba(255,255,255,0.35);">10 минут</strong>.<br>
            Если вы не запрашивали код — просто проигнорируйте это письмо.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  intent: MailIntent = "login"
): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const label = intent === "register" ? "регистрация" : "вход";

  // Dev mode: no SMTP configured → log code to terminal
  if (!user || !pass) {
    console.log(`\n┌─── Mirakt: Verification Code (${label}) ─┐`);
    console.log(`│  Email : ${to}`);
    console.log(`│  Code  : ${code}`);
    console.log(`└────────────────────────────────────────────┘\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });

  const subject =
    intent === "register"
      ? `${code} — код регистрации Mirakt`
      : `${code} — код входа Mirakt`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Mirakt" <${user}>`,
    to,
    subject,
    html: buildHtml(code, intent),
  });
}
