import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const SYSTEM_PROMPT = `Ты Mirakt AI — ассистент портала Mirakt. Отвечай кратко на русском. Используй список свежих новостей как контекст. На общие вопросы отвечай из своих знаний. Не выдумывай факты.`;

function getToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

const RATE_LIMIT = 20; // сообщений
const RATE_WINDOW_MS = 60 * 60 * 1000; // за час
const requestLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: "rate_limit", retryAfter: 3600 }, { status: 429 });
    }

    const { messages } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const lastUserMsg = messages[messages.length - 1].content ?? "";

    // Fetch recent articles from Supabase for context
    const CATS = ["world", "russia", "crimea", "economy", "science", "politics"];
    const results = await Promise.all(
      CATS.map((cat) =>
        db
          .from("articles")
          .select("title,category")
          .eq("category", cat)
          .order("published_at", { ascending: false })
          .limit(2)
      )
    );

    const articles = results.flatMap((r) => r.data ?? []);
    const articlesContext = articles
      .map((a) => `[${a.category}] ${a.title}`)
      .join("\n");

    const systemWithContext = `${SYSTEM_PROMPT}

Свежие статьи с Mirakt (последние несколько часов):
${articlesContext}`;

    const groqMessages = [
      { role: "system", content: systemWithContext },
      ...messages.slice(-6), // last 6 messages max
    ];

    async function callGroq(apiKey: string) {
      return fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: groqMessages,
          max_tokens: 350,
          temperature: 0.7,
        }),
      });
    }

    const chatKey = process.env.GROQ_CHAT_API_KEY ?? "";
    let groqRes = await callGroq(chatKey);

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", groqRes.status, err);
      if (groqRes.status === 429) {
        const retryAfter = parseInt(groqRes.headers.get("retry-after") ?? "60", 10);
        return NextResponse.json({ error: "rate_limit", retryAfter }, { status: 429 });
      }
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "Не удалось получить ответ.";

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
