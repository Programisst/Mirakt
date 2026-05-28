import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

  auth: { autoRefreshToken: false, persistSession: false },
});

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await anon.auth.getUser(token);
  return user ?? null;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await admin.from("chat_settings").select("can_message").eq("user_id", user.id).maybeSingle();
  return NextResponse.json({ can_message: data?.can_message ?? "all" });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { can_message } = await req.json();
  if (!["all", "friends"].includes(can_message))
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  await admin.from("chat_settings").upsert({ user_id: user.id, can_message }, { onConflict: "user_id" });
  return NextResponse.json({ ok: true });
}
