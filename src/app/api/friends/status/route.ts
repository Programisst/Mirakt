import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/friends/status?username=X
// Returns: { status: null | 'pending_sent' | 'pending_received' | 'accepted', id?: string }
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ status: null });

  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return NextResponse.json({ status: null });

  const targetUsername = req.nextUrl.searchParams.get("username");
  if (!targetUsername) return NextResponse.json({ status: null });

  const { data: target } = await admin
    .from("profiles").select("id").eq("username", targetUsername).single();
  if (!target) return NextResponse.json({ status: null });

  // Own profile
  if (target.id === user.id) return NextResponse.json({ status: "self" });

  const { data: row } = await admin
    .from("friendships")
    .select("id, status, sender_id")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (!row) return NextResponse.json({ status: null });

  let status: string;
  if (row.status === "accepted") status = "accepted";
  else if (row.sender_id === user.id) status = "pending_sent";
  else status = "pending_received";

  return NextResponse.json({ status, id: row.id });
}
