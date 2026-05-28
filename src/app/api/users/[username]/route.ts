import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: profile, error } = await getAdminClient()
    .from("profiles")
    .select("id, username, avatar_url, verified")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const { data: { user }, error: authError } = await getAdminClient().auth.admin.getUserById(profile.id);
  if (authError || !user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json({
    username: profile.username,
    avatar_url: profile.avatar_url,
    verified: profile.verified,
    created_at: user.created_at,
  });
}
