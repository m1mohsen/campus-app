'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import {
  useCustomLocations,
  useCustomEvents,
} from '@/hooks/useAdminData';
import type { Location, LocationCategory } from '@/types/location';

const CATEGORIES: { value: LocationCategory; label: string }[] = [
  { value: 'academic', label: '🎓 آموزشی' },
  { value: 'food',     label: '🍽️ غذا' },
  { value: 'admin',    label: '🏛️ اداری' },
  { value: 'sport',    label: '⚽ ورزشی' },
  { value: 'gate',     label: '🚪 درها' },
  { value: 'other',    label: '📍 سایر' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-2)',
  marginBottom: 4,
};

export default function AdminPage() {
  const [tab, setTab] = useState<'locations' | 'events' | 'backup'>('locations');
  const [customLocations, setCustomLocations] = useCustomLocations();
  const [customEvents, setCustomEvents] = useCustomEvents();
  const [msg, setMsg] = useState<string | null>(null);

  // ── فرم مکان ──
  const [editId, setEditId] = useState<number | null>(null);
  const [fName, setFName] = useState('');
  const [fCategory, setFCategory] = useState<LocationCategory>('academic');
  const [fLat, setFLat] = useState('');
  const [fLng, setFLng] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fFloor, setFFloor] = useState('');
  const [fError, setFError] = useState<string | null>(null);

  // ── فرم رویداد ──
  const [eTitle, setETitle] = useState('');
  const [eCategory, setECategory] = useState('علمی');
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('10:00');
  const [ePlace, setEPlace] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eEditId, setEEditId] = useState<number | null>(null);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 3500);
  }

  function resetForm() {
    setEditId(null); setFName(''); setFLat(''); setFLng(''); setFDesc(''); setFFloor(''); setFError(null);
  }

  function saveLocation() {
    const lat = parseFloat(fLat);
    const lng = parseFloat(fLng);
    if (!fName.trim()) return setFError('نام مکان الزامی است');
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return setFError('مختصات معتبر نیست (lat مثل 35.7439 و lng مثل 51.5022)');
    }

    const item: Location = {
      id: editId ?? Date.now(),
      name: fName.trim(),
      category: fCategory,
      lat, lng,
      description: fDesc.trim() || undefined,
      floor: fFloor ? Number(fFloor) : undefined,
    };

    setCustomLocations((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [...prev, item]
    );
    flash(editId ? '✔ ویرایش شد' : '✔ مکان اضافه شد (همین حالا در نقشه و دستیار دیده می‌شود)');
    resetForm();
  }

  function editLocation(loc: Location) {
    setEditId(loc.id); setFName(loc.name); setFCategory(loc.category);
    setFLat(String(loc.lat)); setFLng(String(loc.lng));
    setFDesc(loc.description ?? ''); setFFloor(loc.floor !== undefined ? String(loc.floor) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveEvent() {
    if (!eTitle.trim() || !eDate) {
      flash('⚠ عنوان و تاریخ رویداد الزامی است');
      return;
    }
    const item = {
      id: eEditId ?? Date.now(),
      title: eTitle.trim(),
      category: eCategory as 'علمی',
      date: eDate,
      time: eTime,
      place: ePlace.trim() || '—',
      description: eDesc.trim(),
    };
    setCustomEvents((prev) =>
      eEditId ? prev.map((x) => (x.id === eEditId ? item : x)) : [...prev, item]
    );
    flash('✔ رویداد ثبت شد (در صفحه‌ی رویدادها دیده می‌شود)');
    setETitle(''); setEDate(''); setEPlace(''); setEDesc(''); setEEditId(null);
  }

  // ── پشتیبان‌گیری ──
  function exportData() {
    const payload = {
      _guide: 'این فایل دیتای اضافه‌شده‌ی شماست. برای انتشار عمومی: محتوای locations را به انتهای src/data/locations.ts و classrooms.ts و محتوای events را به src/data/events.ts اضافه کنید و روی GitHub push کنید.',
      locations: customLocations,
      events: customEvents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'campus-custom-data.json';
    a.click();
  }

  function importData(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.locations)) setCustomLocations(data.locations);
        if (Array.isArray(data.events)) setCustomEvents(data.events);
        flash('✔ دیتا بازگردانی شد');
      } catch {
        flash('⚠ فایل JSON معتبر نیست');
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader
        icon="⚙"
        title="داشبورد مدیریت"
        subtitle="افزودن و ویرایش مکان‌ها، کلاس‌ها و رویدادها — بدون کدنویسی"
        color="teal"
      />
      <main dir="rtl" style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 48px' }}>

        {msg && (
          <div style={{
            position: 'sticky', top: 64, zIndex: 500,
            background: '#dcfce7', color: '#166534', border: '1px solid #86efac',
            padding: '10px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, marginBottom: 12,
          }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('locations')} className={`chip ${tab === 'locations' ? 'chip-active' : ''}`}>
            📍 مکان‌ها و کلاس‌ها ({customLocations.length})
          </button>
          <button onClick={() => setTab('events')} className={`chip ${tab === 'events' ? 'chip-active' : ''}`}>
            📣 رویدادها ({customEvents.length})
          </button>
          <button onClick={() => setTab('backup')} className={`chip ${tab === 'backup' ? 'chip-active' : ''}`}>
            💾 انتشار و پشتیبان
          </button>
        </div>

        {/* ═══ مکان‌ها ═══ */}
        {tab === 'locations' && (
          <>
            <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {editId ? '✏ ویرایش مکان' : '➕ مکان جدید (ساختمان، کلاس، دفتر استاد، سلف و...)'}
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>نام مکان *</label>
                  <input style={inputStyle} placeholder="مثلاً: کلاس ۳۰۶ دانشکده برق" value={fName} onChange={(e) => setFName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>دسته‌بندی</label>
                  <select style={inputStyle} value={fCategory} onChange={(e) => setFCategory(e.target.value as LocationCategory)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div>
                  <label style={labelStyle}>عرض جغرافیایی (lat) *</label>
                  <input style={inputStyle} dir="ltr" placeholder="35.7439" value={fLat} onChange={(e) => setFLat(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>طول جغرافیایی (lng) *</label>
                  <input style={inputStyle} dir="ltr" placeholder="51.5022" value={fLng} onChange={(e) => setFLng(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>طبقه (اختیاری)</label>
                  <input style={inputStyle} inputMode="numeric" placeholder="2" value={fFloor} onChange={(e) => setFFloor(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>توضیحات (ساختمان، شماره اتاق، ساعت و...)</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="مثلاً: ساختمان برق، طبقه ۲، اتاق انتهای راهرو" value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
              </div>

              {fError && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{fError}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveLocation} className="btn btn-primary">
                  {editId ? 'ذخیره‌ی ویرایش' : 'افزودن مکان'}
                </button>
                {editId && (
                  <button onClick={resetForm} className="btn btn-outline">انصراف</button>
                )}
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.9 }}>
                💡 گرفتن مختصات: در Google Maps روی نقطه راست‌کلیک کنید — عدد اول lat و عدد دوم lng است.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {customLocations.map((loc) => (
                <div key={loc.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{loc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', direction: 'ltr', textAlign: 'right' }}>
                      {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} {loc.floor !== undefined ? `— طبقه ${loc.floor}` : ''}
                    </div>
                  </div>
                  <button onClick={() => editLocation(loc)} style={iconBtnStyle} aria-label="ویرایش">✏</button>
                  <button
                    onClick={() => setCustomLocations((prev) => prev.filter((x) => x.id !== loc.id))}
                    style={{ ...iconBtnStyle, color: 'var(--danger)' }}
                    aria-label="حذف"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {customLocations.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                  هنوز مکانی اضافه نکرده‌اید.
                </p>
              )}
            </div>
          </>
        )}

        {/* ═══ رویدادها ═══ */}
        {tab === 'events' && (
          <>
            <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>➕ رویداد جدید</div>
              <div>
                <label style={labelStyle}>عنوان *</label>
                <input style={inputStyle} placeholder="مثلاً سمینار هوش مصنوعی" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
              </div>
              <div className="form-grid-3">
                <div>
                  <label style={labelStyle}>دسته</label>
                  <select style={inputStyle} value={eCategory} onChange={(e) => setECategory(e.target.value)}>
                    {['علمی', 'فرهنگی', 'ورزشی', 'تشکل'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>تاریخ *</label>
                  <input type="date" style={inputStyle} value={eDate} onChange={(e) => setEDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>ساعت</label>
                  <input type="time" style={inputStyle} value={eTime} onChange={(e) => setETime(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>مکان برگزاری</label>
                <input style={inputStyle} placeholder="مثلاً آمفی تئاتر بهرامی" value={ePlace} onChange={(e) => setEPlace(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>توضیحات</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
              </div>
              <button onClick={saveEvent} className="btn btn-primary">
                {eEditId ? 'ذخیره‌ی ویرایش' : 'ثبت رویداد'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {customEvents.map((ev) => (
                <div key={ev.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      {new Date(ev.date).toLocaleDateString('fa-IR')} — ساعت {ev.time} — {ev.place}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEEditId(ev.id); setETitle(ev.title); setECategory(ev.category); setEDate(ev.date); setETime(ev.time); setEPlace(ev.place); setEDesc(ev.description); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={iconBtnStyle}
                    aria-label="ویرایش"
                  >
                    ✏
                  </button>
                  <button
                    onClick={() => setCustomEvents((prev) => prev.filter((x) => x.id !== ev.id))}
                    style={{ ...iconBtnStyle, color: 'var(--danger)' }}
                    aria-label="حذف"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {customEvents.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                  رویدادی اضافه نکرده‌اید.
                </p>
              )}
            </div>
          </>
        )}

        {/* ═══ انتشار و پشتیبان ═══ */}
        {tab === 'backup' && (
          <>
            <div className="card" style={{ padding: 16, marginBottom: 14, lineHeight: 2.1, fontSize: 13.5 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>📤 انتشار دیتا برای همه‌ی کاربرها</div>
              <ol style={{ paddingRight: 20, display: 'grid', gap: 6 }}>
                <li>دکمه‌ی «دانلود خروجی JSON» را بزنید.</li>
                <li>
                  فایل <span dir="ltr">campus-custom-data.json</span> را برای من (ایجنت) بفرستید تا در فایل‌های
                  <span dir="ltr"> src/data</span> ادغام کنم، یا خودتان محتوایش را به انتهای
                  <span dir="ltr"> locations.ts</span> و <span dir="ltr">events.ts</span> اضافه کنید.
                </li>
                <li>تغییرات را روی GitHub پوش کنید — Vercel خودکار سایت را به‌روز می‌کند.</li>
              </ol>
              <div style={{ marginTop: 10, padding: 10, background: 'var(--primary-soft)', borderRadius: 10, fontSize: 12.5, color: 'var(--primary-dark)' }}>
                ℹ دیتای این داشبورد فعلاً روی همین دستگاه ذخیره می‌شود. با اتصال Supabase (رایگان)، همین فرم‌ها مستقیم روی دیتابیس می‌نویسند و دیتا برای همه فوری مشترک می‌شود.
              </div>
            </div>

            <div className="card" style={{ padding: 16, display: 'grid', gap: 10 }}>
              <button onClick={exportData} className="btn btn-primary">⬇ دانلود خروجی JSON</button>
              <div>
                <label style={labelStyle}>بازگردانی از فایل</label>
                <input type="file" accept=".json" onChange={(e) => importData(e.target.files?.[0])} style={{ fontSize: 13 }} />
              </div>
              <button
                onClick={() => { if (confirm('همه‌ی مکان‌ها و رویدادهای اضافه‌شده پاک شوند؟')) { setCustomLocations([]); setCustomEvents([]); flash('پاک شد'); } }}
                className="btn btn-outline"
                style={{ color: 'var(--danger)' }}
              >
                🗑 پاک کردن همه‌ی دیتای ادمین
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  border: 'none', background: '#f8fafc', cursor: 'pointer',
  fontSize: 15, padding: '6px 9px', borderRadius: 8,
};
