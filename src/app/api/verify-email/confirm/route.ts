import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mirakt.ru";

  if (!token) return NextResponse.redirect(`${baseUrl}/cabinet?verified=error`);

  const userId = await redis.get<string>(`verify_email:${token}`);
  if (!userId) return NextResponse.redirect(`${baseUrl}/cabinet?verified=expired`);

  await admin.from("profiles").update({ email_verified: true }).eq("id", userId);
  await redis.del(`verify_email:${token}`);

  return NextResponse.redirect(`${baseUrl}/cabinet?verified=success`);
}
