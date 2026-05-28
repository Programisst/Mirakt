import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с редакцией Mirakt. Мы открыты для сотрудничества, предложений материалов и обратной связи.",
};

const GOLD = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

export default function ContactsPage() {
  return (
    <main
      className="mx-auto max-w-2xl px-6 py-24"
      style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter, sans-serif" }}
    >
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>
        ← На главную
      </Link>

      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>
        Контакты
      </h1>
      <div style={{ width: 48, height: 2, background: GOLD_DIM, marginBottom: 40 }} />

      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.85, marginBottom: 40 }}>
        Мы рады обратной связи от наших читателей. Если у вас есть вопросы, предложения,
        замечания или вы хотите обсудить сотрудничество — напишите нам. Мы стараемся отвечать
        на каждое обращение в течение рабочего дня.
      </p>

      {/* Контактные карточки */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 48 }}>
        <div style={{
          padding: "22px 26px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
            Редакция — общие вопросы
          </div>
          <a href="mailto:mirakt.news@mail.ru" style={{ fontSize: 17, color: GOLD, fontWeight: 600, display: "block", marginBottom: 6 }}>
            mirakt.news@mail.ru
          </a>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            Вопросы, предложения, обратная связь
          </span>
        </div>

        <div style={{
          padding: "22px 26px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
            Сотрудничество и реклама
          </div>
          <a href="mailto:mirakt.news@mail.ru" style={{ fontSize: 17, color: GOLD, fontWeight: 600, display: "block", marginBottom: 6 }}>
            mirakt.news@mail.ru
          </a>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            Партнёрство, размещение материалов, совместные проекты
          </span>
        </div>

        <div style={{
          padding: "22px 26px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
            Режим работы
          </div>
          <span style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", fontWeight: 600, display: "block", marginBottom: 6 }}>
            Круглосуточно, без выходных
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            Лента новостей обновляется в режиме реального времени 24/7
          </span>
        </div>
      </div>

      {/* Что мы принимаем */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: "rgba(255,255,255,0.8)" }}>
          По каким вопросам писать
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "Нашли ошибку или неточность в материале",
            "Хотите предложить новость или тему для публикации",
            "Заинтересованы в рекламном сотрудничестве",
            "Хотите стать автором или партнёром редакции",
            "Есть технические проблемы с сайтом",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>◆</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "20px 24px",
          borderLeft: "2px solid rgba(212,175,55,0.4)",
          background: "rgba(212,175,55,0.04)",
          borderRadius: "0 8px 8px 0",
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.7,
        }}
      >
        Mirakt — независимое издание. Мы не публикуем заказные материалы и придерживаемся
        принципов честной журналистики. Все обращения рассматриваются индивидуально.
      </div>
    </main>
  );
}
