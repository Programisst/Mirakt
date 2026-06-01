import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const SYSTEM_PROMPT = `Ты Mirakt AI — умный ассистент новостного портала Mirakt (mirakt.ru).
Ты отвечаешь на русском языке, кратко и по делу.
Тебе будут предоставлены свежие статьи с сайта как контекст.
Используй их для ответа, если вопрос связан с новостями.
На общие вопросы отвечай из своих знаний.
Не выдумывай факты — если не знаешь, скажи об этом.
Не упоминай что ты языковая модель или ИИ — ты просто Mirakt AI.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const lastUserMsg = messages[messages.length - 1].content ?? "";

    // Fetch recent articles from Supabase for context
    const db = getDb();
    const CATS = ["world", "russia", "crimea", "economy", "science", "politics"];
    const results = await Promise.all(
      CATS.map((cat) =>
        db
          .from("articles")
          .select("title,excerpt,category,published_at")
          .eq("category", cat)
          .order("published_at", { ascending: false })
          .limit(3)
      )
    );

    const articles = results.flatMap((r) => r.data ?? []);
    const articlesContext = articles
      .map((a) => `[${a.category}] ${a.title}: ${a.excerpt ?? ""}`)
      .join("\n");

    const systemWithContext = `${SYSTEM_PROMPT}

Свежие статьи с Mirakt (последние несколько часов):
${articlesContext}`;

    const groqMessages = [
      { role: "system", content: systemWithContext },
      ...messages.slice(-10), // last 10 messages max
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_CHAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", groqRes.status, err);
      if (groqRes.status === 429) {
        return NextResponse.json({ error: "rate_limit" }, { status: 429 });
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
