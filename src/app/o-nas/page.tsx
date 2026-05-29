"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

const CONTENT = {
  ru: {
    back:  "← На главную",
    title: "О нас",
    p1: <><strong style={{ color: "rgba(255,255,255,0.9)" }}>Mirakt</strong> — независимый российский новостной портал, созданный для тех, кто хочет быть в курсе главных событий страны и мира без лишнего шума и информационного мусора. Мы работаем в режиме реального времени и обновляем ленту круглосуточно.</>,
    p2: "Наша редакция агрегирует новости из ведущих российских изданий — РИА Новости, ТАСС, Лента.ру, Интерфакс, Коммерсантъ, Ведомости и других проверенных источников. Мы не придумываем заголовки и не искажаем факты — только актуальная информация в том виде, в котором она поступает от первоисточников.",
    p3: "Особое место в нашей работе занимают новости Крыма и южных регионов России. Мы убеждены, что события на полуострове заслуживают такого же пристального внимания, как и федеральная повестка, — и отражаем это в структуре нашего издания.",
    values: [
      { title: "Оперативность", text: "Лента обновляется каждые 5 минут. Вы узнаёте о событиях одними из первых." },
      { title: "Достоверность", text: "Только проверенные федеральные и региональные источники — никакого фейка." },
      { title: "Удобство",      text: "Чистый интерфейс без навязчивой рекламы и баннеров. Читать — удовольствие." },
      { title: "Широкий охват", text: "Политика, экономика, наука, мир — все ключевые темы в одном месте." },
    ],
    p4: "Mirakt — это не просто агрегатор. Мы развиваем собственную редакционную политику: публикуем авторские материалы, готовим тематические подборки и аналитику по ключевым темам. Наша цель — стать главным новостным ресурсом для жителей России, которые ценят своё время и хотят получать информацию быстро и без лишних усилий.",
    p5: "Мы открыты для диалога. Если вы хотите предложить материал, сообщить об ошибке или обсудить сотрудничество — напишите нам. Мы читаем каждое письмо.",
    contact: "По вопросам сотрудничества и редакционным предложениям:",
  },
  en: {
    back:  "← Back to home",
    title: "About us",
    p1: <><strong style={{ color: "rgba(255,255,255,0.9)" }}>Mirakt</strong> is an independent Russian news portal built for those who want to stay informed about the most important events in Russia and around the world — without noise or information overload. We operate in real time and update the feed around the clock.</>,
    p2: "Our editorial team aggregates news from leading Russian publications — RIA Novosti, TASS, Lenta.ru, Interfax, Kommersant, Vedomosti and other trusted sources. We don't fabricate headlines or distort facts — only up-to-date information delivered exactly as it comes from the original sources.",
    p3: "A special focus of our work is news from Crimea and southern Russia. We believe events on the peninsula deserve the same close attention as federal news — and we reflect this in the structure of our publication.",
    values: [
      { title: "Speed",       text: "The feed updates every 5 minutes. You hear about events among the first." },
      { title: "Accuracy",    text: "Only verified federal and regional sources — no fake news." },
      { title: "Convenience", text: "Clean interface without intrusive ads or banners. Reading is a pleasure." },
      { title: "Coverage",    text: "Politics, economy, science, world — all key topics in one place." },
    ],
    p4: "Mirakt is more than an aggregator. We maintain our own editorial policy: publishing original articles, curated theme collections and analysis on key topics. Our goal is to become the primary news resource for people in Russia who value their time and want information fast, without the hassle.",
    p5: "We welcome dialogue. If you'd like to suggest a story, report an error, or discuss partnership — write to us. We read every message.",
    contact: "For partnership inquiries and editorial proposals:",
  },
};

export default function AboutPage() {
  const { locale } = useLocale();
  const c = CONTENT[locale];

  return (
    <main className="mx-auto max-w-2xl px-6 py-24"
      style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter, sans-serif" }}>
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>
        {c.back}
      </Link>

      <h1 style={{ fontSize: "clamp(24px, 7vw, 36px)", fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em", wordBreak: "break-word" }}>
        {c.title}
      </h1>
      <div style={{ width: 48, height: 2, background: GOLD_DIM, marginBottom: 40 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24, color: "rgba(255,255,255,0.62)", fontSize: 16, lineHeight: 1.85 }}>
        <p>{c.p1}</p>
        <p>{c.p2}</p>
        <p>{c.p3}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "8px 0" }}>
          {c.values.map(({ title, text }) => (
            <div key={title} style={{ padding: "18px 20px", background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{text}</div>
            </div>
          ))}
        </div>

        <p>{c.p4}</p>
        <p>{c.p5}</p>

        <div style={{ marginTop: 8, padding: "20px 24px", borderLeft: "2px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.04)", borderRadius: "0 8px 8px 0" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
            {c.contact}{" "}
            <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a>
          </p>
        </div>
      </div>
    </main>
  );
}
