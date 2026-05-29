"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

const CONTENT = {
  ru: {
    back:  "← На главную",
    title: "Контакты",
    intro: "Мы рады обратной связи от наших читателей. Если у вас есть вопросы, предложения, замечания или вы хотите обсудить сотрудничество — напишите нам. Мы стараемся отвечать на каждое обращение в течение рабочего дня.",
    cards: [
      { label: "Редакция — общие вопросы",   desc: "Вопросы, предложения, обратная связь" },
      { label: "Сотрудничество и реклама",   desc: "Партнёрство, размещение материалов, совместные проекты" },
      { label: "Режим работы",               value: "Круглосуточно, без выходных", desc: "Лента новостей обновляется в режиме реального времени 24/7" },
    ],
    topicsTitle: "По каким вопросам писать",
    topics: [
      "Нашли ошибку или неточность в материале",
      "Хотите предложить новость или тему для публикации",
      "Заинтересованы в рекламном сотрудничестве",
      "Хотите стать автором или партнёром редакции",
      "Есть технические проблемы с сайтом",
    ],
    disclaimer: "Mirakt — независимое издание. Мы не публикуем заказные материалы и придерживаемся принципов честной журналистики. Все обращения рассматриваются индивидуально.",
  },
  en: {
    back:  "← Back to home",
    title: "Contacts",
    intro: "We welcome feedback from our readers. If you have questions, suggestions, comments, or want to discuss partnership — write to us. We aim to respond to every message within one business day.",
    cards: [
      { label: "Editorial — general inquiries", desc: "Questions, suggestions, feedback" },
      { label: "Partnership & advertising",     desc: "Partnership, content placement, joint projects" },
      { label: "Working hours",                 value: "24 / 7, no days off", desc: "The news feed updates in real time around the clock" },
    ],
    topicsTitle: "What to write about",
    topics: [
      "Found an error or inaccuracy in an article",
      "Want to suggest a news story or topic",
      "Interested in advertising partnership",
      "Want to become an author or editorial partner",
      "Experiencing technical issues with the site",
    ],
    disclaimer: "Mirakt is an independent publication. We do not publish paid content and adhere to the principles of honest journalism. All inquiries are considered individually.",
  },
};

export default function ContactsPage() {
  const { locale } = useLocale();
  const c = CONTENT[locale];

  return (
    <main className="mx-auto max-w-2xl px-6 py-24"
      style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter, sans-serif" }}>
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>
        {c.back}
      </Link>

      <h1 style={{ fontSize: "clamp(24px, 7vw, 36px)", fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em", wordBreak: "break-word" }}>{c.title}</h1>
      <div style={{ width: 48, height: 2, background: GOLD_DIM, marginBottom: 40 }} />

      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.85, marginBottom: 40 }}>{c.intro}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 48 }}>
        {c.cards.map((card, i) => (
          <div key={i} style={{ padding: "22px 26px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
              {card.label}
            </div>
            {"value" in card
              ? <span style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", fontWeight: 600, display: "block", marginBottom: 6 }}>{card.value}</span>
              : <a href="mailto:mirakt.news@mail.ru" style={{ fontSize: 17, color: GOLD, fontWeight: 600, display: "block", marginBottom: 6 }}>mirakt.news@mail.ru</a>
            }
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{card.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: "rgba(255,255,255,0.8)" }}>{c.topicsTitle}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {c.topics.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>◆</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px", borderLeft: "2px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.04)", borderRadius: "0 8px 8px 0", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
        {c.disclaimer}
      </div>
    </main>
  );
}
