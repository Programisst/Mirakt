import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://mirakt.ru";

function escape(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: articles } = await supabase
    .from("news")
    .select("*")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (articles ?? [])
    .map((a) => {
      const url = `${BASE}/news/editorial-${a.id}`;
      const pubDate = new Date(a.created_at).toUTCString();
      const desc = escape(a.subtitle ?? a.content?.slice(0, 200) ?? "");
      const title = escape(a.title ?? "");
      const img = a.image_url
        ? `<enclosure url="${escape(a.image_url)}" type="image/jpeg" length="0"/>`
        : "";

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      ${img}
      <yandex:full-text>${escape(a.content ?? "")}</yandex:full-text>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:yandex="http://news.yandex.ru"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Mirakt — новостной портал России</title>
    <link>${BASE}</link>
    <description>Актуальные новости России, политики, экономики и мира в реальном времени.</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${BASE}/mirakt-icon.png</url>
      <title>Mirakt</title>
      <link>${BASE}</link>
    </image>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
