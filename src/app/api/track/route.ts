import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { page, referrer, ua } = await req.json();

    const botPatterns = /bot|crawler|spider|vercel|aws|googlebot|bingbot|yandex|baidu|slurp|python|curl|wget|headless|prerender|lighthouse|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|applebot|seznambot|duckduck|sogou|exabot|ia_archiver|archive\.org_bot|nmap|masscan|zgrab|nuclei|sqlmap|nikto|scanner|scrapy|mechanize|requests\/|axios\/|go-http|okhttp|java\/|ruby\/|php\//i;
    if (ua && botPatterns.test(ua)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const country = req.headers.get("x-vercel-ip-country") || "";
    const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "");

    const now = Date.now();
    const visit = { ip, page, referrer, country, city, ua: ua || "", timestamp: now };

    const redis = getRedis();
    await Promise.all([
      redis.zadd("visits", { score: now, member: JSON.stringify(visit) }),
      redis.zadd("online", { score: now, member: ip }),
      redis.zremrangebyscore("online", 0, now - 5 * 60 * 1000),
      redis.zremrangebyrank("visits", 0, -2001),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
