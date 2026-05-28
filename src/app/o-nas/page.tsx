import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Mirakt — независимый новостной портал России. Мы собираем актуальные новости из проверенных источников и доставляем их читателю в удобном формате.",
};

const GOLD = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

export default function AboutPage() {
  return (
    <main
      className="mx-auto max-w-2xl px-6 py-24"
      style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter, sans-serif" }}
    >
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>
        ← На главную
      </Link>

      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>
        О нас
      </h1>
      <div style={{ width: 48, height: 2, background: GOLD_DIM, marginBottom: 40 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24, color: "rgba(255,255,255,0.62)", fontSize: 16, lineHeight: 1.85 }}>

        <p>
          <strong style={{ color: "rgba(255,255,255,0.9)" }}>Mirakt</strong> — независимый
          российский новостной портал, созданный для тех, кто хочет быть в курсе главных событий
          страны и мира без лишнего шума и информационного мусора. Мы работаем в режиме реального
          времени и обновляем ленту круглосуточно.
        </p>

        <p>
          Наша редакция агрегирует новости из ведущих российских изданий — РИА Новости, ТАСС,
          Лента.ру, Интерфакс, Коммерсантъ, Ведомости и других проверенных источников. Мы не
          придумываем заголовки и не искажаем факты — только актуальная информация в том виде,
          в котором она поступает от первоисточников.
        </p>

        <p>
          Особое место в нашей работе занимают новости Крыма и южных регионов России. Мы убеждены,
          что события на полуострове заслуживают такого же пристального внимания, как и федеральная
          повестка, — и отражаем это в структуре нашего издания.
        </p>

        {/* Блок с ценностями */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "8px 0" }}>
          {[
            { title: "Оперативность", text: "Лента обновляется каждые 5 минут. Вы узнаёте о событиях одними из первых." },
            { title: "Достоверность", text: "Только проверенные федеральные и региональные источники — никакого фейка." },
            { title: "Удобство", text: "Чистый интерфейс без навязчивой рекламы и баннеров. Читать — удовольствие." },
            { title: "Широкий охват", text: "Политика, экономика, наука, мир — все ключевые темы в одном месте." },
          ].map(({ title, text }) => (
            <div
              key={title}
              style={{
                padding: "18px 20px",
                background: "rgba(212,175,55,0.03)",
                border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{text}</div>
            </div>
          ))}
        </div>

        <p>
          Mirakt — это не просто агрегатор. Мы развиваем собственную редакционную политику:
          публикуем авторские материалы, готовим тематические подборки и аналитику по ключевым
          темам. Наша цель — стать главным новостным ресурсом для жителей России, которые ценят
          своё время и хотят получать информацию быстро и без лишних усилий.
        </p>

        <p>
          Мы открыты для диалога. Если вы хотите предложить материал, сообщить об ошибке или
          обсудить сотрудничество — напишите нам. Мы читаем каждое письмо.
        </p>

        <div
          style={{
            marginTop: 8,
            padding: "20px 24px",
            borderLeft: "2px solid rgba(212,175,55,0.4)",
            background: "rgba(212,175,55,0.04)",
            borderRadius: "0 8px 8px 0",
          }}
        >
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
            По вопросам сотрудничества и редакционным предложениям:{" "}
            <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>
              mirakt.news@mail.ru
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
