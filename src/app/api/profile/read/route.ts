import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("reads_count")
    .eq("id", user.id)
    .single();

  await admin
    .from("profiles")
    .upsert({
      id: user.id,
      reads_count: (profile?.reads_count ?? 0) + 1,
    }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
