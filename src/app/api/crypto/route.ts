import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd",
      {
        next: { revalidate: 60 },
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json(
      { bitcoin: { usd: null }, ethereum: { usd: null }, solana: { usd: null }, ripple: { usd: null } },
      { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" } },
    );
  }
}
