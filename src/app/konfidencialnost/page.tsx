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
    title:   "Политика конфиденциальности",
    updated: "Последнее обновление: 1 января 2026 года",
    sections: [
      {
        title: "1. Общие положения",
        body: <>
          <p>Настоящая Политика конфиденциальности описывает, какие данные собирает новостной портал Mirakt (далее — «Сайт», «мы»), расположенный по адресу <span style={{ color: GOLD }}>mirakt.ru</span>, как мы их используем и защищаем.</p>
          <p style={{ marginTop: 12 }}>Используя Сайт, вы подтверждаете, что ознакомились с настоящей Политикой и соглашаетесь с её условиями. Если вы не согласны с условиями — пожалуйста, прекратите использование Сайта.</p>
        </>,
      },
      {
        title: "2. Какие данные мы собираем",
        body: <>
          <p style={{ marginBottom: 12 }}>Мы собираем следующие технические данные при посещении Сайта:</p>
          <Bullets items={[
            "IP-адрес устройства (в обезличенной форме)",
            "Тип браузера и операционная система",
            "Страница, с которой вы перешли на Сайт (реферер)",
            "Страницы Сайта, которые вы посещаете",
            "Дата и время визита",
            "Страна и город (определяется по IP-адресу приблизительно)",
          ]} />
          <p style={{ marginTop: 12 }}>Если вы регистрируетесь на Сайте, мы также храним ваш адрес электронной почты, имя пользователя и данные профиля, которые вы указываете самостоятельно.</p>
        </>,
      },
      {
        title: "3. Как мы используем данные",
        body: <>
          <p style={{ marginBottom: 12 }}>Собранные данные используются исключительно в следующих целях:</p>
          <Bullets items={[
            "Обеспечение работы и безопасности Сайта",
            "Анализ посещаемости и улучшение качества сервиса",
            "Персонализация интерфейса (например, сохранение выбранной категории новостей)",
            "Поддержка авторизации зарегистрированных пользователей",
            "Предотвращение мошеннических действий и злоупотреблений",
          ]} />
        </>,
      },
      {
        title: "4. Файлы cookie",
        body: <>
          <p>Сайт использует файлы cookie — небольшие текстовые файлы, которые сохраняются в вашем браузере. Мы используем cookie для:</p>
          <p style={{ marginTop: 10, marginBottom: 10 }}>— поддержания сессии авторизованного пользователя;<br />— сохранения пользовательских настроек;<br />— сбора анонимной аналитики о посещаемости.</p>
          <p>Вы можете отключить cookie в настройках браузера, однако некоторые функции Сайта могут перестать работать корректно.</p>
        </>,
      },
      {
        title: "5. Передача данных третьим лицам",
        body: <>
          <p>Мы не продаём и не передаём ваши персональные данные третьим лицам в коммерческих целях. Данные могут быть переданы только в следующих случаях:</p>
          <p style={{ marginTop: 10 }}>— по требованию суда или уполномоченных государственных органов Российской Федерации;<br />— для защиты наших законных прав и интересов;<br />— с вашего явного согласия.</p>
          <p style={{ marginTop: 10 }}>Для аналитики мы используем сервис Plausible Analytics, который работает без использования файлов cookie и не передаёт данные рекламным сетям.</p>
        </>,
      },
      {
        title: "6. Защита данных",
        body: <>
          <p>Мы принимаем разумные технические меры для защиты ваших данных от несанкционированного доступа, изменения или уничтожения. Передача данных между вашим браузером и нашим сервером осуществляется по защищённому протоколу HTTPS.</p>
          <p style={{ marginTop: 10 }}>Вместе с тем ни один способ передачи данных через интернет не является абсолютно безопасным, и мы не можем гарантировать стопроцентную защиту.</p>
        </>,
      },
      {
        title: "7. Права пользователей",
        body: <>
          <p style={{ marginBottom: 10 }}>В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» вы имеете право:</p>
          <Bullets items={[
            "Запросить информацию о том, какие данные мы о вас храним",
            "Потребовать исправления неточных данных",
            "Потребовать удаления ваших персональных данных",
            "Отозвать согласие на обработку данных",
          ]} />
          <p style={{ marginTop: 10 }}>Для реализации ваших прав обратитесь к нам по адресу:{" "}<a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
        </>,
      },
      {
        title: "8. Изменения политики",
        body: <p>Мы оставляем за собой право вносить изменения в настоящую Политику. Актуальная версия всегда доступна на этой странице. При существенных изменениях мы уведомим пользователей, разместив соответствующее сообщение на Сайте.</p>,
      },
      {
        title: "9. Связь с нами",
        body: <>
          <p>По всем вопросам, связанным с обработкой персональных данных, обращайтесь в службу поддержки по электронной почте:{" "}<a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
          <p style={{ marginTop: 10 }}>Мы рассматриваем все обращения в течение 3 рабочих дней и обязуемся предоставить полный ответ на ваш запрос.</p>
        </>,
      },
    ],
  },
  en: {
    back:    "← Back to home",
    title:   "Privacy Policy",
    updated: "Last updated: January 1, 2026",
    sections: [
      {
        title: "1. General Provisions",
        body: <>
          <p>This Privacy Policy describes what data is collected by the Mirakt news portal ("Site", "we"), located at <span style={{ color: GOLD }}>mirakt.ru</span>, how we use it and how we protect it.</p>
          <p style={{ marginTop: 12 }}>By using the Site, you confirm that you have read this Policy and agree to its terms. If you do not agree, please stop using the Site.</p>
        </>,
      },
      {
        title: "2. Data We Collect",
        body: <>
          <p style={{ marginBottom: 12 }}>We collect the following technical data when you visit the Site:</p>
          <Bullets items={[
            "Device IP address (in anonymized form)",
            "Browser type and operating system",
            "Page you came from (referrer)",
            "Pages of the Site you visit",
            "Date and time of visit",
            "Country and city (determined approximately by IP address)",
          ]} />
          <p style={{ marginTop: 12 }}>If you register on the Site, we also store your email address, username, and profile information that you provide yourself.</p>
        </>,
      },
      {
        title: "3. How We Use Data",
        body: <>
          <p style={{ marginBottom: 12 }}>Collected data is used exclusively for the following purposes:</p>
          <Bullets items={[
            "Ensuring the operation and security of the Site",
            "Analyzing traffic and improving service quality",
            "Personalizing the interface (e.g., remembering your chosen news category)",
            "Supporting authentication for registered users",
            "Preventing fraud and abuse",
          ]} />
        </>,
      },
      {
        title: "4. Cookies",
        body: <>
          <p>The Site uses cookies — small text files stored in your browser. We use cookies to:</p>
          <p style={{ marginTop: 10, marginBottom: 10 }}>— maintain the session of a logged-in user;<br />— save user preferences;<br />— collect anonymous analytics on site traffic.</p>
          <p>You can disable cookies in your browser settings, but some features of the Site may stop working correctly.</p>
        </>,
      },
      {
        title: "5. Sharing Data with Third Parties",
        body: <>
          <p>We do not sell or share your personal data with third parties for commercial purposes. Data may only be shared in the following cases:</p>
          <p style={{ marginTop: 10 }}>— at the request of a court or authorized government bodies of the Russian Federation;<br />— to protect our legal rights and interests;<br />— with your explicit consent.</p>
          <p style={{ marginTop: 10 }}>For analytics we use Plausible Analytics, which operates without cookies and does not share data with advertising networks.</p>
        </>,
      },
      {
        title: "6. Data Security",
        body: <>
          <p>We take reasonable technical measures to protect your data from unauthorized access, modification, or destruction. Data is transmitted between your browser and our server over the secure HTTPS protocol.</p>
          <p style={{ marginTop: 10 }}>However, no method of data transmission over the internet is completely secure, and we cannot guarantee absolute protection.</p>
        </>,
      },
      {
        title: "7. User Rights",
        body: <>
          <p style={{ marginBottom: 10 }}>In accordance with applicable data protection laws, you have the right to:</p>
          <Bullets items={[
            "Request information about what data we hold about you",
            "Request correction of inaccurate data",
            "Request deletion of your personal data",
            "Withdraw consent to data processing",
          ]} />
          <p style={{ marginTop: 10 }}>To exercise your rights, contact us at:{" "}<a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
        </>,
      },
      {
        title: "8. Policy Changes",
        body: <p>We reserve the right to update this Policy. The current version is always available on this page. For significant changes, we will notify users by posting a notice on the Site.</p>,
      },
      {
        title: "9. Contact Us",
        body: <>
          <p>For all questions related to personal data processing, contact our support team at:{" "}<a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
          <p style={{ marginTop: 10 }}>We review all requests within 3 business days and commit to providing a full response.</p>
        </>,
      },
    ],
  },
};

export default function PrivacyPage() {
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
