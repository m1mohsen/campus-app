'use client';

import { useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useLang } from '@/components/LangProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ProfessorReviews from '@/components/professors/ProfessorReviews';
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
  const { t } = useLang();
  const [tab, setTab] = useState<'notes' | 'tutor' | 'professors'>('notes');

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
      setNError(t('note.errFileBig'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNFile({ name: file.name, data: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function submitNote() {
    if (!nCourse.trim() || !nTg.trim()) {
      setNError(t('note.errCourseTg'));
      return;
    }
    if (!nFree && !Number(nPrice)) {
      setNError(t('note.errPrice'));
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
        title={t('notes.title')}
        subtitle={t('notes.subtitle')}
        color="violet"
      />
      <main dir="rtl" style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 48px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('notes')}
            className={`chip ${tab === 'notes' ? 'chip-active' : ''}`}
          >
            {t('notes.tabNotes')} ({notes.length})
          </button>
          <button
            onClick={() => setTab('tutor')}
            className={`chip ${tab === 'tutor' ? 'chip-active' : ''}`}
          >
            {t('notes.tabTutor')} ({tutors.length})
          </button>
          <button
            onClick={() => setTab('professors')}
            className={`chip ${tab === 'professors' ? 'chip-active' : ''}`}
          >
            {t('notes.tabProf')}
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-2)', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', lineHeight: 2, marginBottom: 16 }}>
          {t('notes.demoNotice')}
        </p>

        {tab === 'notes' && (
          <>
            {/* ── فرم ثبت جزوه ── */}
            <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('note.addTitle')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {NOTE_KINDS.map((k) => (
                  <button key={k} onClick={() => setNKind(k)} className={`chip ${nKind === k ? 'chip-active' : ''}`}>
                    {t('note.kind.' + k)}
                  </button>
                ))}
              </div>
              <div>
                <label style={labelStyle}>{t('note.course')}</label>
                <input style={inputStyle} placeholder={t('note.coursePh')} value={nCourse} onChange={(e) => setNCourse(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>{t('note.teacher')}</label>
                <input style={inputStyle} placeholder="مثلاً دکتر احمدی" value={nTeacher} onChange={(e) => setNTeacher(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={nFree} onChange={() => setNFree(true)} /> {t('note.free')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={!nFree} onChange={() => setNFree(false)} /> {t('note.paid')}
                </label>
                {!nFree && (
                  <input style={{ ...inputStyle, width: 140 }} placeholder={t('note.price')} inputMode="numeric" value={nPrice} onChange={(e) => setNPrice(e.target.value)} />
                )}
              </div>
              {nFree && (
                <div>
                  <label style={labelStyle}>{t('note.file')}</label>
                  <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.png" onChange={(e) => pickNoteFile(e.target.files?.[0])} style={{ fontSize: 12 }} />
                  {nFile && <span style={{ fontSize: 12, color: '#16a34a' }}>✔ {nFile.name}</span>}
                </div>
              )}
              <div>
                <label style={labelStyle}>{t('note.desc')}</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder={t('note.descPh')} value={nDesc} onChange={(e) => setNDesc(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>{t('note.telegram')}</label>
                <input style={inputStyle} placeholder="@username" dir="ltr" value={nTg} onChange={(e) => setNTg(e.target.value)} />
              </div>
              {nError && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{nError}</p>}
              <button onClick={submitNote} className="btn btn-primary">{t('note.submit')}</button>
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
                      {n.isFree ? `${t('note.free')} 🎁` : `${(n.price ?? 0).toLocaleString('fa-IR')} ${t('note.price')}`}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{n.course}</div>
                  {n.teacher && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>استاد: {n.teacher}</div>}
                  {n.description && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.9 }}>{n.description}</div>}
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`https://t.me/${n.telegram}`} target="_blank" rel="noopener" className="btn btn-soft" style={{ fontSize: 12.5 }}>
                      {t('note.contact')} @{n.telegram}
                    </a>
                    {n.fileData && (
                      <a href={n.fileData} download={n.fileName} className="btn btn-primary" style={{ fontSize: 12.5 }}>
                        {t('note.download')} {n.fileName}
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
                  {t('note.empty')}
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'tutor' && (
          <>
            {/* ── فرم تدریس ── */}
            <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('tutor.addTitle')}</div>
              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>{t('tutor.name')}</label>
                  <input style={inputStyle} value={tName} onChange={(e) => setTName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>{t('tutor.course')}</label>
                  <input style={inputStyle} placeholder={t('tutor.coursePh')} value={tCourse} onChange={(e) => setTCourse(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={tFree} onChange={() => setTFree(true)} /> {t('tutor.freeOpt')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={!tFree} onChange={() => setTFree(false)} /> {t('tutor.paidOpt')}
                </label>
                {!tFree && (
                  <input style={{ ...inputStyle, width: 160 }} placeholder={t('tutor.priceSession')} inputMode="numeric" value={tPrice} onChange={(e) => setTPrice(e.target.value)} />
                )}
              </div>
              <div>
                <label style={labelStyle}>{t('tutor.details')}</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>آیدی تلگرام *</label>
                <input style={inputStyle} placeholder="@username" dir="ltr" value={tTg} onChange={(e) => setTTg(e.target.value)} />
              </div>
              <button onClick={submitTutor} className="btn btn-primary">{t('tutor.submit')}</button>
            </div>

            {/* ── لیست تدریس ── */}
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedTutors.map((tu) => (
                <div key={tu.id} className="card card-hover" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>👨‍🏫 {tu.name} — {tu.course}</div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: tu.isFree ? '#16a34a' : '#d97706' }}>
                      {tu.isFree ? `${t('note.free')} 🎁` : tu.price ? `${tu.price.toLocaleString('fa-IR')} ${t('tutor.perSession')}` : t('tutor.agree')}
                    </span>
                  </div>
                  {tu.description && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.9 }}>{tu.description}</div>}
                  <a href={`https://t.me/${tu.telegram}`} target="_blank" rel="noopener" className="btn btn-soft" style={{ fontSize: 12.5, marginTop: 10, display: 'inline-block' }}>
                    {t('note.contact')} @{tu.telegram}
                  </a>
                </div>
              ))}
              {sortedTutors.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                  {t('tutor.empty')}
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'professors' && <ProfessorReviews />}
      </main>
    </>
  );
}
