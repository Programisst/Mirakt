import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CATS = ["crimea", "world", "russia", "economy", "politics", "science"];

export async function GET(_req: NextRequest) {
  const db = admin();

  // All-time published (persistent counter, survives the 7-day cleanup).
  const { data: row } = await db
    .from("stats")
    .select("value")
    .eq("key", "total_published")
    .maybeSingle();
  const totalPublished = (row?.value as number) ?? 0;

  // Currently live in the DB (last 7 days), total + per category.
  const { count: liveTotal } = await db
    .from("articles")
    .select("id", { count: "exact", head: true });

  const perCategory: Record<string, number> = {};
  await Promise.all(
    CATS.map(async (cat) => {
      const { count } = await db
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("category", cat);
      perCategory[cat] = count ?? 0;
    })
  );

  return NextResponse.json(
    { total_published: totalPublished, live_total: liveTotal ?? 0, per_category: perCategory },
    { headers: { "Cache-Control": "no-store" } }
  );
}
