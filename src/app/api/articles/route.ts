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
  const limit    = 50;

  const db = getDb();

  let query = db
    .from("articles")
    .select("id,slug,title,excerpt,image_url,category,published_at")
    .order("published_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (category !== "main") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
  });
}
