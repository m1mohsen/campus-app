'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * localStorage به‌صورت هوک — پایه‌ی لایه‌ی دیتای کاربر.
 * بعداً برای مهاجرت به Supabase فقط کافی است پیاده‌سازی این هوک
 * (یا سرویس‌های بالای آن) به فراخوانی دیتابیس تغییر کند.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // الگوی استاندارد hydration-safe برای خواندن localStorage
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {
      /* داده خراب؛ از مقدار پیش‌فرض شروع می‌کنیم */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* فضای پر است؛ بی‌صدا رد می‌شود */
    }
  }, [key, value, loaded]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, loaded, reset] as const;
}
