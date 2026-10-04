'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/components/LangProvider';
import { LANGS, type Lang } from '@/lib/i18n';

const LINKS = [
  { href: '/map',       key: 'nav.map' },
  { href: '/courses',   key: 'nav.courses' },
  { href: '/assistant', key: 'nav.assistant' },
  { href: '/news',      key: 'nav.news' },
  { href: '/spots',     key: 'nav.spots' },
  { href: '/notes',     key: 'nav.notes' },
  { href: '/schedule',  key: 'nav.schedule' },
  { href: '/events',    key: 'nav.events' },
  { href: '/game',      key: 'nav.game' },
  { href: '/admin',     key: 'nav.admin' },
];

const ICONS: Record<string, string> = {
  '/map': '🗺', '/courses': '📋', '/assistant': '🤖', '/news': '📰', '/spots': '☕',
  '/notes': '📚', '/schedule': '📅', '/events': '📣', '/game': '🎮', '/admin': '⚙',
};

export default function NavBar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();

  return (
    <nav
      dir={lang === 'en' ? 'ltr' : 'rtl'}
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
          marginInlineEnd: 10,
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

      {LINKS.map(({ href, key }) => {
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
            {ICONS[href]} {t(key)}
          </Link>
        );
      })}

      {/* سوییچر زبان */}
      <span
        dir="ltr"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          gap: 2,
          marginInlineStart: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 999,
          padding: 2,
        }}
      >
        {LANGS.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLang(code as Lang)}
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              background: lang === code ? '#fff' : 'transparent',
              color: lang === code ? '#1e40af' : 'rgba(255,255,255,0.85)',
            }}
            aria-label={`language: ${code}`}
          >
            {label}
          </button>
        ))}
      </span>
    </nav>
  );
}
