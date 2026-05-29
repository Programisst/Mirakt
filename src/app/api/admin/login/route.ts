import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || password !== secret) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const token = jwt.sign({ admin: true }, secret, { expiresIn: "7d" });
  return NextResponse.json({ token });
}
