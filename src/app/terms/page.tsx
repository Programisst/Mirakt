"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";
const GOLD_BG  = "rgba(212,175,55,0.04)";
const GOLD_BD  = "rgba(212,175,55,0.12)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>{title}</h2>
      <div style={{ color: "rgba(255,255,255,0.52)", fontSize: 14.5, lineHeight: 1.9 }}>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
      {items.map((item) => (
        <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>◆</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, padding: "14px 18px", background: GOLD_BG, border: `1px solid ${GOLD_BD}`, borderRadius: 8, fontSize: 13.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.75 }}>
      {children}
    </div>
  );
}

const CONTENT = {
  ru: {
    back:    "← На главную",
    title:   "Условия использования",
    updated: "Последнее обновление: 31 мая 2026 года",
    intro:   "Настоящий документ устанавливает правила пользования новостным порталом Mirakt. Пожалуйста, внимательно ознакомьтесь с условиями перед началом использования Сайта.",
    sections: [
      {
        title: "1. Стороны и предмет соглашения",
        body: <>
          <p>Настоящие Условия использования (далее — «Условия», «Соглашение») регулируют правоотношения между новостным интернет-порталом Mirakt, расположенным по адресу <span style={{ color: GOLD }}>mirakt.ru</span> (далее — «Портал», «Сайт», «Мы», «Редакция»), и любым физическим лицом, получающим доступ к материалам и функциям Сайта (далее — «Пользователь», «Вы»).</p>
          <p style={{ marginTop: 12 }}>Портал Mirakt является независимым информационным изданием, действующим в соответствии с законодательством Российской Федерации.</p>
          <Note>Используя Сайт, Вы подтверждаете, что достигли возраста 18 лет, ознакомились с настоящими Условиями в полном объёме и безоговорочно принимаете их. Если Вы не согласны с какими-либо положениями Условий — немедленно прекратите использование Сайта.</Note>
        </>,
      },
      {
        title: "2. Описание сервиса и характер контента",
        body: <>
          <p>Mirakt является новостным агрегатором и информационным порталом. Сайт в автоматизированном режиме собирает, обрабатывает и публикует новостные материалы из открытых RSS-источников ведущих российских средств массовой информации. Кроме того, Сайт публикует собственные редакционные материалы, аналитику и тематические подборки.</p>
          <p style={{ marginTop: 12 }}>Mirakt работает в режиме непрерывного обновления. Новостная лента пополняется каждые 10 минут в автоматическом режиме с применением алгоритмов искусственного интеллекта для обработки и категоризации материалов.</p>
          <p style={{ marginTop: 12 }}>Настоящий Сайт предназначен исключительно для информационных целей. Никакие материалы, размещённые на Сайте, не являются юридической, медицинской, финансовой или иной профессиональной консультацией.</p>
        </>,
      },
      {
        title: "3. Авторские права и интеллектуальная собственность",
        body: <>
          <p>Материалы, агрегируемые из внешних источников, являются собственностью соответствующих средств массовой информации и защищены нормами авторского права. Mirakt отображает краткие изложения и анонсы публикаций со ссылкой на первоисточник в соответствии с нормами свободного цитирования.</p>
          <p style={{ marginTop: 12 }}>Следующие объекты являются исключительной интеллектуальной собственностью редакции Mirakt и охраняются законодательством об авторских правах:</p>
          <Bullets items={[
            "Оригинальные редакционные материалы, авторские тексты и аналитика",
            "Логотип, фирменный стиль и графические элементы оформления",
            "Дизайн интерфейса, пользовательский опыт и структура навигации",
            "Программный код, алгоритмы и техническая архитектура Сайта",
            "Базы данных, структуры данных и алгоритмы агрегации",
          ]} />
          <p style={{ marginTop: 14 }}>Воспроизведение, копирование, распространение, публичное исполнение или иное использование указанных объектов без письменного разрешения редакции Mirakt запрещено.</p>
          <Note>При цитировании материалов Mirakt обязательна активная гиперссылка на соответствующую страницу Сайта. Цитирование допускается в объёме, не превышающем 30% оригинального текста.</Note>
        </>,
      },
      {
        title: "4. Ограничение ответственности редакции",
        body: <>
          <p>Mirakt прилагает все разумные усилия для обеспечения точности и актуальности публикуемых материалов. Вместе с тем редакция не несёт ответственности за:</p>
          <Bullets items={[
            "Достоверность, полноту и актуальность материалов внешних источников (СМИ-партнёров)",
            "Возможный прямой или косвенный ущерб, причинённый в результате использования или невозможности использования Сайта",
            "Действия третьих лиц, в том числе авторов публикаций в агрегируемых источниках",
            "Временную недоступность Сайта или отдельных его функций по техническим причинам",
            "Содержание внешних сайтов, на которые ведут гиперссылки с нашего Сайта",
            "Убытки, возникшие вследствие изменения редакционной политики, ценовой политики или прекращения деятельности Сайта",
            "Ошибки и неточности в автоматически обработанных материалах при использовании алгоритмов ИИ",
          ]} />
          <p style={{ marginTop: 14 }}>Совокупная ответственность Mirakt перед Пользователем по любым основаниям ограничена суммой в 0 рублей, поскольку использование Сайта является бесплатным.</p>
        </>,
      },
      {
        title: "5. Правила поведения пользователей",
        body: <>
          <p>При использовании Сайта категорически запрещается:</p>
          <Bullets items={[
            "Нарушать требования действующего законодательства Российской Федерации и международного права",
            "Распространять через Сайт заведомо ложную, клеветническую или дискредитирующую информацию",
            "Осуществлять сбор данных пользователей или контента Сайта с помощью автоматизированных инструментов (парсинг, скрапинг) без письменного разрешения редакции",
            "Предпринимать попытки несанкционированного доступа к административной части Сайта, базам данных и серверной инфраструктуре",
            "Нагружать Сайт чрезмерными запросами (DDoS-атаки, флуд) или иными способами нарушать его штатную работу",
            "Размещать спам, вирусы, вредоносный код или иные деструктивные элементы в любых формах обратной связи",
            "Выдавать себя за сотрудников редакции, иных пользователей или третьих лиц",
            "Использовать Сайт в коммерческих целях без письменного разрешения редакции",
          ]} />
        </>,
      },
      {
        title: "6. Пользовательские аккаунты и авторизация",
        body: <>
          <p>Ряд функций Сайта доступен только зарегистрированным пользователям. Создавая аккаунт, Вы обязуетесь:</p>
          <Bullets items={[
            "Предоставить достоверные и актуальные сведения при регистрации",
            "Не создавать более одного аккаунта без явного разрешения редакции",
            "Обеспечить конфиденциальность учётных данных и не передавать их третьим лицам",
            "Незамедлительно уведомить редакцию о любом несанкционированном использовании вашего аккаунта",
          ]} />
          <p style={{ marginTop: 14 }}>Редакция оставляет за собой право заблокировать или безвозвратно удалить аккаунт пользователя в следующих случаях:</p>
          <Bullets items={[
            "Нарушение настоящих Условий использования",
            "Длительный период неактивности (более 12 месяцев)",
            "Поступление обоснованных жалоб от третьих лиц",
            "Требование уполномоченных государственных органов",
          ]} />
          <Note>Удаление аккаунта влечёт безвозвратную утрату всех сохранённых данных и настроек пользователя.</Note>
        </>,
      },
      {
        title: "7. Использование файлов cookie и аналитика",
        body: <>
          <p>Сайт использует файлы cookie и аналогичные технологии для обеспечения корректной работы функций, анализа посещаемости и персонализации интерфейса. Продолжая использование Сайта, Вы выражаете согласие на использование cookie в соответствии с нашей <Link href="/konfidencialnost" style={{ color: GOLD }}>Политикой конфиденциальности</Link>.</p>
          <p style={{ marginTop: 12 }}>Для сбора статистики посещаемости мы используем инструменты веб-аналитики. Все аналитические данные обрабатываются в обезличенном виде и не позволяют идентифицировать конкретного пользователя.</p>
        </>,
      },
      {
        title: "8. Внешние ссылки и сторонние ресурсы",
        body: <>
          <p>Сайт содержит гиперссылки на материалы и публикации сторонних СМИ и веб-ресурсов. Мы предоставляем эти ссылки исключительно для удобства читателей и не осуществляем контроль над содержанием связанных сайтов.</p>
          <p style={{ marginTop: 12 }}>Наличие ссылки на сторонний ресурс не означает одобрения или рекомендации его содержания со стороны редакции Mirakt. Редакция не несёт ответственности за содержание, политику конфиденциальности или действия сторонних веб-сайтов.</p>
        </>,
      },
      {
        title: "9. Реклама и коммерческое сотрудничество",
        body: <>
          <p>Сайт может содержать рекламные материалы. Все рекламные публикации обозначаются соответствующей маркировкой и чётко отделены от редакционного контента. Редакция Mirakt несёт ответственность только за соответствие формата рекламы требованиям российского законодательства; содержание рекламных материалов является ответственностью рекламодателя.</p>
          <p style={{ marginTop: 12 }}>По вопросам размещения рекламы и коммерческого партнёрства обращайтесь: <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
        </>,
      },
      {
        title: "10. Прекращение доступа",
        body: <>
          <p>Редакция Mirakt оставляет за собой право в любое время и без предварительного уведомления ограничить или полностью прекратить доступ любого пользователя к Сайту или его отдельным функциям, если это продиктовано:</p>
          <Bullets items={[
            "Нарушением настоящих Условий использования",
            "Необходимостью проведения технического обслуживания",
            "Требованиями законодательства или уполномоченных органов",
            "Иными обоснованными причинами по усмотрению редакции",
          ]} />
        </>,
      },
      {
        title: "11. Изменение условий использования",
        body: <>
          <p>Редакция оставляет за собой право в одностороннем порядке изменять, дополнять или отменять положения настоящих Условий в любое время без предварительного уведомления пользователей. Актуальная версия Условий всегда доступна на данной странице с указанием даты последнего обновления.</p>
          <p style={{ marginTop: 12 }}>Продолжение использования Сайта после публикации изменений означает безоговорочное принятие Вами новой редакции Условий. Если Вы не согласны с изменёнными Условиями, Вы обязаны немедленно прекратить использование Сайта.</p>
          <Note>Рекомендуем периодически проверять данную страницу для ознакомления с актуальной версией Условий.</Note>
        </>,
      },
      {
        title: "12. Применимое право и разрешение споров",
        body: <>
          <p>Настоящие Условия использования составлены и регулируются законодательством Российской Федерации, в том числе Федеральным законом «Об информации, информационных технологиях и о защите информации», Гражданским кодексом РФ и иными применимыми нормативными актами.</p>
          <p style={{ marginTop: 12 }}>Все разногласия и споры, возникающие в связи с использованием Сайта или в связи с настоящими Условиями, стороны обязуются разрешать путём переговоров. В случае невозможности достижения согласия спор передаётся на рассмотрение в компетентный суд по месту нахождения редакции в соответствии с процессуальным законодательством Российской Федерации.</p>
        </>,
      },
      {
        title: "13. Контактная информация",
        body: <>
          <p>По всем вопросам, связанным с настоящими Условиями использования, а также по вопросам авторских прав, редакционной политики и сотрудничества, обращайтесь в редакцию Mirakt:</p>
          <p style={{ marginTop: 12 }}>Электронная почта: <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
          <p style={{ marginTop: 6 }}>Telegram: <a href="https://t.me/mirakt_ru" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>t.me/mirakt_ru</a></p>
          <p style={{ marginTop: 6 }}>Веб-сайт: <span style={{ color: GOLD }}>mirakt.ru</span></p>
          <p style={{ marginTop: 14, color: "rgba(255,255,255,0.35)", fontSize: 13.5 }}>Мы стараемся отвечать на все обращения в течение 3 рабочих дней.</p>
        </>,
      },
    ],
  },
  en: {
    back:    "← Back to home",
    title:   "Terms of Use",
    updated: "Last updated: May 31, 2026",
    intro:   "This document establishes the rules for using the Mirakt news portal. Please read these terms carefully before using the Site.",
    sections: [
      {
        title: "1. Parties and Subject Matter",
        body: <>
          <p>These Terms of Use ("Terms", "Agreement") govern the legal relationship between the Mirakt online news portal, located at <span style={{ color: GOLD }}>mirakt.ru</span> ("Portal", "Site", "We", "Editorial Team"), and any individual accessing the Site's content and features ("User", "You").</p>
          <p style={{ marginTop: 12 }}>The Mirakt portal is an independent news publication operating in accordance with the laws of the Russian Federation.</p>
          <Note>By using the Site, you confirm that you are 18 years of age or older, have read these Terms in full, and accept them unconditionally. If you disagree with any provision, please stop using the Site immediately.</Note>
        </>,
      },
      {
        title: "2. Service Description and Content Nature",
        body: <>
          <p>Mirakt is a news aggregator and information portal. The Site automatically collects, processes, and publishes news content from open RSS feeds of leading Russian media outlets. The Site also publishes original editorial content, analysis, and curated topic selections.</p>
          <p style={{ marginTop: 12 }}>Mirakt operates with continuous updates. The news feed is refreshed every 10 minutes using AI algorithms for processing and categorizing content.</p>
          <p style={{ marginTop: 12 }}>This Site is intended for informational purposes only. No content on the Site constitutes legal, medical, financial, or other professional advice.</p>
        </>,
      },
      {
        title: "3. Copyright and Intellectual Property",
        body: <>
          <p>Content aggregated from external sources belongs to the respective media outlets and is protected by copyright law. Mirakt displays brief summaries and excerpts with links to original sources in accordance with fair use citation norms.</p>
          <p style={{ marginTop: 12 }}>The following are the exclusive intellectual property of Mirakt's editorial team:</p>
          <Bullets items={[
            "Original editorial content, authored texts, and analysis",
            "Logo, brand identity, and graphic design elements",
            "Interface design, user experience, and navigation structure",
            "Source code, algorithms, and technical architecture",
            "Databases, data structures, and aggregation algorithms",
          ]} />
          <Note>Reproduction or use of Mirakt's original content requires an active hyperlink to the source page. Quotes must not exceed 30% of the original text.</Note>
        </>,
      },
      {
        title: "4. Limitation of Liability",
        body: <>
          <p>Mirakt is not liable for:</p>
          <Bullets items={[
            "Accuracy, completeness, or timeliness of external source materials",
            "Direct or indirect damages from using or being unable to use the Site",
            "Actions of third parties, including authors of aggregated publications",
            "Temporary unavailability of the Site or its features",
            "Content of external sites linked from our Site",
            "Losses resulting from changes in editorial policy or cessation of operations",
            "Errors in AI-processed materials",
          ]} />
        </>,
      },
      {
        title: "5. User Conduct",
        body: <>
          <p>When using the Site, you may not:</p>
          <Bullets items={[
            "Violate applicable laws of the Russian Federation or international law",
            "Spread knowingly false, defamatory, or discrediting information",
            "Collect user data or Site content using automated tools without written permission",
            "Attempt unauthorized access to the Site's admin panel, databases, or server infrastructure",
            "Overload the Site with excessive requests (DDoS, flooding)",
            "Post spam, viruses, malicious code, or destructive content in any feedback forms",
            "Impersonate editorial staff, other users, or third parties",
            "Use the Site for commercial purposes without written permission",
          ]} />
        </>,
      },
      {
        title: "6. User Accounts and Authentication",
        body: <>
          <p>Certain Site features are available to registered users only. By creating an account, you agree to provide accurate information, not create duplicate accounts, keep credentials confidential, and notify us of any unauthorized account use.</p>
          <p style={{ marginTop: 12 }}>We reserve the right to block or permanently delete an account for: Terms violations, prolonged inactivity (12+ months), substantiated complaints from third parties, or government authority requirements.</p>
        </>,
      },
      {
        title: "7. Cookies and Analytics",
        body: <p>The Site uses cookies for functionality, analytics, and personalization. By continuing to use the Site, you consent to cookie use per our <Link href="/konfidencialnost" style={{ color: GOLD }}>Privacy Policy</Link>. Analytics data is processed in anonymized form.</p>,
      },
      {
        title: "8. External Links",
        body: <p>The Site links to third-party media and resources for reader convenience. We do not control external sites and are not responsible for their content or privacy practices. Links do not constitute endorsements.</p>,
      },
      {
        title: "9. Advertising",
        body: <p>Advertising content is clearly labeled and separated from editorial content. For advertising and partnerships: <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>,
      },
      {
        title: "10. Termination of Access",
        body: <p>We may restrict or terminate any user's access at any time for Terms violations, maintenance, legal requirements, or other justified reasons.</p>,
      },
      {
        title: "11. Changes to Terms",
        body: <p>We may unilaterally update these Terms at any time. The current version is always on this page with the update date. Continued use constitutes acceptance of revised Terms.</p>,
      },
      {
        title: "12. Governing Law and Disputes",
        body: <p>These Terms are governed by Russian Federation law. Disputes shall first be resolved through negotiation; unresolved disputes are submitted to a competent court at the editorial team's location.</p>,
      },
      {
        title: "13. Contact Information",
        body: <>
          <p>For all inquiries regarding these Terms, copyright, editorial policy, and partnerships:</p>
          <p style={{ marginTop: 12 }}>Email: <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
          <p style={{ marginTop: 6 }}>Telegram: <a href="https://t.me/mirakt_ru" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>t.me/mirakt_ru</a></p>
          <p style={{ marginTop: 6 }}>Website: <span style={{ color: GOLD }}>mirakt.ru</span></p>
        </>,
      },
    ],
  },
};

export default function TermsPage() {
  const { locale } = useLocale();
  const c = CONTENT[locale];

  return (
    <main className="mx-auto max-w-2xl px-6 py-24" style={{ fontFamily: "Inter, sans-serif" }}>
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>{c.back}</Link>

      <h1 style={{ fontSize: "clamp(24px, 7vw, 38px)", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.94)", wordBreak: "break-word" }}>
        {c.title}
      </h1>
      <div style={{ width: 48, height: 2, background: GOLD_DIM, marginBottom: 12 }} />
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>{c.updated}</p>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 52, padding: "18px 20px", background: GOLD_BG, border: `1px solid ${GOLD_BD}`, borderRadius: 10 }}>{c.intro}</p>

      {c.sections.map((s) => (
        <Section key={s.title} title={s.title}>{s.body}</Section>
      ))}
    </main>
  );
}
