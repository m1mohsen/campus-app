'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translate, type Lang } from '@/lib/i18n';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: 'rtl' | 'ltr';
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'fa',
  setLang: () => {},
  dir: 'rtl',
  t: (key, vars) => translate('fa', key, vars),
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fa');

  // بازیابی زبان ذخیره‌شده
  useEffect(() => {
    const t = setTimeout(() => {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'fa' || saved === 'en' || saved === 'ar') setLangState(saved);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // lang و dir سند را به‌روز می‌کند
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, dir: lang === 'en' ? 'ltr' : 'rtl', t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
