import { NextRequest, NextResponse } from "next/server";
import { generateCode, storeCode } from "../../../../lib/auth";
import { sendVerificationEmail } from "../../../../lib/mailer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email ?? "").toString().toLowerCase().trim();
  const intentRaw = (body.intent ?? "login").toString().toLowerCase();
  const intent = intentRaw === "register" ? "register" : "login";

  if (!email || !email.includes("@") || !email.includes(".")) {
    return NextResponse.json(
      { error: "Введите корректный email" },
      { status: 400 }
    );
  }

  const code = generateCode();
  storeCode(email, code);

  try {
    await sendVerificationEmail(email, code, intent);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/auth/send-code] SMTP error:", e);
    return NextResponse.json(
      { error: "Не удалось отправить письмо. Проверьте настройки SMTP." },
      { status: 500 }
    );
  }
}
