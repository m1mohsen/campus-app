'use client';

import { useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { notify } from '@/lib/notify';

/**
 * بازار جزوه و تدریس — نسخه‌ی محلی (localStorage).
 * در فاز Supabase: فایل‌ها در Storage و آگهی‌ها در جدول + تایید ادمین.
 */

type NoteKind = 'جزوه' | 'پاورپوینت' | 'حل تمرین';

interface NoteListing {
  id: number;
  kind: NoteKind;
  course: string;
  teacher?: string;
  isFree: boolean;
  price?: number;          // تومان (برای موارد پولی)
  description: string;
  telegram: string;        // آیدی تلگرام فروشنده
  fileName?: string;
  fileData?: string;       // dataURL — فقط برای جزوه‌های رایگان سبک
  createdAt: number;
}

interface TutorListing {
  id: number;
  name: string;
  course: string;
  isFree: boolean;
  price?: number;
  description: string;
  telegram: string;
  createdAt: number;
}

const NOTE_KINDS: NoteKind[] = ['جزوه', 'پاورپوینت', 'حل تمرین'];

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

export default function NotesPage() {
  const [tab, setTab] = useState<'notes' | 'tutor'>('notes');

  const [notes, setNotes] = useLocalStorage<NoteListing[]>('noteListings', []);
  const [tutors, setTutors] = useLocalStorage<TutorListing[]>('tutorListings', []);

  // ── فرم جزوه ──
  const [nKind, setNKind] = useState<NoteKind>('جزوه');
  const [nCourse, setNCourse] = useState('');
  const [nTeacher, setNTeacher] = useState('');
  const [nFree, setNFree] = useState(true);
  const [nPrice, setNPrice] = useState('');
  const [nDesc, setNDesc] = useState('');
  const [nTg, setNTg] = useState('');
  const [nFile, setNFile] = useState<{ name: string; data: string } | null>(null);
  const [nError, setNError] = useState<string | null>(null);

  // ── فرم تدریس ──
  const [tName, setTName] = useState('');
  const [tCourse, setTCourse] = useState('');
  const [tFree, setTFree] = useState(false);
  const [tPrice, setTPrice] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tTg, setTTg] = useState('');

  function pickNoteFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setNError('فایل بزرگ‌تر از ۲ مگابایت است — فعلاً فقط جزوه‌های سبک رایگان آپلود می‌شوند؛ برای فایل‌های بزرگ آیدی تلگرام بگذارید (فاز دیتابیس محدودیت ندارد)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNFile({ name: file.name, data: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function submitNote() {
    if (!nCourse.trim() || !nTg.trim()) {
      setNError('نام درس و آیدی تلگرام الزامی است');
      return;
    }
    if (!nFree && !Number(nPrice)) {
      setNError('برای آیتم پولی، قیمت را وارد کنید');
      return;
    }
    const item: NoteListing = {
      id: Date.now(),
      kind: nKind,
      course: nCourse.trim(),
      teacher: nTeacher.trim() || undefined,
      isFree: nFree,
      price: nFree ? undefined : Number(nPrice),
      description: nDesc.trim(),
      telegram: nTg.trim().replace('@', ''),
      fileName: nFile?.name,
      fileData: nFile?.data,
      createdAt: Date.now(),
    };
    setNotes((prev) => [item, ...prev]);
    setNCourse(''); setNTeacher(''); setNPrice(''); setNDesc(''); setNFile(null); setNError(null);
    notify('✅ آگهی ثبت شد', `${item.kind} ${item.course}`);
  }

  function submitTutor() {
    if (!tName.trim() || !tCourse.trim() || !tTg.trim()) return;
    setTutors((prev) => [
      {
        id: Date.now(),
        name: tName.trim(),
        course: tCourse.trim(),
        isFree: tFree,
        price: tFree ? undefined : Number(tPrice) || undefined,
        description: tDesc.trim(),
        telegram: tTg.trim().replace('@', ''),
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setTName(''); setTCourse(''); setTPrice(''); setTDesc('');
  }

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.createdAt - a.createdAt), [notes]);
  const sortedTutors = useMemo(() => [...tutors].sort((a, b) => b.createdAt - a.createdAt), [tutors]);

  return (
    <>
      <PageHeader
        icon="📚"
        title="بازار جزوه و تدریس"
        subtitle="جزوه‌ها و پاورپوینت‌های رایگان و پولی + آگهی تدریس خود دانشجوها"
        color="violet"
      />
      <main dir="rtl" style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 48px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setTab('notes')}
            className={`chip ${tab === 'notes' ? 'chip-active' : ''}`}
          >
            📄 جزوه و پاورپوینت ({notes.length})
          </button>
          <button
            onClick={() => setTab('tutor')}
            className={`chip ${tab === 'tutor' ? 'chip-active' : ''}`}
          >
            👨‍🏫 تدریس دانشجویی ({tutors.length})
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-2)', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', lineHeight: 2, marginBottom: 16 }}>
          ⚠ این آگهی‌ها فعلاً روی همین دستگاه ذخیره می‌شوند (نسخه‌ی نمایشی). با اتصال دیتابیس در فاز بعد، آگهی‌ها برای همه قابل دیدن می‌شود و پرداخت امن اضافه می‌گردد.
        </p>

        {tab === 'notes' && (
          <>
            {/* ── فرم ثبت جزوه ── */}
            <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>➕ به اشتراک بگذارید</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {NOTE_KINDS.map((k) => (
                  <button key={k} onClick={() => setNKind(k)} className={`chip ${nKind === k ? 'chip-active' : ''}`}>
                    {k}
                  </button>
                ))}
              </div>
              <div>
                <label style={labelStyle}>نام درس *</label>
                <input style={inputStyle} placeholder="مثلاً ساختمان داده" value={nCourse} onChange={(e) => setNCourse(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>نام استاد (اختیاری)</label>
                <input style={inputStyle} placeholder="مثلاً دکتر احمدی" value={nTeacher} onChange={(e) => setNTeacher(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={nFree} onChange={() => setNFree(true)} /> رایگان
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={!nFree} onChange={() => setNFree(false)} /> پولی
                </label>
                {!nFree && (
                  <input style={{ ...inputStyle, width: 140 }} placeholder="قیمت (تومان)" inputMode="numeric" value={nPrice} onChange={(e) => setNPrice(e.target.value)} />
                )}
              </div>
              {nFree && (
                <div>
                  <label style={labelStyle}>فایل (اختیاری — حداکثر ۲ مگابایت)</label>
                  <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.png" onChange={(e) => pickNoteFile(e.target.files?.[0])} style={{ fontSize: 12 }} />
                  {nFile && <span style={{ fontSize: 12, color: '#16a34a' }}>✔ {nFile.name}</span>}
                </div>
              )}
              <div>
                <label style={labelStyle}>توضیحات</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="چه ترمی؟ چند صفحه؟ کاغذی یا تایپی؟" value={nDesc} onChange={(e) => setNDesc(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>آیدی تلگرام برای ارتباط *</label>
                <input style={inputStyle} placeholder="@username" dir="ltr" value={nTg} onChange={(e) => setNTg(e.target.value)} />
              </div>
              {nError && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{nError}</p>}
              <button onClick={submitNote} className="btn btn-primary">ثبت آگهی</button>
            </div>

            {/* ── لیست جزوه‌ها ── */}
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedNotes.map((n) => (
                <div key={n.id} className="card card-hover" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="chip chip-active" style={{ cursor: 'default' }}>{n.kind}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: n.isFree ? '#16a34a' : '#d97706',
                    }}>
                      {n.isFree ? 'رایگان 🎁' : `${(n.price ?? 0).toLocaleString('fa-IR')} تومان`}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{n.course}</div>
                  {n.teacher && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>استاد: {n.teacher}</div>}
                  {n.description && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.9 }}>{n.description}</div>}
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`https://t.me/${n.telegram}`} target="_blank" rel="noopener" className="btn btn-soft" style={{ fontSize: 12.5 }}>
                      💬 ارتباط: @{n.telegram}
                    </a>
                    {n.fileData && (
                      <a href={n.fileData} download={n.fileName} className="btn btn-primary" style={{ fontSize: 12.5 }}>
                        ⬇ دانلود {n.fileName}
                      </a>
                    )}
                    <button
                      onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 14 }}
                      aria-label="حذف آگهی"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
              {sortedNotes.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                  هنوز جزوه‌ای ثبت نشده — اولین نفر باشید!
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'tutor' && (
          <>
            {/* ── فرم تدریس ── */}
            <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>➕ آگهی تدریس خودتان را ثبت کنید</div>
              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>اسم شما *</label>
                  <input style={inputStyle} value={tName} onChange={(e) => setTName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>درسی که تدریس می‌کنید *</label>
                  <input style={inputStyle} placeholder="مثلاً حسابان ۱" value={tCourse} onChange={(e) => setTCourse(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={tFree} onChange={() => setTFree(true)} /> رایگان (کمک به بچه‌ها 🤝)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={!tFree} onChange={() => setTFree(false)} /> درآمدی
                </label>
                {!tFree && (
                  <input style={{ ...inputStyle, width: 160 }} placeholder="قیمت هر جلسه (تومان)" inputMode="numeric" value={tPrice} onChange={(e) => setTPrice(e.target.value)} />
                )}
              </div>
              <div>
                <label style={labelStyle}>توضیحات (ساعت، مکان، آنلاین/حضوری)</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>آیدی تلگرام *</label>
                <input style={inputStyle} placeholder="@username" dir="ltr" value={tTg} onChange={(e) => setTTg(e.target.value)} />
              </div>
              <button onClick={submitTutor} className="btn btn-primary">ثبت آگهی تدریس</button>
            </div>

            {/* ── لیست تدریس ── */}
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedTutors.map((t) => (
                <div key={t.id} className="card card-hover" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>👨‍🏫 {t.name} — {t.course}</div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: t.isFree ? '#16a34a' : '#d97706' }}>
                      {t.isFree ? 'رایگان 🎁' : t.price ? `${t.price.toLocaleString('fa-IR')} تومان / جلسه` : 'توافقی'}
                    </span>
                  </div>
                  {t.description && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.9 }}>{t.description}</div>}
                  <a href={`https://t.me/${t.telegram}`} target="_blank" rel="noopener" className="btn btn-soft" style={{ fontSize: 12.5, marginTop: 10, display: 'inline-block' }}>
                    💬 ارتباط: @{t.telegram}
                  </a>
                </div>
              ))}
              {sortedTutors.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                  هنوز آگهی تدریسی ثبت نشده — درسی بلدید؟ تدریس کنید!
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
