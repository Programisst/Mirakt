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

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await anon.auth.getUser(token);
  return user ?? null;
}

// GET /api/friends — список друзей + заявки
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows } = await admin
    .from("friendships")
    .select("id, sender_id, receiver_id, status, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) {
    return NextResponse.json({ friends: [], incoming: [], outgoing: [] });
  }

  const ids = [...new Set(rows.flatMap(r => [r.sender_id, r.receiver_id]).filter(id => id !== user.id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, avatar_url, verified")
    .in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const pm = new Map(profiles?.map(p => [p.id, p]) ?? []);

  const friends = rows
    .filter(r => r.status === "accepted")
    .map(r => ({ id: r.id, profile: pm.get(r.sender_id === user.id ? r.receiver_id : r.sender_id) }))
    .filter(r => r.profile);

  const incoming = rows
    .filter(r => r.status === "pending" && r.receiver_id === user.id)
    .map(r => ({ id: r.id, profile: pm.get(r.sender_id), created_at: r.created_at }))
    .filter(r => r.profile);

  const outgoing = rows
    .filter(r => r.status === "pending" && r.sender_id === user.id)
    .map(r => ({ id: r.id, profile: pm.get(r.receiver_id), created_at: r.created_at }))
    .filter(r => r.profile);

  return NextResponse.json({ friends, incoming, outgoing });
}

// POST /api/friends — отправить заявку
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_username } = await req.json();
  if (!target_username) return NextResponse.json({ error: "target_username required" }, { status: 400 });

  const { data: target } = await admin
    .from("profiles").select("id").eq("username", target_username).single();
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Нельзя добавить себя" }, { status: 400 });

  const { data: existing } = await admin
    .from("friendships")
    .select("id")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Заявка уже существует" }, { status: 409 });

  const { data, error } = await admin
    .from("friendships")
    .insert({ sender_id: user.id, receiver_id: target.id, status: "pending" })
    .select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
