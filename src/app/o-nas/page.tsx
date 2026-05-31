"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";
const GOLD_BG  = "rgba(212,175,55,0.04)";
const GOLD_BD  = "rgba(212,175,55,0.12)";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 10 }}>{children}</h2>
      <div style={{ width: 32, height: 2, background: GOLD_DIM }} />
    </div>
  );
}

function ValueCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ padding: "20px 22px", background: GOLD_BG, border: `1px solid ${GOLD_BD}`, borderRadius: 12 }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 16px", background: GOLD_BG, border: `1px solid ${GOLD_BD}`, borderRadius: 12 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

const CONTENT = {
  ru: {
    back: "← На главную",
    title: "О нас",
    lead: "Mirakt — российское независимое новостное издание. Мы публикуем актуальные новости страны и мира каждый день, круглосуточно — без лишнего шума, кликбейта и информационного мусора.",
    stats: [
      { value: "24/7", label: "новости без остановки" },
      { value: "6", label: "тематических разделов" },
      { value: "10 мин", label: "интервал обновления" },
      { value: "2026", label: "год основания" },
    ],
    s1title: "Наша миссия",
    s1: [
      "Mirakt создан с одной целью — дать читателю полную и честную картину происходящего. Мы убеждены: качественная журналистика должна быть доступной, а важные новости — находить своего читателя, а не наоборот.",
      "Редакция ориентируется на аудиторию, которая ценит своё время: деловых людей, студентов, журналистов и всех, кто хочет быть в курсе событий в России и мире. Мы пишем кратко, по делу и без воды — так, чтобы за несколько минут можно было узнать главное.",
    ],
    s2title: "Как мы работаем",
    s2: "Редакция Mirakt работает в круглосуточном режиме. Лента обновляется каждые 10 минут: редакторы отбирают наиболее значимые события, проверяют их актуальность и публикуют в соответствующем тематическом разделе. Материалы проходят отбор по критериям значимости и достоверности — мы не публикуем гороскопы, слухи и рекламный контент.",
    sources: [] as string[],
    s3title: "Тематика и охват",
    s3: "Mirakt освещает шесть ключевых направлений: политику, экономику, международные события, новости России, науку и технологии, а также отдельный раздел, посвящённый Крыму и южным регионам. Мы убеждены, что региональные новости заслуживают такого же внимания, как федеральная повестка.",
    valuesTitle: "Редакционные принципы",
    values: [
      { icon: "⚡", title: "Оперативность", text: "Лента обновляется каждые 10 минут. Важные новости выходят сразу после того, как события произошли." },
      { icon: "✓", title: "Достоверность", text: "Мы публикуем только то, что подтверждено. Никаких слухов, анонимных источников и непроверенных данных." },
      { icon: "◈", title: "Приоритет важного", text: "Алгоритм редакции оценивает значимость каждого события. Самые важные новости — всегда на первом месте." },
      { icon: "✦", title: "Чистый формат", text: "Никаких навязчивых баннеров, всплывающих окон и рекламных ловушек. Сайт создан для чтения." },
      { icon: "◉", title: "Региональный фокус", text: "Особое внимание — событиям в Крыму и южных регионах России. Региональная повестка не менее важна федеральной." },
      { icon: "⊕", title: "Нейтральность", text: "Мы излагаем факты, а не навязываем мнения. Редакция стремится к объективному освещению событий." },
    ],
    s4title: "Telegram-канал",
    s4: "Следите за важнейшими новостями дня в нашем официальном Telegram-канале. Мы публикуем самые горячие и значимые материалы — кратко, по делу, без воды. Подписывайтесь и оставайтесь в курсе событий даже без открытия сайта.",
    tgBtn: "Подписаться на Mirakt",
    s5title: "Технологии",
    s5: [
      "В основе Mirakt лежит современный технологический стек: Next.js обеспечивает мгновенную загрузку страниц даже на медленном соединении, а облачная база данных хранит все публикации с возможностью мгновенного поиска.",
      "Редакция использует инструменты на основе искусственного интеллекта для помощи в обработке большого объёма информации, категоризации материалов и подбора иллюстраций. Это позволяет работать в режиме реального времени без потери качества.",
      "Каждая публикация сопровождается тематической иллюстрацией, подобранной по содержанию материала. Мы следим за тем, чтобы визуальный ряд соответствовал смыслу новости.",
    ],
    s6title: "Перспективы развития",
    s6: [
      "Мы продолжаем активно развивать издание. В ближайших планах — расширение региональной сети, углубление международной повестки и запуск персонализированной ленты, которая будет учитывать интересы каждого читателя.",
      "Mirakt развивается в направлении полноценного медиа с собственными авторскими материалами, экспертными разборами и тематической аналитикой. Наша цель — стать главным новостным изданием для тех, кто ценит своё время.",
    ],
    contactTitle: "Контакты редакции",
    contactText: "Мы открыты для обратной связи, предложений о сотрудничестве и редакционных инициатив. Если вы хотите предложить тему, сообщить об ошибке или обсудить партнёрство — напишите нам. Каждое обращение рассматривается редакцией лично.",
    contactEmail: "По всем вопросам:",
  },
  en: {
    back: "← Back to home",
    title: "About Us",
    lead: "Mirakt is an independent Russian news publication. We cover the most important events in Russia and around the world every day, around the clock — without noise, clickbait, or filler.",
    stats: [
      { value: "24/7", label: "non-stop news" },
      { value: "6", label: "topic sections" },
      { value: "10 min", label: "update interval" },
      { value: "2026", label: "founded" },
    ],
    s1title: "Our Mission",
    s1: [
      "Mirakt was built with one goal: to give readers a complete and honest picture of what's happening. We believe quality journalism should be accessible, and important news should find its readers — not the other way around.",
      "Our editorial approach targets people who value their time: business people, students, journalists, and anyone who wants to stay informed about Russia and the world without spending hours each day doing so.",
    ],
    s2title: "How We Work",
    s2: "The Mirakt editorial team works around the clock. The feed refreshes every 10 minutes: editors select the most significant events, verify their relevance, and publish them in the appropriate section. Content is filtered for significance and reliability — we don't publish horoscopes, rumors, or sponsored content.",
    sources: [] as string[],
    s3title: "Coverage",
    s3: "Mirakt covers six key areas: politics, economy, world news, Russia, science and technology, and a dedicated section for Crimea and southern regions. We believe regional news deserves the same attention as the federal agenda.",
    valuesTitle: "Editorial Principles",
    values: [
      { icon: "⚡", title: "Speed", text: "The feed updates every 10 minutes. Breaking news goes live as events unfold." },
      { icon: "✓", title: "Accuracy", text: "We only publish verified information. No rumors, anonymous sources, or unconfirmed claims." },
      { icon: "◈", title: "Priority", text: "Our editorial algorithm evaluates the significance of every event. The most important news always comes first." },
      { icon: "✦", title: "Clean Format", text: "No intrusive banners, pop-ups, or ad traps. The site is built for reading." },
      { icon: "◉", title: "Regional Focus", text: "Special attention to events in Crimea and southern Russia. Regional news is just as important as the federal agenda." },
      { icon: "⊕", title: "Neutrality", text: "We report facts, not opinions. Our editorial team strives for objective coverage." },
    ],
    s4title: "Telegram Channel",
    s4: "Follow the most important news of the day on our official Telegram channel. We publish the hottest and most significant stories — brief, to the point, no fluff. Subscribe and stay informed even without opening the website.",
    tgBtn: "Subscribe to Mirakt",
    s5title: "Technology",
    s5: [
      "Mirakt is built on a modern technology stack: Next.js delivers instant page loads even on slow connections, and our cloud database stores all publications with instant search capabilities.",
      "Our editorial team uses AI-assisted tools to handle high volumes of information, categorize content, and select illustrations. This allows us to operate in real time without sacrificing quality.",
      "Every article is accompanied by a thematic illustration selected to match the content of the story. We ensure the visual presentation aligns with the substance of the news.",
    ],
    s6title: "What's Next",
    s6: [
      "We continue to actively develop the publication. Upcoming plans include expanding regional coverage, deepening international news, and launching a personalized feed tailored to each reader's interests.",
      "Mirakt is evolving into a full-fledged media outlet with original authored content, expert analysis, and in-depth reporting. Our goal is to become the go-to news source for people who value their time.",
    ],
    contactTitle: "Editorial Contacts",
    contactText: "We welcome feedback, partnership proposals, and editorial initiatives. If you'd like to suggest a story, report an error, or discuss a collaboration — write to us. Every message is reviewed personally by the editorial team.",
    contactEmail: "For all inquiries:",
  },
};

export default function AboutPage() {
  const { locale } = useLocale();
  const c = CONTENT[locale];
  const body: React.CSSProperties = { color: "rgba(255,255,255,0.58)", fontSize: 15.5, lineHeight: 1.9 };

  return (
    <main className="mx-auto max-w-2xl px-6 py-24" style={{ fontFamily: "Inter, sans-serif" }}>
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>{c.back}</Link>

      <h1 style={{ fontSize: "clamp(28px, 8vw, 42px)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)", wordBreak: "break-word" }}>
        {c.title}
      </h1>
      <div style={{ width: 56, height: 2, background: GOLD_DIM, marginBottom: 28 }} />
      <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 52, fontWeight: 400 }}>{c.lead}</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 64 }}>
        {c.stats.map(s => <StatBadge key={s.label} value={s.value} label={s.label} />)}
      </div>

      {/* Mission */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.s1title}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {c.s1.map((p, i) => <p key={i} style={body}>{p}</p>)}
        </div>
      </section>

      {/* How we work */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.s2title}</SectionTitle>
        <p style={body}>{c.s2}</p>
      </section>

      {/* Coverage */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.s3title}</SectionTitle>
        <p style={body}>{c.s3}</p>
      </section>

      {/* Values */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.valuesTitle}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {c.values.map(v => <ValueCard key={v.title} icon={v.icon} title={v.title} text={v.text} />)}
        </div>
      </section>

      {/* Telegram */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.s4title}</SectionTitle>
        <div style={{ padding: "28px 30px", background: "rgba(38,116,182,0.07)", border: "1px solid rgba(38,116,182,0.2)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ ...body, margin: 0 }}>{c.s4}</p>
          <a
            href="https://t.me/mirakt_ru"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "11px 22px", borderRadius: 8, fontWeight: 600, fontSize: 14,
              background: "rgba(38,116,182,0.15)", border: "1px solid rgba(38,116,182,0.35)",
              color: "rgba(100,178,255,0.9)", textDecoration: "none", alignSelf: "flex-start",
              transition: "all 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
            </svg>
            {c.tgBtn}
          </a>
        </div>
      </section>

      {/* Technology */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.s5title}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {c.s5.map((p, i) => <p key={i} style={body}>{p}</p>)}
        </div>
      </section>

      {/* Roadmap */}
      <section style={{ marginBottom: 56 }}>
        <SectionTitle>{c.s6title}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {c.s6.map((p, i) => <p key={i} style={body}>{p}</p>)}
        </div>
      </section>

      {/* Contacts */}
      <section>
        <SectionTitle>{c.contactTitle}</SectionTitle>
        <p style={{ ...body, marginBottom: 24 }}>{c.contactText}</p>
        <div style={{ padding: "22px 26px", borderLeft: `2px solid ${GOLD_DIM}`, background: GOLD_BG, borderRadius: "0 10px 10px 0" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            {c.contactEmail}{" "}
            <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a>
          </p>
        </div>
      </section>
    </main>
  );
}
