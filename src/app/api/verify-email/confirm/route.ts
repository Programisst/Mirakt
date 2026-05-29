import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mirakt.ru";

  if (!token) return NextResponse.redirect(`${baseUrl}/cabinet?verified=error`);

  const admin = getAdminClient();
  const { data } = await admin
    .from("email_verify_tokens")
    .select("user_id")
    .eq("token", token)
    .single();

  if (!data) return NextResponse.redirect(`${baseUrl}/cabinet?verified=expired`);

  await admin.from("profiles").update({ email_verified: true }).eq("id", data.user_id);
  await admin.from("email_verify_tokens").delete().eq("token", token);

  return NextResponse.redirect(`${baseUrl}/cabinet?verified=success`);
}
