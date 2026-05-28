import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
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

// PATCH /api/friends/[id] — принять или отклонить
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json(); // 'accept' | 'reject'

  const { data: row } = await admin
    .from("friendships").select("receiver_id").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (row.receiver_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "reject") {
    await admin.from("friendships").delete().eq("id", id);
  } else {
    await admin.from("friendships").update({ status: "accepted" }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/friends/[id] — отменить заявку или удалить из друзей
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: row } = await admin
    .from("friendships").select("sender_id, receiver_id").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (row.sender_id !== user.id && row.receiver_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("friendships").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
