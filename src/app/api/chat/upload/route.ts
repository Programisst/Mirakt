import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Только изображения" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Максимум 5 МБ" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `chat/${user.id}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("news-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from("news-images").getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
