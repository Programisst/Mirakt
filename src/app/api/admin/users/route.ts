import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  return req.headers.get("x-admin-auth") === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  const [{ data, error }, { data: profiles }] = await Promise.all([
    getAdminClient().auth.admin.listUsers({ perPage: 200 }),
    getAdminClient().from("profiles").select("id, username, avatar_url, verified"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  const users = data.users.map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "—",
      created_at: u.created_at,
      confirmed: !!u.email_confirmed_at,
      last_sign_in: u.last_sign_in_at ?? null,
      banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
      username: p?.username ?? null,
      avatar_url: p?.avatar_url ?? null,
      verified: !!p?.verified,
    };
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ban, verify } = await req.json();
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });

  if (typeof ban === "boolean") {
    const { error } = await getAdminClient().auth.admin.updateUserById(id, {
      ban_duration: ban ? "876600h" : "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (typeof verify === "boolean") {
    const { error } = await getAdminClient()
      .from("profiles")
      .upsert({ id, verified: verify }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
