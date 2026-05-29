import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export function checkAdminAuth(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-auth") ?? "";
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  // Поддерживаем и старый формат (plain password) и новый (JWT)
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}
