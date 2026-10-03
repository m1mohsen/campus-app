'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* PWA اختیاری است؛ خطا نباید اپ را بشکند */
      });
    }
  }, []);

  return null;
}
