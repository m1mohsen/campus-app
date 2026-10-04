'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useMergedLocations } from '@/hooks/useAdminData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ensureNotificationPermission, notify } from '@/lib/notify';
import { buildIcs, downloadIcs } from '@/lib/ics';

export const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export interface ClassEntry {
  id: number;
  course: string;
  day: number; // 0=شنبه
  start: string;
  end: string;
  locationId?: number;
  locationName: string;
}

export interface ExamEntry {
  id: number;
  course: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 14,
  background: '#fff',
};

export default function SchedulePage() {
  const [tab, setTab] = useState<'classes' | 'exams'>('classes');
  const allLocations = useMergedLocations(); // مکان‌های پایه + اضافه‌های ادمین
  const [classes, setClasses] = useLocalStorage<ClassEntry[]>('myClasses', []);
  const [exams, setExams] = useLocalStorage<ExamEntry[]>('myExams', []);
  const [reminded, setReminded] = useLocalStorage<string[]>('scheduleReminded', []);

  // ── فرم کلاس ──
  const [course, setCourse] = useState('');
  const [day, setDay] = useState(0);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:30');
  const [locationId, setLocationId] = useState<number | ''>('');

  // ── فرم امتحان ──
  const [examCourse, setExamCourse] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('10:00');
  const [examLocation, setExamLocation] = useState('');

  const remindedRef = useRef<string[]>([]);
  useEffect(() => {
    remindedRef.current = reminded;
  }, [reminded]);

  // یادآور کلاسی: هر دقیقه چک می‌کند؛ ۱۵ دقیقه قبل + لحظه‌ی شروع کلاس نوتیف می‌دهد
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const ok = await ensureNotificationPermission();
      if (!ok || cancelled) return;

      const now = new Date();
      const todayJsToFa = [1, 2, 3, 4, 5, 6, 0]; // getDay → ایندکس روز ایرانی
      const todayFa = todayJsToFa[now.getDay()];

      const key = now.toISOString().slice(0, 10);
      for (const c of classes) {
        if (c.day !== todayFa) continue;
        const [h, m] = c.start.split(':').map(Number);
        const classTime = new Date(now);
        classTime.setHours(h || 0, m || 0, 0, 0);
        const diffMin = (classTime.getTime() - now.getTime()) / 60000;

        if (diffMin > 0 && diffMin <= 15 && !remindedRef.current.includes(`${key}-${c.id}-pre`)) {
          const sent = notify('⏰ کلاس نزدیک است!', `${c.course} — ساعت ${c.start} — ${c.locationName}`);
          if (sent) setReminded((prev) => [...prev, `${key}-${c.id}-pre`]);
        }

        // لحظه‌ی شروع کلاس (تا ۱ دقیقه بعد از شروع)
        if (diffMin <= 0 && diffMin > -1 && !remindedRef.current.includes(`${key}-${c.id}-start`)) {
          const sent = notify('🔔 کلاس شروع شد!', `${c.course} — ${c.locationName}`);
          if (sent) setReminded((prev) => [...prev, `${key}-${c.id}-start`]);
        }
      }
    }

    check();
    const timer = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classes, setReminded]);

  function addClass() {
    if (!course.trim()) return;
    const loc = locationId !== '' ? allLocations.find((l) => l.id === locationId) : undefined;
    setClasses((prev) => [
      ...prev,
      {
        id: Date.now(),
        course: course.trim(),
        day,
        start,
        end,
        locationId: loc?.id,
        locationName: loc?.name ?? '—',
      },
    ]);
    setCourse('');
  }

  function addExam() {
    if (!examCourse.trim() || !examDate) return;
    setExams((prev) => [
      ...prev,
      { id: Date.now(), course: examCourse.trim(), date: examDate, time: examTime, location: examLocation.trim() || '—' },
    ]);
    setExamCourse('');
    setExamDate('');
  }

  function exportIcs() {
    const content = buildIcs(classes, exams);
    if (classes.length + exams.length === 0) return;
    downloadIcs(content);
  }

  const sortedExams = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const todayFa = [1, 2, 3, 4, 5, 6, 0][new Date().getDay()];

  return (
    <>
      <PageHeader
        icon="📅"
        title="برنامه‌ی من"
        subtitle="برنامه هفتگی کلاس‌ها و تاریخ امتحانات — با یادآور و خروجی تقویم برای همگام‌سازی با موبایل"
        color="green"
      />
      <main dir="rtl" style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 48px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setTab('classes')}
          style={{ ...tabBtnStyle, background: tab === 'classes' ? '#1d4ed8' : '#fff', color: tab === 'classes' ? '#fff' : '#334155' }}
        >
          کلاس‌های هفته
        </button>
        <button
          onClick={() => setTab('exams')}
          style={{ ...tabBtnStyle, background: tab === 'exams' ? '#1d4ed8' : '#fff', color: tab === 'exams' ? '#fff' : '#334155' }}
        >
          امتحانات
        </button>
        <button
          onClick={exportIcs}
          style={{ ...tabBtnStyle, marginRight: 'auto', background: '#16a34a', color: '#fff' }}
        >
          ⬇ خروجی تقویم (.ics)
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--text-2)', background: 'var(--primary-soft)', padding: '10px 14px', borderRadius: 12, lineHeight: 2, marginBottom: 16 }}>
        💡 <strong>همگام‌سازی با گوگل کلندر:</strong> دکمه‌ی «خروجی تقویم» را بزنید، فایل <span dir="ltr">.ics</span> دانلود می‌شود؛
        بعد در گوگل کلندر به بخش Settings ← Import &amp; export بروید و فایل را انتخاب کنید تا همه‌ی کلاس‌ها و امتحانات تقویم موبایل‌تان بیاید.
      </p>

      {tab === 'classes' && (
        <>
          {/* فرم افزودن کلاس */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>➕ کلاس جدید</div>
            <input style={inputStyle} placeholder="نام درس" value={course} onChange={(e) => setCourse(e.target.value)} />
            <div className="form-grid-3">
              <div>
                <label style={labelStyle}>روز هفته</label>
                <select style={inputStyle} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>⏰ ساعت شروع</label>
                <input type="time" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>🏁 ساعت پایان</label>
                <input type="time" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>محل کلاس</label>
              <select style={inputStyle} value={locationId} onChange={(e) => setLocationId(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">انتخاب کنید (اختیاری — از روی نقشه)</option>
                {allLocations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <button onClick={addClass} style={addBtnStyle}>ثبت کلاس</button>
          </div>

          {/* لیست کلاس‌ها به تفکیک روز */}
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {DAYS.map((dayName, dayIndex) => {
              const dayClasses = classes.filter((c) => c.day === dayIndex);
              if (dayClasses.length === 0) return null;
              return (
                <div key={dayName} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: dayIndex === todayFa ? '#1d4ed8' : 'inherit' }}>
                    {dayName}{dayIndex === todayFa ? ' (امروز)' : ''}
                  </div>
                  {dayClasses.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px dashed var(--border)', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12.5, color: '#64748b', flexShrink: 0, direction: 'ltr' }}>{c.start}</div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.course}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{c.locationName}</div>
                      </div>
                      {c.locationId && (
                        <Link href={`/map?loc=${c.locationId}`} style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, flexShrink: 0 }}>
                          🗺 نقشه
                        </Link>
                      )}
                      <button
                        onClick={() => setClasses((prev) => prev.filter((x) => x.id !== c.id))}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13, flexShrink: 0, padding: '2px 4px' }}
                        aria-label="حذف کلاس"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
            {classes.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>
                هنوز کلاسی ثبت نکرده‌ای. از فرم بالا اضافه کن!
              </p>
            )}
          </div>
        </>
      )}

      {tab === 'exams' && (
        <>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>➕ امتحان جدید</div>
            <input style={inputStyle} placeholder="نام درس" value={examCourse} onChange={(e) => setExamCourse(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="date" style={inputStyle} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              <input type="time" style={inputStyle} value={examTime} onChange={(e) => setExamTime(e.target.value)} />
            </div>
            <input style={inputStyle} placeholder="محل امتحان" value={examLocation} onChange={(e) => setExamLocation(e.target.value)} />
            <button onClick={addExam} style={addBtnStyle}>ثبت امتحان</button>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            {sortedExams.map((e) => (
              <div key={e.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, flex: 1, minWidth: 100 }}>{e.course}</div>
                <div style={{ fontSize: 12, color: '#64748b', direction: 'ltr' }}>{e.date} — {e.time}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{e.location}</div>
                <button
                  onClick={() => setExams((prev) => prev.filter((x) => x.id !== e.id))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px' }}
                  aria-label="حذف امتحان"
                >
                  🗑
                </button>
              </div>
            ))}
            {exams.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>
                امتحانی ثبت نشده است.
              </p>
            )}
          </div>
        </>
      )}
      </main>
    </>
  );
}

const tabBtnStyle: React.CSSProperties = {
  padding: '6px 11px',
  borderRadius: 9,
  border: '1px solid var(--border)',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const addBtnStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: 8,
  border: 'none',
  background: '#1d4ed8',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-2)',
  marginBottom: 4,
};
