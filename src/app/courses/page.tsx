'use client';

import { useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { courseSchedule, courseFaculties, type CourseEntry } from '@/data/courseSchedule';

const DAY_ORDER = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const DAY_COLORS: Record<string, string> = {
  'شنبه': '#1d4ed8', 'یکشنبه': '#7c3aed', 'دوشنبه': '#0d9488',
  'سه‌شنبه': '#ea580c', 'چهارشنبه': '#e11d48', 'پنجشنبه': '#16a34a', 'جمعه': '#64748b',
};

function normalizeFa(s: string): string {
  // برای جستجو: ی/ک عربی → فارسی، اعداد عربی → فارسی
  return s
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, (d) => d)
    .replace(/[٠-٩]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/\s+/g, ' ').trim();
}

export default function CoursesPage() {
  const [query, setQuery] = useState('');
  const [faculty, setFaculty] = useState<string>('');

  const filtered = useMemo<CourseEntry[]>(() => {
    const q = normalizeFa(query);
    return courseSchedule.filter((c) => {
      if (faculty && c.faculty !== faculty) return false;
      if (!q) return true;
      return (
        normalizeFa(c.course).includes(q) ||
        normalizeFa(c.professor).includes(q) ||
        c.sessions.some((s) => normalizeFa(s.place).includes(q))
      );
    });
  }, [query, faculty]);

  // گروه‌بندی بر اساس روز هفته
  const byDay = useMemo(() => {
    const map = new Map<string, { course: CourseEntry; sessionIdx: number }[]>();
    for (const c of filtered) {
      c.sessions.forEach((s, i) => {
        const list = map.get(s.day) ?? [];
        list.push({ course: c, sessionIdx: i });
        map.set(s.day, list);
      });
    }
    return DAY_ORDER.filter((d) => map.has(d)).map((d) => ({ day: d, items: map.get(d)! }));
  }, [filtered]);

  const courseCount = useMemo(() => new Set(filtered.map((c) => c.course)).size, [filtered]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f1f5f9)', paddingBottom: 40 }}>
      <PageHeader
        icon="📋"
        title="برنامه کلاس‌های ترم"
        subtitle="ساعت و مکان کلاس‌های ارائه‌شده در نیمسال اول ۱۴۰۵-۱۴۰۶ — استخراج‌شده از گزارش گلستان. با جستجو استاد، درس یا کلاس را پیدا کنید."
        color="violet"
      />

      <main dir="rtl" style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
        {/* جستجو و فیلتر */}
        <div style={{ position: 'sticky', top: 56, zIndex: 100, background: 'var(--bg, #f1f5f9)', padding: '4px 0 10px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 نام درس، استاد یا کلاس…"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 14,
              border: '1.5px solid #e2e8f0', fontSize: 14.5, outline: 'none',
              background: '#fff', boxShadow: '0 1px 6px rgba(15,23,42,0.06)',
            }}
          />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
            <button onClick={() => setFaculty('')} className={`chip ${faculty === '' ? 'chip-active' : ''}`}>
              همه ({courseSchedule.length})
            </button>
            {courseFaculties.map((f) => {
              const n = courseSchedule.filter((c) => c.faculty === f).length;
              return (
                <button key={f} onClick={() => setFaculty(f)} className={`chip ${faculty === f ? 'chip-active' : ''}`}>
                  {f.replace('دانشکده ', '')} ({n})
                </button>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '9px 13px', lineHeight: 1.9, margin: '0 0 14px' }}>
          ⚠ این جدول به‌صورت خودکار از PDF گزارش گلستان استخراج شده و ممکن است در نام اساتید یا ساعت‌ها خطای جزئی داشته باشد — حتماً با لیست نهایی گلستان تطبیق دهید.
        </p>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>چیزی پیدا نشد — عبارت دیگری امتحان کنید.</p>
        )}

        {/* نتیجه گروه‌بندی‌شده بر اساس روز */}
        {!query && !faculty ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {byDay.map(({ day, items }) => (
              <section key={day}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: DAY_COLORS[day] ?? '#1e293b', margin: '0 0 10px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: DAY_COLORS[day] ?? '#1e293b', display: 'inline-block' }} />
                  {day}
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8' }}>({items.length} کلاس)</span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(({ course, sessionIdx }) => (
                    <CourseRow key={`${course.faculty}-${course.course}-${course.professor}-${sessionIdx}`} c={course} sessionIdx={sessionIdx} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((c, i) => (
              <div key={`${c.course}-${c.professor}-${i}`} style={{
                background: '#fff', borderRadius: 14, padding: '12px 14px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 5px rgba(15,23,42,0.05)',
              }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{c.course}</div>
                <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>👨‍🏫 {c.professor} · {c.faculty}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {c.sessions.map((s, j) => (
                    <SessionChip key={j} s={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 22 }}>
          {filtered.length} جلسه · {courseCount} درس منحصربه‌فرد — منبع: گزارش ۱۰۲ گلستان (ترم ۴۰۵۱)
        </p>
      </main>
    </div>
  );
}

function SessionChip({ s }: { s: { day: string; time: string; place: string } }) {
  const color = DAY_COLORS[s.day] ?? '#475569';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#f8fafc', border: `1px solid ${color}33`, borderRadius: 999,
      padding: '3px 10px', fontSize: 11.5, color: '#334155',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: color, flexShrink: 0 }} />
      <b style={{ color }}>{s.day}</b> {s.time} · {s.place}
    </span>
  );
}

function CourseRow({ c, sessionIdx }: { c: CourseEntry; sessionIdx: number }) {
  const s = c.sessions[sessionIdx];
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '12px 14px',
      border: '1px solid #e2e8f0', borderInlineStart: `4px solid ${DAY_COLORS[s.day] ?? '#1e293b'}`,
      boxShadow: '0 1px 5px rgba(15,23,42,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{c.course}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: DAY_COLORS[s.day] ?? '#475569' }}>🕐 {s.time}</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>👨‍🏫 {c.professor} · {c.faculty}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>📍 {s.place}</div>
    </div>
  );
}
