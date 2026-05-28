import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";
import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL ?? "", token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "" });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mirakt.ru";

  if (!token) return NextResponse.redirect(`${baseUrl}/cabinet?verified=error`);

  const userId = await getRedis().get<string>(`verify_email:${token}`);
  if (!userId) return NextResponse.redirect(`${baseUrl}/cabinet?verified=expired`);

  await getAdminClient().from("profiles").update({ email_verified: true }).eq("id", userId);
  await getRedis().del(`verify_email:${token}`);

  return NextResponse.redirect(`${baseUrl}/cabinet?verified=success`);
}
