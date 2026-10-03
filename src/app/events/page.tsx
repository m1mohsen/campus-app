'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { EVENT_CATEGORIES, EventCategory } from '@/data/events';
import { useMergedEvents } from '@/hooks/useAdminData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ensureNotificationPermission, notify } from '@/lib/notify';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  علمی: '#3b82f6',
  فرهنگی: '#8b5cf6',
  ورزشی: '#22c55e',
  تشکل: '#f97316',
};

function formatFaDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function EventsPage() {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [reminders, setReminders] = useLocalStorage<number[]>('eventReminders', []);
  const events = useMergedEvents(); // رویدادهای پایه + اضافه‌های ادمین

  // اگر رویداد یادآور-دار کمتر از ۲۴ ساعت مانده باشد، هنگام باز کردن اپ خبر می‌دهد
  useEffect(() => {
    (async () => {
      const ok = await ensureNotificationPermission();
      if (!ok) return;
      const today = new Date();
      for (const ev of events) {
        if (!reminders.includes(ev.id)) continue;
        const d = new Date(`${ev.date}T${ev.time}`);
        const diffH = (d.getTime() - today.getTime()) / 3600000;
        if (diffH > 0 && diffH <= 24) {
          notify('📣 رویداد نزدیک است!', `${ev.title} — ساعت ${ev.time} — ${ev.place}`);
        }
      }
    })();
  }, [reminders, events]);

  const list = events
    .filter((e) => filter === 'all' || e.category === filter)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHeader
        icon="📣"
        title="رویدادهای دانشگاه"
        subtitle="سمینارها، انجمن‌های علمی، برنامه‌های فرهنگی و ورزشی — از کانال‌های رسمی و دانشجویی"
        color="teal"
      />
      <main dir="rtl" style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 48px' }}>
      {/* بنر نگارستان — سامانه رسمی فعالیت‌های دانشجویی */}
      <a
        href="https://negarstan.iust.ac.ir"
        target="_blank"
        rel="noopener"
        className="card card-hover"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
          border: 'none',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 30 }}>🎭</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>ثبت‌نام رویدادها در نگارستان</div>
          <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 3, lineHeight: 1.8 }}>
            سامانه رسمی فعالیت‌های فرهنگی و دانشجویی دانشگاه — ثبت‌نام، مجوز و جزئیات رویدادها
          </div>
        </div>
        <div style={{ fontSize: 18 }}>↗</div>
      </a>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setFilter('all')}
          style={chipStyle(filter === 'all')}
        >
          همه
        </button>
        {EVENT_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={chipStyle(filter === c)}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {list.map((ev) => {
          const hasReminder = reminders.includes(ev.id);
          return (
            <div
              key={ev.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: CATEGORY_COLORS[ev.category],
                  }}
                >
                  {ev.category}
                </span>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {formatFaDate(ev.date)} — ساعت {ev.time}
                </span>
              </div>

              <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{ev.title}</div>
              <div style={{ marginTop: 4, color: '#64748b', fontSize: 13, lineHeight: 1.8 }}>
                {ev.description}
              </div>
              <div style={{ marginTop: 6, fontSize: 13 }}>📍 {ev.place}</div>
              {ev.source && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>منبع: {ev.source}</div>
              )}

              <button
                onClick={() =>
                  setReminders((prev) =>
                    prev.includes(ev.id) ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]
                  )
                }
                style={{
                  marginTop: 10,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: hasReminder ? '#dcfce7' : '#f8fafc',
                  color: hasReminder ? '#16a34a' : '#334155',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {hasReminder ? '🔔 یادآور فعال' : '🔕 یادآوری کن'}
              </button>
            </div>
          );
        })}
        {list.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>
            رویدادی در این دسته ثبت نشده است.
          </p>
        )}
      </div>
      </main>
    </>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 18,
    border: active ? 'none' : '1px solid var(--border)',
    background: active ? '#1d4ed8' : '#fff',
    color: active ? '#fff' : '#334155',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
