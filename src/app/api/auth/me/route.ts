import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("omni_session")?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = decodeSession(token);
  if (!payload) return NextResponse.json({ user: null });

  return NextResponse.json({ user: { email: payload.email } });
}
