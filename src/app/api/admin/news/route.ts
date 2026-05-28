import { NextRequest, NextResponse } from "next/server";
import { getNews, addNews, deleteNews } from "@/lib/news-store";
import { supabase } from "@/lib/supabase";

function checkAuth(req: NextRequest): boolean {
  return req.headers.get("x-admin-auth") === process.env.ADMIN_PASSWORD;
}

const unauth = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauth();
  try {
    return NextResponse.json(await getNews());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauth();
  try {
    const { title, subtitle, category, content, image_url } = await req.json();
    if (!title || !category) {
      return NextResponse.json({ error: "title и category обязательны" }, { status: 400 });
    }
    const item = await addNews({ title, subtitle: subtitle ?? "", category, content: content ?? "", image_url: image_url ?? "" });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return unauth();
  try {
    const { id, hidden, title, subtitle, category, content, image_url } = await req.json();
    if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    const update = hidden !== undefined
      ? { hidden }
      : { title, subtitle, category, content, image_url };
    const { data, error } = await supabase
      .from("news")
      .update(update)
      .eq("id", id)
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0] ?? {});
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauth();
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    await deleteNews(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
