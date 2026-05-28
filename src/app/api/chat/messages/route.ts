import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await getAnonClient().auth.getUser(token);
  return user ?? null;
}

async function verifyParticipant(convId: string, userId: string) {
  const { data } = await getAdminClient().from("conversations")
    .select("user1_id, user2_id").eq("id", convId).single();
  if (!data) return false;
  return data.user1_id === userId || data.user2_id === userId;
}

// GET — история сообщений
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convId = req.nextUrl.searchParams.get("conversation_id");
  if (!convId) return NextResponse.json({ error: "conversation_id required" }, { status: 400 });

  if (!(await verifyParticipant(convId, user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: msgs } = await getAdminClient()
    .from("messages")
    .select("id, conversation_id, sender_id, content, image_url, created_at")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(100);

  const senderIds = [...new Set(msgs?.map(m => m.sender_id) ?? [])];
  const { data: profiles } = await getAdminClient().from("profiles")
    .select("id, username, avatar_url")
    .in("id", senderIds.length > 0 ? senderIds : ["00000000-0000-0000-0000-000000000000"]);
  const pm = new Map(profiles?.map(p => [p.id, p]) ?? []);

  return NextResponse.json(msgs?.map(m => ({ ...m, sender: pm.get(m.sender_id) ?? null })) ?? []);
}

// POST — отправить сообщение
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversation_id, content, image_url } = await req.json();
  if (!content && !image_url) return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });

  if (!(await verifyParticipant(conversation_id, user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: msg, error } = await getAdminClient().from("messages")
    .insert({ conversation_id, sender_id: user.id, content: content ?? null, image_url: image_url ?? null })
    .select("id, conversation_id, sender_id, content, image_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(msg);
}
