import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { visitId } = await req.json();
    if (!visitId) return NextResponse.json({ ok: false });
    // Обновляем created_at чтобы визит оставался "онлайн"
    await getSupabase()
      .from("visits")
      .update({ created_at: new Date().toISOString() })
      .eq("id", visitId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
