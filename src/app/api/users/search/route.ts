import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const { data, error } = await admin
    .from("profiles")
    .select("username, avatar_url, verified")
    .ilike("username", `%${q}%`)
    .not("username", "is", null)
    .limit(20);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
