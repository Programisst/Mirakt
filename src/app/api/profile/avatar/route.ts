import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });

  const userClient = getAnonClient(); // token-based auth via header
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Только изображения" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Максимум 5 МБ" }, { status: 400 });
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/${user.id}-${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error } = await getAdminClient().storage
    .from("news-images")
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = getAdminClient().storage
    .from("news-images")
    .getPublicUrl(data.path);

  const { error: pErr } = await getAdminClient()
    .from("profiles")
    .upsert(
      { id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  return NextResponse.json({ url: publicUrl });
}
