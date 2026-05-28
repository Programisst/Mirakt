import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  });
}

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("x-analytics-auth");
  if (auth !== PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const redis = getRedis();
  await Promise.all([redis.del("visits"), redis.del("online")]);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-analytics-auth");
  if (auth !== PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis = getRedis();
  const now = Date.now();
  const [rawVisits, onlineCount] = await Promise.all([
    redis.zrange("visits", 0, -1),
    redis.zcount("online", now - 5 * 60 * 1000, now),
  ]);

  const visits = (rawVisits as string[]).map((v) => {
    try { return typeof v === "string" ? JSON.parse(v) : v; }
    catch { return null; }
  }).filter((v) => v && v.ip !== "unknown");

  return NextResponse.json({ onlineNow: onlineCount, visits });
}
