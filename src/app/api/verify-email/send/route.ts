import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";
import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";
import crypto from "crypto";

const redis = Redis.fromEnv();

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getUserClient(token);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const verifyToken = crypto.randomBytes(32).toString("hex");
  await redis.set(`verify_email:${verifyToken}`, user.id, { ex: 60 * 60 * 24 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mirakt.ru";
  const link = `${baseUrl}/api/verify-email/confirm?token=${verifyToken}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try { await transporter.verify(); } catch (e) {
    console.error("SMTP verify failed:", e);
    return NextResponse.json({ error: "SMTP connection failed" }, { status: 500 });
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Подтвердите вашу почту — Mirakt",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#08070a;font-family:system-ui,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#0d0b10;border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;">
          <div style="padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:rgba(212,175,55,0.9);font-weight:900;font-size:18px;letter-spacing:0.2em;">MIRAKT</span>
          </div>
          <div style="padding:40px 32px;text-align:center;">
            <div style="width:56px;height:56px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:24px;">✉</span>
            </div>
            <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 12px;">Подтвердите почту</h1>
            <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.6;margin:0 0 32px;">
              Нажмите кнопку ниже чтобы подтвердить ваш email адрес.<br>Ссылка действует 24 часа.
            </p>
            <a href="${link}" style="display:inline-block;padding:14px 32px;background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.4);border-radius:12px;color:rgba(212,175,55,0.9);font-size:12px;font-weight:900;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;">
              Подтвердить почту
            </a>
          </div>
          <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:rgba(255,255,255,0.15);font-size:11px;margin:0;">© ${new Date().getFullYear()} Mirakt.ru</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return NextResponse.json({ ok: true });
}

