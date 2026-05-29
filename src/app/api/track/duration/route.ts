import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const { visitId, duration } = JSON.parse(text);
    if (!visitId || !duration || duration < 3) return NextResponse.json({ ok: false });
    await getSupabase()
      .from("visits")
      .update({ duration: Math.min(duration, 7200) }) // максимум 2 часа
      .eq("id", visitId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
