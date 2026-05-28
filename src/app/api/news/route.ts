import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  let query = supabase.from("news").select("*").eq("hidden", false).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
