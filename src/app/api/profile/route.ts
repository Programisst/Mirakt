import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

function getToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getUserClient(token);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb
    .from("profiles")
    .select("username, avatar_url, verified, email_verified")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    username: profile?.username ?? null,
    avatar_url: profile?.avatar_url ?? null,
    verified: !!profile?.verified,
    email_verified: !!profile?.email_verified,
  });
}

export async function PATCH(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getUserClient(token);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (typeof body.username === "string") {
    const u = body.username.trim();
    if (u.length > 0) {
      if (u.length < 2 || u.length > 24)
        return NextResponse.json({ error: "Ник: от 2 до 24 символов" }, { status: 400 });
      if (!/^[a-zA-Zа-яА-ЯёЁ0-9_.\- ]+$/.test(u))
        return NextResponse.json({ error: "Ник содержит недопустимые символы" }, { status: 400 });
      patch.username = u;
    } else {
      patch.username = null;
    }
  }

  if (typeof body.avatar_url === "string") {
    patch.avatar_url = body.avatar_url || null;
  }

  const { error } = await sb.from("profiles").upsert(patch, { onConflict: "id" });
  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Ник уже занят" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
