import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CBR ${res.status}`);
    const data = await res.json();
    const v = data.Valute;
    return NextResponse.json({
      usd: v?.USD?.Value ?? null,
      eur: v?.EUR?.Value ?? null,
      cny: v?.CNY?.Value ?? null,
      try: v?.TRY?.Value ?? null,
      aed: v?.AED?.Value ?? null,
    }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch {
    return NextResponse.json(
      { usd: null, eur: null, cny: null, try: null, aed: null },
      { headers: { "Cache-Control": "s-maxage=60" } },
    );
  }
}
