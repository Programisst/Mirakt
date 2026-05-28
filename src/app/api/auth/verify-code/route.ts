import { NextRequest, NextResponse } from "next/server";
import { verifyCode, createSession } from "../../../../lib/auth";

const ERROR_MESSAGES: Record<"invalid" | "expired" | "max_attempts", string> = {
  invalid:      "Неверный код. Попробуйте ещё раз.",
  expired:      "Код истёк. Запросите новый.",
  max_attempts: "Слишком много попыток. Запросите новый код.",
};

export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({}));
  const email = (body.email ?? "").toString().toLowerCase().trim();
  const code  = (body.code  ?? "").toString().trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Недостаточно данных" }, { status: 400 });
  }

  const result = verifyCode(email, code);
  if (result !== "ok") {
    return NextResponse.json(
      { error: ERROR_MESSAGES[result] },
      { status: 400 }
    );
  }

  const token = createSession(email);

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set("omni_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   30 * 24 * 60 * 60, // 30 days
    path:     "/",
  });
  return res;
}
