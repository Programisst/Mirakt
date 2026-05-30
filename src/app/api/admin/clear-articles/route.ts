import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const { count } = await db
    .from("articles")
    .select("id", { count: "exact", head: true });

  await db.from("articles").delete().lt("published_at", new Date(Date.now() + 999 * 24 * 60 * 60 * 1000).toISOString());

  return NextResponse.json({ deleted: count ?? 0, ok: true });
}
