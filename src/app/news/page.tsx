'use client';

import { useState, useCallback, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { telegramChannels, seedPosts, TelegramChannel } from '@/data/channels';

interface Post {
  date: string | null;
  text: string;
  source: 'live' | 'seed';
}

const CATEGORY_COLORS: Record<TelegramChannel['category'], string> = {
  'رسمی': '#2563eb',
  'دانشجویی': '#8b5cf6',
  'انجمن علمی': '#0d9488',
  'ورزشی': '#16a34a',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function NewsPage() {
  const [selected, setSelected] = useState<string>('iust_ac');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<boolean | null>(null); // null = هنوز معلوم نیست
  const [channelTitle, setChannelTitle] = useState<string>('');

  const load = useCallback(async (channelId: string) => {
    setLoading(true);
    setSelected(channelId);
    setPosts([]);
    setLive(null);

    // تلاش برای فید زنده
    try {
      const res = await fetch(`/api/telegram-feed?channel=${channelId}`);
      const data = await res.json();
      if (data.ok && data.posts?.length > 0) {
        setPosts(
          data.posts.map((p: { date: string | null; text: string }) => ({
            ...p,
            source: 'live' as const,
          }))
        );
        setChannelTitle(data.title ?? '');
        setLive(true);
        setLoading(false);
        return;
      }
    } catch {
      /* fallback پایین */
    }

    // پشتیبان: پست‌های ذخیره‌شده
    const ch = telegramChannels.find((c) => c.id === channelId);
    setChannelTitle(ch?.title ?? '');
    const seeds = seedPosts
      .filter((p) => p.channel === channelId)
      .map((p) => ({ date: p.date, text: p.text, source: 'seed' as const }));
    setPosts(seeds);
    setLive(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    // بارگذاری اولیه به‌صورت async تا setState همگام در effect انجام نشود
    const t = setTimeout(() => load('iust_ac'), 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <main>
      <PageHeader
        icon="📰"
        title="اخبار و اطلاعیه‌ها"
        subtitle="فید زنده‌ی کانال‌های تلگرام دانشگاه — از اخبار رسمی آموزش تا خبرهای دانشجویی"
        color="rose"
      />

      <div dir="rtl" style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 48px' }}>
        {/* بنر گلستان — سایت رسمی دانشگاه */}
        <a
          href="https://golestan.iust.ac.ir/"
          target="_blank"
          rel="noopener"
          className="card card-hover"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #134e4a, #0d9488)',
            border: 'none',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 30 }}>🏛</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>سامانه گلستان دانشگاه</div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 3, lineHeight: 1.8 }}>
              سایت اصلی دانشگاه — اطلاعیه‌های رسمی آموزش، انتخاب واحد، شهریه و کارهای اداری
            </div>
          </div>
          <div style={{ fontSize: 18 }}>↗</div>
        </a>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.9 }}>
          کانال‌های زیر را انتخاب کنید تا آخرین پست‌ها را ببینید؛ برای اطلاعیه‌های اداری رسمی، گلستان مرجع اصلی است.
        </p>

        {/* انتخاب کانال */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {telegramChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => load(ch.id)}
              className={`chip ${selected === ch.id ? 'chip-active' : ''}`}
            >
              {ch.title}
            </button>
          ))}
        </div>

        {/* وضعیت */}
        <div style={{
          margin: '14px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {channelTitle && <strong style={{ color: 'var(--text)' }}>{channelTitle}</strong>}
            {live === true && <span style={{ marginRight: 8, color: '#16a34a', fontWeight: 700 }}>● زنده از تلگرام</span>}
            {live === false && <span style={{ marginRight: 8, color: '#f59e0b', fontWeight: 700 }}>⚠ پست‌های ذخیره‌شده (دسترسی به تلگرام برقرار نشد)</span>}
          </div>
          <button onClick={() => load(selected)} className="btn btn-soft">
            ↻ به‌روزرسانی
          </button>
        </div>

        {live === false && (
          <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', lineHeight: 1.9 }}>
            تلگرام مستقیماً در دسترس نیست (احتمالاً فیلترینگ). این پست‌ها آخرین محتوای ذخیره‌شده‌ی کانال هستند؛
            برای دیدن همه می‌توانید مستقیم در تلگرام باز کنید:
            <a href={`https://t.me/${selected}`} target="_blank" rel="noopener" style={{ color: '#2563eb', fontWeight: 700, marginRight: 4 }}>
              t.me/{selected}
            </a>
          </div>
        )}

        {/* پست‌ها */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 14 }}>
            ⏳ در حال دریافت...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-2)', fontSize: 14 }}>
            پستی برای نمایش نیست — در تلگرام باز کنید:
            <a href={`https://t.me/${selected}`} target="_blank" rel="noopener" style={{ color: '#2563eb', fontWeight: 700, marginRight: 4 }}>
              t.me/{selected}
            </a>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {posts.map((p, i) => {
            const ch = telegramChannels.find((c) => c.id === selected);
            return (
              <article key={i} className="card card-hover" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: ch ? CATEGORY_COLORS[ch.category] : '#64748b',
                  }}>
                    {ch?.title ?? selected}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDate(p.date)}</span>
                </div>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 2.1, whiteSpace: 'pre-wrap' }}>{p.text}</p>
                <a
                  href={`https://t.me/${selected}/${p.date ? '' : ''}`}
                  target="_blank"
                  rel="noopener"
                  style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}
                >
                  مشاهده در تلگرام ↗
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
