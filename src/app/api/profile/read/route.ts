import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await getAnonClient().auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await getAdminClient()
    .from("profiles")
    .select("reads_count")
    .eq("id", user.id)
    .single();

  await getAdminClient()
    .from("profiles")
    .upsert({
      id: user.id,
      reads_count: (profile?.reads_count ?? 0) + 1,
    }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
