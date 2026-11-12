import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bn, en, type DictKey } from "./i18n-dict";
import type { Lang } from "./format";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
  /** Pick a bilingual database field, falling back to English. */
  pick: (enValue: string | null | undefined, bnValue?: string | null) => string;
};

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "brandlinks-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "bn" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => (lang === "bn" ? bn[key] : en[key]) ?? en[key] ?? key,
      pick: (enValue, bnValue) => (lang === "bn" && bnValue ? bnValue : (enValue ?? "")),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
