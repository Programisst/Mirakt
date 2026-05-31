import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || "main";
  const page     = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  const search   = (searchParams.get("search") || "").trim();
  const limit    = 50;

  const db = getDb();

  // Search mode: full-text across all articles from last 7 days, no pagination limit
  if (search) {
    const q = `%${search}%`;
    const { data, error } = await db
      .from("articles")
      .select("id,slug,title,excerpt,image_url,category,published_at")
      .or(`title.ilike.${q},excerpt.ilike.${q}`)
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
  }

  // "Главное": берём топ-4 из каждой категории, перемешиваем по дате
  // Так на главной всегда равный представитель каждого раздела
  if (category === "main") {
    const CATS = ["world", "russia", "crimea", "economy", "science", "politics"];
    const PER_CAT = 4;
    const results = await Promise.all(
      CATS.map((cat) =>
        db
          .from("articles")
          .select("id,slug,title,excerpt,image_url,category,published_at")
          .eq("category", cat)
          .order("published_at", { ascending: false })
          .limit(PER_CAT)
      )
    );
    const combined = results
      .flatMap((r) => r.data ?? [])
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return NextResponse.json(combined, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  }

  const { data, error } = await db
    .from("articles")
    .select("id,slug,title,excerpt,image_url,category,published_at")
    .eq("category", category)
    .order("published_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
  });
}
