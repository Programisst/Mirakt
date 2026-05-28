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

// GET — список диалогов с последним сообщением
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: convs } = await admin
    .from("conversations")
    .select("id, user1_id, user2_id, created_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  if (!convs?.length) return NextResponse.json([]);

  const otherIds = convs.map(c => c.user1_id === user.id ? c.user2_id : c.user1_id);
  const { data: profiles } = await admin
    .from("profiles").select("id, username, avatar_url, verified")
    .in("id", otherIds);
  const pm = new Map(profiles?.map(p => [p.id, p]) ?? []);

  const results = await Promise.all(convs.map(async (c) => {
    const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
    const { data: lastMsg } = await admin
      .from("messages").select("content, image_url, created_at, sender_id")
      .eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return {
      id: c.id,
      other_user: pm.get(otherId) ?? { id: otherId, username: null, avatar_url: null, verified: false },
      latest_message: lastMsg ?? null,
    };
  }));

  results.sort((a, b) => {
    const ta = a.latest_message?.created_at ?? a.id;
    const tb = b.latest_message?.created_at ?? b.id;
    return tb.localeCompare(ta);
  });

  return NextResponse.json(results);
}

// POST — открыть/создать диалог с проверкой приватности
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();
  const { data: target } = await admin.from("profiles").select("id").eq("username", username).single();
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Нельзя писать себе" }, { status: 400 });

  // Проверка приватности
  const { data: settings } = await admin
    .from("chat_settings").select("can_message").eq("user_id", target.id).maybeSingle();
  if (settings?.can_message === "friends") {
    const { data: fr } = await admin.from("friendships").select("id").eq("status", "accepted")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${user.id})`)
      .maybeSingle();
    if (!fr) return NextResponse.json({ error: "Пользователь принимает сообщения только от друзей" }, { status: 403 });
  }

  const [u1, u2] = [user.id, target.id].sort();
  const { data: conv, error } = await admin
    .from("conversations")
    .upsert({ user1_id: u1, user2_id: u2 }, { onConflict: "user1_id,user2_id" })
    .select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: otherProfile } = await admin.from("profiles")
    .select("id, username, avatar_url, verified").eq("id", target.id).single();

  return NextResponse.json({ id: conv.id, other_user: otherProfile });
}
