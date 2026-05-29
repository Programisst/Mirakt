"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { translations, type Locale, type T } from "./i18n";

interface LocaleCtx {
  locale: Locale;
  t: typeof translations.ru;
  toggle: () => void;
}

const Ctx = createContext<LocaleCtx>({
  locale: "ru",
  t: translations.ru,
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("mirakt_lang") as Locale | null;
    if (saved === "en" || saved === "ru") setLocale(saved);
  }, []);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === "ru" ? "en" : "ru";
      localStorage.setItem("mirakt_lang", next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ locale, t: translations[locale], toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLocale() {
  return useContext(Ctx);
}
