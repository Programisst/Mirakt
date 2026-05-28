# Mirakt

**Mirakt** — Premium News Portal. **Stack:** Next.js, Tailwind CSS, TypeScript.

Modern media outlet design with RSS feed aggregation, dark UI, category feeds, and internal article pages.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Repository root (minimal Next.js)

Вся логика приложения живёт в **`src/`**. В корне остаётся только то, что требует экосистема Next/Node:

| File / folder | Why it stays here |
|---------------|-------------------|
| `package.json`, `package-lock.json` | npm |
| `next.config.ts` | единственный конфиг Next (**нет** `next.config.js`-дубликата) |
| `tsconfig.json`, `next-env.d.ts` | TypeScript / Next |
| `postcss.config.mjs`, `eslint.config.mjs` | Tailwind / ESLint |
| `public/` | статика (`logo.jpeg`, `IMG_8325.MP4`, …) |
| `.gitignore` | Git |
| `README.md` | описание репозитория |
| `.env.example` | шаблон переменных (без секретов), **коммитится** |

Файлы `.env*` с секретами **не коммитятся** (см. `.gitignore`). Скопируй `.env.example` → `.env.local` в корне проекта.

## `src/` layout

| Path | Role |
|------|------|
| `src/app/` | App Router, `layout.tsx`, `globals.css`, страницы |
| `src/app/api/` | RSS (`/api/feed`), auth (`/api/auth/*`) |
| `src/components/` | `VideoPreloader`, `Navbar`, `NewsCard` |
| `src/constants/` | токены сайта, категории |
| `src/lib/` | хелперы (thematic images, mailer, JWT) |
| `src/types/` | общие типы TypeScript |

## Environment

См. **`.env.example`**. Основное: `JWT_SECRET`; для писем с кодом — SMTP-поля (`SMTP_USER`, `SMTP_PASS`, …).

## Scripts

- `npm run dev` — dev server  
- `npm run build` — production build  
- `npm run start` — запуск production  
- `npm run lint` — ESLint  
