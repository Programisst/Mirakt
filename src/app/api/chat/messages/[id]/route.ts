import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await anon.auth.getUser(token);
  return user ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });

  const { data: msg } = await admin.from("messages").select("sender_id").eq("id", id).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.sender_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: updated } = await admin.from("messages")
    .update({ content: content.trim() })
    .eq("id", id)
    .select("id, conversation_id, sender_id, content, image_url, created_at")
    .single();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: msg } = await admin.from("messages").select("sender_id").eq("id", id).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.sender_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await admin.from("messages").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
