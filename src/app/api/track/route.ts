import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const BOT_UA = /bot|crawler|spider|vercel|aws|googlebot|bingbot|yandex|baidu|slurp|python|curl|wget|headless|prerender|lighthouse|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|applebot|seznambot|duckduck|sogou|exabot|ia_archiver|archive\.org_bot|nmap|masscan|zgrab|nuclei|sqlmap|nikto|scanner|scrapy|mechanize|requests\/|axios\/|go-http|okhttp|java\/|ruby\/|php\//i;

function getBrowser(ua: string): string {
  if (!ua) return "";
  if (/YaBrowser/i.test(ua)) return "Яндекс";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const { page, referrer, ua, source } = await req.json();

    if (!ua || BOT_UA.test(ua)) return NextResponse.json({ ok: true, skipped: true });
    if (!getBrowser(ua)) return NextResponse.json({ ok: true, skipped: true });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || "unknown";

    if (ip === "::1" || ip === "127.0.0.1") return NextResponse.json({ ok: true, skipped: true });

    const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "";
    const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "");

    const { data } = await getSupabase()
      .from("visits")
      .insert({ ip, page: page || "/", referrer: referrer || "", country, city, ua, source: source || "direct" })
      .select("id")
      .single();

    return NextResponse.json({ ok: true, visitId: data?.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
