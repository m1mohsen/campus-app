import Link from 'next/link';
import { campusLocations } from '@/data/locations';
import { telegramChannels } from '@/data/channels';
import { campusEvents } from '@/data/events';

const MODULES = [
  {
    href: '/map',
    icon: '🗺',
    title: 'نقشه پردیس',
    desc: 'جستجوی کلاس، استاد، سلف و درهای دانشگاه + مسیریابی',
    grad: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  },
  {
    href: '/assistant',
    icon: '🤖',
    title: 'دستیار هوشمند',
    desc: '«استاد فلانی کجاست؟» — جواب فوری سوالات پرتردد',
    grad: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
  },
  {
    href: '/news',
    icon: '📰',
    title: 'اخبار و اطلاعیه‌ها',
    desc: 'فید زنده‌ی کانال‌های تلگرام دانشگاه',
    grad: 'linear-gradient(135deg, #881337, #f43f5e)',
  },
  {
    href: '/spots',
    icon: '☕',
    title: 'پاتوق‌های اطراف',
    desc: 'کافه‌ها و رستوران‌ها با تگ، امتیاز و نظر دانشجویی',
    grad: 'linear-gradient(135deg, #7c2d12, #f97316)',
  },
  {
    href: '/schedule',
    icon: '📅',
    title: 'برنامه و امتحانات',
    desc: 'برنامه هفتگی، یادآور کلاسی و خروجی تقویم (.ics)',
    grad: 'linear-gradient(135deg, #14532d, #22c55e)',
  },
  {
    href: '/events',
    icon: '📣',
    title: 'برد رویدادها',
    desc: 'سمینارها، انجمن‌های علمی و برنامه‌های فرهنگی',
    grad: 'linear-gradient(135deg, #134e4a, #14b8a6)',
  },
  {
    href: '/game',
    icon: '🎮',
    title: 'شکار گنج و بازی',
    desc: 'اسکونجر هانت با QR، کوییز و لیدربورد',
    grad: 'linear-gradient(135deg, #9f1239, #ec4899)',
  },
];

export default function Home() {
  const upcoming = [...campusEvents]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);

  return (
    <main style={{ paddingBottom: 48 }}>
      {/* ── هیرو ── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px 56px',
        background: 'var(--grad-hero)',
        color: '#fff',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
      }}>
        <div style={{ position: 'absolute', top: -50, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -20, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 20, fontSize: 32,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
          }}>
            🎓
          </div>
          <h1 style={{ marginTop: 16, fontSize: 30, fontWeight: 900 }}>پردیس</h1>
          <p style={{ marginTop: 8, fontSize: 15, opacity: 0.9, lineHeight: 2 }}>
            اپلیکیشن جامع دانشجویی دانشگاه علم و صنعت ایران
            <br />
            <span style={{ fontSize: 13, opacity: 0.75 }}>
              نقشه، دستیار هوشمند، اخبار، پاتوق‌ها، برنامه کلاس، رویدادها و بازی — همه در یک اپ
            </span>
          </p>

          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              `${campusLocations.length}+ مکان روی نقشه`,
              `${telegramChannels.length} کانال دانشگاه`,
              'کاملاً رایگان',
            ].map((s) => (
              <span key={s} style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.14)',
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ماژول‌ها ── */}
      <section dir="rtl" style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 14, marginTop: -28 }}>
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="card card-hover"
              style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 16, position: 'relative', zIndex: 2 }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: 16, fontSize: 24,
                background: m.grad, flexShrink: 0,
                boxShadow: '0 6px 14px rgba(15,23,42,0.18)',
              }}>
                {m.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>{m.title}</div>
                <div style={{ marginTop: 3, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.9 }}>{m.desc}</div>
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: 18 }}>‹</div>
            </Link>
          ))}
        </div>

        {/* ── رویدادهای نزدیک ── */}
        <h2 style={{ marginTop: 32, marginBottom: 12, fontSize: 17, fontWeight: 800 }}>
          📣 رویدادهای پیش‌رو
        </h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {upcoming.map((ev) => (
            <Link
              key={ev.id}
              href="/events"
              className="card card-hover"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}
            >
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>
                  {new Date(ev.date).toLocaleDateString('fa-IR', { day: 'numeric' })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  {new Date(ev.date).toLocaleDateString('fa-IR', { month: 'long' })}
                </div>
              </div>
              <div style={{ width: 1, height: 34, background: 'var(--border)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{ev.place}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── کانال‌ها ── */}
        <Link
          href="/news"
          className="card card-hover"
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, marginTop: 24, background: 'var(--grad-rose)', border: 'none', color: '#fff' }}
        >
          <div style={{ fontSize: 28 }}>📰</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>اخبار دانشگاه، زنده از تلگرام</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>
              {telegramChannels.slice(0, 4).map((c) => '@' + c.id).join('، ')} و {telegramChannels.length - 4} کانال دیگر
            </div>
          </div>
          <div style={{ fontSize: 18 }}>‹</div>
        </Link>

        <p style={{ marginTop: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
          ساخت دانشجویان — قابل نصب روی گوشی (PWA) و کاملاً رایگان
        </p>
      </section>
    </main>
  );
}
