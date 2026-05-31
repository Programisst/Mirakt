"use client";

import { createContext, useContext, useEffect } from "react";
import { translations } from "./i18n";

interface LocaleCtx {
  locale: "ru";
  t: typeof translations.ru;
  toggle: () => void;
}

const Ctx = createContext<LocaleCtx>({
  locale: "ru",
  t: translations.ru,
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // clear any previously saved EN preference
    localStorage.removeItem("mirakt_lang");
  }, []);

  return (
    <Ctx.Provider value={{ locale: "ru", t: translations.ru, toggle: () => {} }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLocale() {
  return useContext(Ctx);
}
