import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await getAnonClient().auth.getUser(token);
  return user ?? null;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await getAdminClient().from("conversations").select("user1_id, user2_id").eq("id", id).single();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (data.user1_id !== user.id && data.user2_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await getAdminClient().from("conversations").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
