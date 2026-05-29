import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const BOT_UA = /bot|crawler|spider|vercel|aws|googlebot|bingbot|yandex|baidu|slurp|python|curl|wget|headless|prerender|lighthouse|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|applebot|seznambot|duckduck|sogou|exabot|ia_archiver|archive\.org_bot|nmap|masscan|zgrab|nuclei|sqlmap|nikto|scanner|scrapy|mechanize|requests\/|axios\/|go-http|okhttp|java\/|ruby\/|php\//i;

export async function POST(req: NextRequest) {
  try {
    const { page, referrer, ua } = await req.json();

    if (ua && BOT_UA.test(ua)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const country = req.headers.get("x-vercel-ip-country") ||
                    req.headers.get("x-country") || "";
    const city = decodeURIComponent(
      req.headers.get("x-vercel-ip-city") ||
      req.headers.get("x-city") || ""
    );

    await getSupabase()
      .from("visits")
      .insert({ ip, page, referrer: referrer || "", country, city, ua: ua || "" });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
