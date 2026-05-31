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
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{title}</h2>
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

function TableRow({ cells }: { cells: [string, string, string] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {cells.map((c, i) => (
        <div key={i} style={{ padding: "10px 12px", fontSize: 13, color: i === 0 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)" }}>{c}</div>
      ))}
    </div>
  );
}

const CONTENT = {
  ru: {
    back:    "← На главную",
    title:   "Политика конфиденциальности",
    updated: "Последнее обновление: 31 мая 2026 года",
    intro:   "Настоящая Политика конфиденциальности описывает, какие персональные и технические данные собирает и обрабатывает новостной портал Mirakt, с какой целью, на каком основании и каким образом мы их защищаем. Мы придерживаемся принципов минимизации данных и прозрачности.",
    sections: [
      {
        title: "1. Общие положения и область применения",
        body: <>
          <p>Настоящая Политика конфиденциальности (далее — «Политика») разработана редакцией новостного портала Mirakt, доступного по адресу <span style={{ color: GOLD }}>mirakt.ru</span> (далее — «Портал», «Мы»), и определяет порядок сбора, хранения, использования и защиты данных пользователей (далее — «Вы», «Пользователь»).</p>
          <p style={{ marginTop: 12 }}>Настоящая Политика разработана в соответствии с:</p>
          <Bullets items={[
            "Федеральным законом № 152-ФЗ «О персональных данных»",
            "Федеральным законом № 149-ФЗ «Об информации, информационных технологиях и о защите информации»",
            "Общим регламентом о защите данных ЕС (GDPR) — в части пользователей из стран Европейского союза",
            "Иными применимыми нормативными актами Российской Федерации",
          ]} />
          <p style={{ marginTop: 14 }}>Политика распространяется на все страницы и функции Сайта mirakt.ru, включая мобильную версию. Используя Сайт, Вы подтверждаете согласие с условиями настоящей Политики.</p>
          <Note>Если Вам не исполнилось 18 лет, пожалуйста, используйте Сайт только с ведома и согласия родителей или законных представителей.</Note>
        </>,
      },
      {
        title: "2. Какие данные мы собираем",
        body: <>
          <p style={{ marginBottom: 14 }}><strong style={{ color: "rgba(255,255,255,0.7)" }}>2.1. Технические данные (собираются автоматически)</strong></p>
          <p>При каждом посещении Сайта наши серверы автоматически фиксируют следующие технические сведения:</p>
          <Bullets items={[
            "IP-адрес устройства (хранится в обезличенной форме с усечением последнего октета)",
            "Тип и версия браузера, операционная система устройства",
            "Реферальный URL — адрес страницы, с которой Вы перешли на Сайт",
            "Запрошенные страницы, разделы и материалы Сайта",
            "Дата, время и продолжительность визита",
            "Страна и приблизительный город (определяются по IP-адресу, точность ±50 км)",
            "Разрешение экрана и тип устройства (десктоп / мобильный / планшет)",
          ]} />
          <p style={{ marginTop: 18 }}><strong style={{ color: "rgba(255,255,255,0.7)" }}>2.2. Данные зарегистрированных пользователей</strong></p>
          <p style={{ marginTop: 8 }}>При создании аккаунта мы запрашиваем и храним:</p>
          <Bullets items={[
            "Адрес электронной почты (обязательно, используется для авторизации и уведомлений)",
            "Имя пользователя / псевдоним (обязательно)",
            "Аватар профиля (по желанию, загружается пользователем самостоятельно)",
            "Дата и время регистрации аккаунта",
            "Дата и время последнего входа на Сайт",
            "Статус верификации аккаунта",
          ]} />
          <p style={{ marginTop: 18 }}><strong style={{ color: "rgba(255,255,255,0.7)" }}>2.3. Данные, которые мы НЕ собираем</strong></p>
          <p style={{ marginTop: 8 }}>Мы принципиально не собираем и не запрашиваем:</p>
          <Bullets items={[
            "Полное имя, фамилию, отчество пользователя",
            "Дату рождения и возраст",
            "Номер телефона",
            "Платёжные данные, реквизиты банковских карт",
            "Адрес проживания или паспортные данные",
            "Биометрические данные",
          ]} />
        </>,
      },
      {
        title: "3. Правовые основания и цели обработки данных",
        body: <>
          <p style={{ marginBottom: 14 }}>Мы обрабатываем данные пользователей на следующих правовых основаниях:</p>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "rgba(212,175,55,0.08)", padding: "10px 12px" }}>
              {["Цель обработки", "Правовое основание", "Срок хранения"].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            <TableRow cells={["Обеспечение работы Сайта", "Законный интерес", "Сессия"]} />
            <TableRow cells={["Авторизация пользователей", "Договор", "Срок действия аккаунта"]} />
            <TableRow cells={["Аналитика посещаемости", "Законный интерес", "90 дней"]} />
            <TableRow cells={["Предотвращение злоупотреблений", "Законный интерес", "12 месяцев"]} />
            <TableRow cells={["Ответы на обращения", "Договор / Согласие", "3 года"]} />
            <TableRow cells={["Уведомления (при согласии)", "Согласие", "До отзыва"]} />
          </div>
        </>,
      },
      {
        title: "4. Файлы cookie и аналогичные технологии",
        body: <>
          <p>Сайт использует файлы cookie — небольшие текстовые файлы, сохраняемые в браузере пользователя. Мы применяем следующие категории cookie:</p>

          <p style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Необходимые cookie</p>
          <p>Обязательные для базовой работы Сайта. Нельзя отключить без нарушения функциональности. Хранятся в течение сессии или до 30 дней.</p>
          <Bullets items={[
            "Токен авторизации зарегистрированного пользователя",
            "CSRF-токен для защиты от межсайтовых атак",
            "Настройка языка интерфейса (RU / EN)",
          ]} />

          <p style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Аналитические cookie</p>
          <p>Используются для сбора обезличенной статистики посещаемости в целях улучшения Сайта. Вы можете отказаться от них через настройки браузера.</p>
          <Bullets items={[
            "Идентификатор сессии (обезличенный)",
            "Счётчик страниц за сессию",
            "Время на сайте и глубина прокрутки",
          ]} />

          <Note>Большинство браузеров позволяют управлять cookie через настройки. Отключение необходимых cookie может привести к некорректной работе авторизации и пользовательских настроек.</Note>
        </>,
      },
      {
        title: "5. Использование и хранение данных",
        body: <>
          <p>Собранные данные используются исключительно в следующих целях:</p>
          <Bullets items={[
            "Обеспечение технической работы и безопасности Сайта",
            "Идентификация и авторизация зарегистрированных пользователей",
            "Анализ посещаемости и улучшение качества и удобства сервиса",
            "Предотвращение мошеннических действий, спама и технических злоупотреблений",
            "Формирование анонимной статистики для внутренней аналитики редакции",
            "Ответы на запросы и обращения пользователей",
          ]} />
          <p style={{ marginTop: 14 }}>Данные пользователей хранятся на серверах Supabase (европейская инфраструктура) и обрабатываются только сотрудниками редакции Mirakt. Мы не продаём, не сдаём в аренду и не передаём персональные данные третьим лицам в коммерческих целях.</p>
        </>,
      },
      {
        title: "6. Передача данных третьим лицам",
        body: <>
          <p>Мы привлекаем ограниченный круг сторонних поставщиков услуг, которым может быть предоставлен доступ к техническим данным исключительно в объёме, необходимом для выполнения их функций:</p>
          <Bullets items={[
            "Supabase Inc. — хранение базы данных пользователей и статей (США / ЕС, GDPR-совместимо)",
            "Vercel Inc. — хостинг и серверная инфраструктура (США, соответствие SOC 2)",
            "Pexels GmbH — подбор изображений для статей по ключевым словам",
            "Groq Inc. — обработка текстов статей алгоритмами ИИ (обезличенно)",
          ]} />
          <p style={{ marginTop: 14 }}>Все перечисленные поставщики связаны обязательствами по конфиденциальности и не вправе использовать полученные данные в собственных коммерческих целях.</p>
          <p style={{ marginTop: 12 }}>Данные могут быть раскрыты государственным органам исключительно:</p>
          <Bullets items={[
            "На основании вступившего в законную силу судебного акта",
            "По требованию уполномоченных государственных органов в пределах их компетенции",
            "В целях защиты жизни, здоровья или законных прав и интересов пользователей",
          ]} />
        </>,
      },
      {
        title: "7. Безопасность данных",
        body: <>
          <p>Мы применяем комплекс технических и организационных мер для защиты данных пользователей:</p>
          <Bullets items={[
            "Шифрование всех соединений по протоколу TLS 1.3 (HTTPS)",
            "Хранение паролей исключительно в виде криптографических хэшей (bcrypt)",
            "Разграничение прав доступа сотрудников к базам данных по принципу минимальных привилегий",
            "Регулярное резервное копирование данных с шифрованием резервных копий",
            "Мониторинг подозрительной активности и попыток несанкционированного доступа",
            "Регулярное обновление программного обеспечения и устранение уязвимостей",
          ]} />
          <p style={{ marginTop: 14 }}>В случае обнаружения утечки или компрометации данных мы обязуемся уведомить затронутых пользователей в течение 72 часов с момента выявления инцидента.</p>
          <Note>Ни один способ передачи данных через сеть интернет не обеспечивает абсолютной защиты. Используйте надёжный пароль и не передавайте учётные данные третьим лицам.</Note>
        </>,
      },
      {
        title: "8. Права пользователей в отношении их данных",
        body: <>
          <p>В соответствии с Федеральным законом № 152-ФЗ и применимым законодательством Вы имеете следующие права:</p>
          <Bullets items={[
            "Право на доступ — получить информацию о том, какие Ваши данные мы обрабатываем",
            "Право на исправление — потребовать устранения неточностей в хранимых данных",
            "Право на удаление («право на забвение») — потребовать удаления Ваших персональных данных",
            "Право на ограничение обработки — приостановить обработку данных в установленных случаях",
            "Право на переносимость — получить свои данные в структурированном машиночитаемом формате",
            "Право на отзыв согласия — отозвать ранее данное согласие на обработку данных в любой момент",
            "Право на возражение — возражать против обработки данных на основании законного интереса",
          ]} />
          <p style={{ marginTop: 14 }}>Для реализации любого из указанных прав направьте запрос по адресу <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a> с указанием темы письма «Запрос субъекта данных». Мы рассмотрим Ваш запрос и дадим ответ в течение 30 календарных дней.</p>
        </>,
      },
      {
        title: "9. Особые категории данных и несовершеннолетние",
        body: <>
          <p>Мы не собираем и не обрабатываем специальные (чувствительные) категории персональных данных, в том числе: расовую принадлежность, политические взгляды, религиозные убеждения, состояние здоровья, биометрические данные.</p>
          <p style={{ marginTop: 12 }}>Сайт не ориентирован на аудиторию младше 18 лет. Если Вам стало известно, что ребёнок зарегистрировал аккаунт без согласия родителей — немедленно сообщите нам. Мы удалим аккаунт и связанные данные в течение 48 часов.</p>
        </>,
      },
      {
        title: "10. Международная передача данных",
        body: <>
          <p>В связи с использованием облачных сервисов Vercel и Supabase данные пользователей могут обрабатываться на серверах, расположенных в США и странах Европейского союза. Оба поставщика обеспечивают уровень защиты, соответствующий требованиям GDPR, и подписали стандартные договорные оговорки ЕС.</p>
          <p style={{ marginTop: 12 }}>При наличии альтернативных вариантов мы отдаём предпочтение российской и европейской инфраструктуре.</p>
        </>,
      },
      {
        title: "11. Изменения в политике конфиденциальности",
        body: <>
          <p>Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. При существенных изменениях (затрагивающих объём собираемых данных или цели их использования) мы уведомим зарегистрированных пользователей по электронной почте не менее чем за 14 дней до вступления изменений в силу.</p>
          <p style={{ marginTop: 12 }}>Актуальная версия Политики всегда доступна на данной странице с указанием даты последнего обновления. Незначительные изменения (редакционные правки, уточнения формулировок) могут вноситься без предварительного уведомления.</p>
        </>,
      },
      {
        title: "12. Контакты по вопросам защиты данных",
        body: <>
          <p>По всем вопросам, связанным с обработкой персональных данных, реализацией Ваших прав или подачей жалоб, обращайтесь в редакцию Mirakt:</p>
          <p style={{ marginTop: 12 }}>Электронная почта: <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a></p>
          <p style={{ marginTop: 6 }}>Тема письма: «Конфиденциальность / Персональные данные»</p>
          <p style={{ marginTop: 6 }}>Telegram: <a href="https://t.me/mirakt_ru" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>t.me/mirakt_ru</a></p>
          <p style={{ marginTop: 14, color: "rgba(255,255,255,0.32)", fontSize: 13.5 }}>Срок рассмотрения обращений: до 30 рабочих дней. Жалобы на нарушение Ваших прав Вы вправе также подать в Роскомнадзор (rkn.gov.ru).</p>
        </>,
      },
    ],
  },
  en: {
    back:    "← Back to home",
    title:   "Privacy Policy",
    updated: "Last updated: May 31, 2026",
    intro:   "This Privacy Policy describes what personal and technical data the Mirakt news portal collects and processes, for what purpose, on what legal basis, and how we protect it. We adhere to the principles of data minimization and transparency.",
    sections: [
      {
        title: "1. General Provisions and Scope",
        body: <>
          <p>This Privacy Policy was developed by the editorial team of Mirakt news portal at <span style={{ color: GOLD }}>mirakt.ru</span> and defines the procedure for collecting, storing, using, and protecting user data.</p>
          <p style={{ marginTop: 12 }}>The Policy is developed in accordance with: Russian Federal Law No. 152-FZ "On Personal Data", Federal Law No. 149-FZ "On Information and Information Technologies", the EU General Data Protection Regulation (GDPR) for EU users, and other applicable regulations.</p>
          <Note>If you are under 18, please use the Site only with the knowledge and consent of a parent or legal guardian.</Note>
        </>,
      },
      {
        title: "2. Data We Collect",
        body: <>
          <p><strong style={{ color: "rgba(255,255,255,0.7)" }}>2.1. Technical data (collected automatically):</strong></p>
          <Bullets items={[
            "IP address (stored in anonymized form with last octet truncated)",
            "Browser type and version, device operating system",
            "Referral URL — the page you came from",
            "Pages, sections, and articles viewed",
            "Date, time, and duration of visit",
            "Country and approximate city (from IP, accuracy ±50km)",
            "Screen resolution and device type",
          ]} />
          <p style={{ marginTop: 16 }}><strong style={{ color: "rgba(255,255,255,0.7)" }}>2.2. Registered user data:</strong> email address, username, profile avatar (optional), registration date, last login date, verification status.</p>
          <p style={{ marginTop: 12 }}><strong style={{ color: "rgba(255,255,255,0.7)" }}>2.3. Data we do NOT collect:</strong> full name, date of birth, phone number, payment details, home address, passport details, or biometric data.</p>
        </>,
      },
      {
        title: "3. Legal Bases and Purposes of Processing",
        body: <>
          <p>We process data based on: legitimate interest (site operation, analytics, security), contract performance (user account), and consent (optional notifications). Retention periods range from session-length for technical data to 3 years for correspondence.</p>
        </>,
      },
      {
        title: "4. Cookies and Similar Technologies",
        body: <>
          <p>We use three categories of cookies: <strong style={{ color: "rgba(255,255,255,0.65)" }}>Essential</strong> (auth token, CSRF protection, language preference — cannot be disabled), <strong style={{ color: "rgba(255,255,255,0.65)" }}>Analytics</strong> (anonymized session ID, page counts, time on site — optional), and <strong style={{ color: "rgba(255,255,255,0.65)" }}>Functional</strong> (UI preferences — optional).</p>
          <Note>You can manage cookies in your browser settings. Disabling essential cookies may break authentication and user preferences.</Note>
        </>,
      },
      {
        title: "5. How We Use and Store Data",
        body: <>
          <p>Data is used exclusively for: site operation and security, user authentication, traffic analytics, fraud prevention, internal editorial analytics, and responding to user inquiries.</p>
          <p style={{ marginTop: 12 }}>Data is stored on Supabase servers (European infrastructure). We do not sell, rent, or transfer personal data to third parties for commercial purposes.</p>
        </>,
      },
      {
        title: "6. Third-Party Data Sharing",
        body: <>
          <p>We work with a limited set of service providers who may access technical data only as needed for their functions:</p>
          <Bullets items={[
            "Supabase Inc. — database hosting (US/EU, GDPR-compliant)",
            "Vercel Inc. — hosting infrastructure (US, SOC 2 compliant)",
            "Pexels GmbH — article image sourcing by keyword",
            "Groq Inc. — AI text processing (anonymized content only)",
          ]} />
          <p style={{ marginTop: 12 }}>All providers are bound by confidentiality obligations. Data may be disclosed to authorities only by court order or legal requirement.</p>
        </>,
      },
      {
        title: "7. Data Security",
        body: <>
          <p>Security measures include: TLS 1.3 encryption for all connections, bcrypt password hashing, least-privilege database access controls, encrypted backups, suspicious activity monitoring, and regular software updates.</p>
          <p style={{ marginTop: 12 }}>In case of a data breach, we will notify affected users within 72 hours of discovery.</p>
        </>,
      },
      {
        title: "8. Your Data Rights",
        body: <>
          <p>You have the right to: access your data, correct inaccuracies, request deletion ("right to be forgotten"), restrict processing, data portability, withdraw consent at any time, and object to processing based on legitimate interest.</p>
          <p style={{ marginTop: 12 }}>To exercise any right, email <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a> with subject "Data Subject Request". We respond within 30 calendar days.</p>
        </>,
      },
      {
        title: "9. Special Categories and Minors",
        body: <p>We do not collect sensitive data categories (race, political views, health, biometrics, etc.). The Site is not directed at users under 18. If you learn a child registered without parental consent, contact us and we will delete the account within 48 hours.</p>,
      },
      {
        title: "10. International Data Transfers",
        body: <p>Due to Vercel and Supabase cloud services, data may be processed on servers in the US and EU. Both providers maintain GDPR-compliant protections and have signed EU Standard Contractual Clauses.</p>,
      },
      {
        title: "11. Policy Changes",
        body: <p>We may update this Policy. For significant changes (affecting data collected or purposes), registered users will be notified by email at least 14 days in advance. The current version is always on this page with the update date.</p>,
      },
      {
        title: "12. Data Protection Contact",
        body: <>
          <p>For all data protection inquiries:</p>
          <p style={{ marginTop: 12 }}>Email: <a href="mailto:mirakt.news@mail.ru" style={{ color: GOLD }}>mirakt.news@mail.ru</a> — Subject: "Privacy / Personal Data"</p>
          <p style={{ marginTop: 6 }}>Telegram: <a href="https://t.me/mirakt_ru" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>t.me/mirakt_ru</a></p>
          <p style={{ marginTop: 6 }}>Response time: up to 30 business days.</p>
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
      <Link href="/" style={{ color: GOLD, fontSize: 13, display: "inline-block", marginBottom: 48 }}>{c.back}</Link>

      <h1 style={{ fontSize: "clamp(22px, 7vw, 36px)", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.94)", wordBreak: "break-word" }}>
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
