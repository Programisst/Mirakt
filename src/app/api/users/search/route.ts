import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const { data, error } = await getAdminClient()
    .from("profiles")
    .select("username, avatar_url, verified")
    .ilike("username", `%${q}%`)
    .not("username", "is", null)
    .limit(20);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
