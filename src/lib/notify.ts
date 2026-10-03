'use client';

/**
 * نوتیفیکیشن مرورگر برای یادآور کلاس/امتحان/رویداد.
 * محدودیت: فقط وقتی اپ باز است کار می‌کند؛ پوش سرور-side
 * در فاز Supabase اضافه می‌شود.
 */

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notify(title: string, body: string): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
    return true;
  } catch {
    return false;
  }
}
