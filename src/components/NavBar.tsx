'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/map',       label: 'نقشه',     icon: '🗺' },
  { href: '/assistant', label: 'دستیار',   icon: '🤖' },
  { href: '/news',      label: 'اخبار',    icon: '📰' },
  { href: '/spots',     label: 'پاتوق‌ها',  icon: '☕' },
  { href: '/notes',     label: 'جزوه‌ها',   icon: '📚' },
  { href: '/schedule',  label: 'برنامه من', icon: '📅' },
  { href: '/events',    label: 'رویدادها',  icon: '📣' },
  { href: '/game',      label: 'بازی',     icon: '🎮' },
  { href: '/admin',     label: 'مدیریت',   icon: '⚙' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      dir="rtl"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        height: '56px',
        padding: '0 14px',
        background: 'linear-gradient(90deg, #172554, #1e40af 60%, #1d4ed8)',
        color: '#fff',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 12px rgba(23, 37, 84, 0.35)',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 800,
          fontSize: 16,
          marginLeft: 10,
          flexShrink: 0,
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.18)',
          fontSize: 16,
        }}>
          🎓
        </span>
        پردیس
      </Link>

      {LINKS.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flexShrink: 0,
              padding: '7px 13px',
              borderRadius: 999,
              fontSize: 13.5,
              background: active ? '#fff' : 'rgba(255,255,255,0.08)',
              color: active ? '#1e40af' : 'rgba(255,255,255,0.92)',
              fontWeight: active ? 800 : 500,
              boxShadow: active ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
              transition: 'all 150ms',
            }}
          >
            {icon} {label}
          </Link>
        );
      })}
    </nav>
  );
}
