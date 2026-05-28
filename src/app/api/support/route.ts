import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json().catch(() => ({}));

  if (!name?.trim() || !email?.trim() || !message?.trim())
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.log("\n[Support] New request:");
    console.log(`  From: ${name} <${email}>`);
    console.log(`  Subject: ${subject || "—"}`);
    console.log(`  Message: ${message}\n`);
    return NextResponse.json({ ok: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050403;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050403;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0a0806;border-radius:20px;border:1px solid rgba(212,175,55,0.2);padding:40px 36px;">
        <tr><td>
          <p style="margin:0 0 4px;color:#D4AF37;font-size:13px;font-weight:700;letter-spacing:0.14em;">MIRAKT</p>
          <p style="margin:0 0 28px;color:rgba(255,255,255,0.2);font-size:11px;letter-spacing:0.1em;">СЛУЖБА ПОДДЕРЖКИ</p>
          <p style="margin:0 0 6px;color:#ffffff;font-size:20px;font-weight:700;">Новая заявка</p>
          <p style="margin:0 0 28px;color:rgba(255,255,255,0.35);font-size:13px;">${subject?.trim() || "Без темы"}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:20px;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:0.1em;">ОТ КОГО</p>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">${name} &lt;${email}&gt;</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:0.1em;">СООБЩЕНИЕ</p>
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.65;white-space:pre-wrap;">${message.trim()}</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Mirakt Support" <${user}>`,
      to: "mirakt.news@mail.ru",
      replyTo: email,
      subject: `[Поддержка] ${subject?.trim() || name}`,
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Support] SMTP error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
