import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: visits } = await supabase
    .from("visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  const { count: onlineNow } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  return NextResponse.json({
    onlineNow: onlineNow ?? 0,
    visits: (visits ?? []).map((v) => ({
      ip: v.ip,
      page: v.page,
      referrer: v.referrer,
      country: v.country,
      city: v.city,
      ua: v.ua,
      timestamp: new Date(v.created_at).getTime(),
    })),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await getSupabase().from("visits").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  return NextResponse.json({ ok: true });
}
