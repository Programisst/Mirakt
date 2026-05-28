import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-auth") !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from("news-images")
    .upload(filename, buffer, { contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("news-images")
    .getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
