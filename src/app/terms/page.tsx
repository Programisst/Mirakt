"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 14 }}>{title}</h2>
      <div style={{ color: "rgba(255,255,255,0.52)", fontSize: 15, lineHeight: 1.85 }}>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item) => (
        <div key={item} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
          <span style={{ color: GOLD, flexShrink: 0 }}>◆</span>{item}
        </div>
      ))}
    </>
  );
}

const CONTENT = {
  ru: {
    back:    "← На главную",
    title:   "Условия использования",
    updated: "Последнее обновление: 1 января 2026 года",
    sections: [
      {
        title: "1. Принятие условий",
        body: <>
          <p>Настоящие Условия использования (далее — «Условия») регулируют отношения между новостным порталом Mirakt (далее — «Сайт»), расположенным по адресу <span style={{ color: GOLD }}>mirakt.ru</span>, и пользователями Сайта.</p>
          <p style={{ marginTop: 12 }}>Используя Сайт, вы подтверждаете, что вам исполнилось 18 лет, вы ознакомились с настоящими Условиями и безоговорочно принимаете их. Если вы не согласны с какими-либо пунктами — пожалуйста, прекратите использование Сайта.</p>
        </>,
      },
      {
        title: "2. Описание сервиса",
        body: <>
          <p>Mirakt является новостным агрегатором и информационным порталом. Сайт в автоматическом режиме собирает и отображает публикации из открытых RSS-источников ведущих российских средств массовой информации, а также публикует собственные редакционные материалы.</p>
          <p style={{ marginTop: 12 }}>Сайт работает в режиме реального времени и обновляет ленту новостей непрерывно. Мы не гарантируем бесперебойную доступность Сайта и оставляем за собой право проводить технические работы без предварительного уведомления.</p>
        </>,
      },
      {
        title: "3. Авторские права и интеллектуальная собственность",
        body: <>
          <p>Новости, агрегируемые из внешних источников, являются собственностью соответствующих СМИ и защищены авторским правом. Mirakt отображает краткие анонсы со ссылкой на оригинальный источник — в соответствии с нормами цитирования.</p>
          <p style={{ marginTop: 12 }}>Оригинальные редакционные материалы, логотип, дизайн и программный код Сайта являются интеллектуальной собственностью Mirakt. Копирование, воспроизведение или использование этих материалов без письменного разрешения запрещено.</p>
          <p style={{ marginTop: 12 }}>При цитировании материалов Mirakt обязательна активная гиперссылка на источник.</p>
        </>,
      },
      {
        title: "4. Ограничение ответственности",
        body: <>
          <p style={{ marginBottom: 10 }}>Mirakt не несёт ответственности за:</p>
          <Bullets items={[
            "Содержание, точность и достоверность материалов внешних источников (СМИ)",
            "Возможный ущерб, возникший в результате использования или невозможности использования Сайта",
            "Действия третьих лиц, связанные с публикациями в агрегируемых источниках",
            "Временную недоступность Сайта по техническим причинам",
            "Содержание внешних сайтов, на которые ведут ссылки с нашего Сайта",
          ]} />
        </>,
      },
      {
        title: "5. Правила поведения пользователей",
        body: <>
          <p style={{ marginBottom: 10 }}>При использовании Сайта запрещается:</p>
          <Bullets items={[
            "Нарушать действующее законодательство Российской Федерации",
            "Распространять заведомо ложную информацию",
            "Использовать автоматические средства для сбора данных (парсинг) без разрешения",
            "Предпринимать попытки взлома или нарушения работы Сайта",
            "Размещать спам или вредоносный контент в комментариях и формах обратной связи",
          ]} />
        </>,
      },
      {
        title: "6. Пользовательские аккаунты",
        body: <>
          <p>Для доступа к некоторым функциям Сайта требуется регистрация. При создании аккаунта вы обязуетесь предоставить достоверную информацию и нести ответственность за безопасность своих учётных данных.</p>
          <p style={{ marginTop: 12 }}>Мы оставляем за собой право заблокировать или удалить аккаунт пользователя в случае нарушения настоящих Условий без предварительного уведомления.</p>
        </>,
      },
      {
        title: "7. Изменение условий",
        body: <p>Мы оставляем за собой право в любое время изменять настоящие Условия. Актуальная версия всегда размещена на этой странице с указанием даты обновления. Продолжение использования Сайта после публикации изменений означает ваше согласие с новыми условиями.</p>,
      },
      {
        title: "8. Применимое право",
        body: <p>Настоящие Условия регулируются законодательством Российской Федерации. Все споры, возникающие в связи с использованием Сайта, подлежат рассмотрению в соответствии с действующим российским законодательством.</p>,
      },
      {
        title: "9. Связь с нами",
        body: <p>По вопросам, связанным с условиями использования Сайта, обращайтесь:{" "}<a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>,
      },
    ],
  },
  en: {
    back:    "← Back to home",
    title:   "Terms of Use",
    updated: "Last updated: January 1, 2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        body: <>
          <p>These Terms of Use ("Terms") govern the relationship between the Mirakt news portal ("Site"), located at <span style={{ color: GOLD }}>mirakt.ru</span>, and its users.</p>
          <p style={{ marginTop: 12 }}>By using the Site, you confirm that you are at least 18 years old, have read these Terms, and accept them unconditionally. If you disagree with any part, please stop using the Site.</p>
        </>,
      },
      {
        title: "2. Description of Service",
        body: <>
          <p>Mirakt is a news aggregator and information portal. The Site automatically collects and displays articles from open RSS feeds of leading Russian media outlets, and also publishes original editorial content.</p>
          <p style={{ marginTop: 12 }}>The Site operates in real time and updates the news feed continuously. We do not guarantee uninterrupted availability and reserve the right to perform maintenance without prior notice.</p>
        </>,
      },
      {
        title: "3. Copyright and Intellectual Property",
        body: <>
          <p>News aggregated from external sources belongs to the respective media outlets and is protected by copyright. Mirakt displays brief summaries with a link to the original source, in accordance with fair-use citation norms.</p>
          <p style={{ marginTop: 12 }}>Original editorial content, the logo, design, and source code of the Site are the intellectual property of Mirakt. Copying, reproducing, or using these materials without written permission is prohibited.</p>
          <p style={{ marginTop: 12 }}>When quoting Mirakt materials, an active hyperlink to the source is required.</p>
        </>,
      },
      {
        title: "4. Limitation of Liability",
        body: <>
          <p style={{ marginBottom: 10 }}>Mirakt is not liable for:</p>
          <Bullets items={[
            "The content, accuracy, or reliability of materials from external sources (media outlets)",
            "Any damage arising from the use or inability to use the Site",
            "Actions of third parties related to publications in aggregated sources",
            "Temporary unavailability of the Site for technical reasons",
            "The content of external websites linked from our Site",
          ]} />
        </>,
      },
      {
        title: "5. User Conduct",
        body: <>
          <p style={{ marginBottom: 10 }}>When using the Site, you may not:</p>
          <Bullets items={[
            "Violate applicable laws of the Russian Federation",
            "Spread knowingly false information",
            "Use automated tools to collect data (scraping) without permission",
            "Attempt to hack or disrupt the operation of the Site",
            "Post spam or malicious content in comments or contact forms",
          ]} />
        </>,
      },
      {
        title: "6. User Accounts",
        body: <>
          <p>Access to certain Site features requires registration. By creating an account, you agree to provide accurate information and take responsibility for the security of your credentials.</p>
          <p style={{ marginTop: 12 }}>We reserve the right to block or delete a user account for violations of these Terms without prior notice.</p>
        </>,
      },
      {
        title: "7. Changes to Terms",
        body: <p>We reserve the right to modify these Terms at any time. The current version is always available on this page with the date of the last update. Continued use of the Site after changes are published constitutes your agreement to the new terms.</p>,
      },
      {
        title: "8. Governing Law",
        body: <p>These Terms are governed by the laws of the Russian Federation. All disputes arising in connection with the use of the Site shall be resolved in accordance with applicable Russian law.</p>,
      },
      {
        title: "9. Contact Us",
        body: <p>For questions related to the Terms of Use, contact us at:{" "}<a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>,
      },
    ],
  },
};

export default function TermsPage() {
  const { locale } = useLocale();
  const c = CONTENT[locale];

  return (
    <main className="mx-auto max-w-2xl px-6 py-24" style={{ fontFamily: "Inter, sans-serif" }}>
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>
        {c.back}
      </Link>
      <h1 style={{ fontSize: "clamp(24px, 7vw, 36px)", fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)", wordBreak: "break-word" }}>
        {c.title}
      </h1>
      <div style={{ width: 48, height: 2, background: GOLD_DIM, marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginBottom: 48 }}>{c.updated}</p>
      {c.sections.map((s) => (
        <Section key={s.title} title={s.title}>{s.body}</Section>
      ))}
    </main>
  );
}
