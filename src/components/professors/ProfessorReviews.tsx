'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLang } from '@/components/LangProvider';

/**
 * نظرات دانشجویی درباره اساتید کارشناسی — برای انتخاب واحد آگاهانه.
 * فعلاً روی دستگاه کاربر ذخیره می‌شود؛ در فاز Supabase مشترک و با
 * تایید ادمین می‌شود (برای جلوگیری از توهین و نظرات جعلی).
 */

interface ProfReview {
  id: number;
  course: string;
  rating: number; // 1..5
  text: string;
  term: string;   // مثلاً «ترم تابستان ۱۴۰۵»
  at: number;
}

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

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span style={{ fontSize: 19, cursor: onChange ? 'pointer' : 'default', direction: 'ltr' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange?.(i)}
          style={{ color: i <= value ? '#f59e0b' : '#d1d5db' }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProfessorReviews() {
  const { t } = useLang();
  const [reviews, setReviews] = useLocalStorage<Record<string, ProfReview[]>>(
    'profReviews',
    {}
  );

  const [pName, setPName] = useState('');
  const [pCourse, setPCourse] = useState('');
  const [pRating, setPRating] = useState(0);
  const [pText, setPText] = useState('');
  const [pTerm, setPTerm] = useState('');
  const [pError, setPError] = useState<string | null>(null);

  // خلاصه برای هر استاد: میانگین و تعداد
  const professors = useMemo(() => {
    return Object.entries(reviews)
      .map(([name, list]) => ({
        name,
        list,
        avg: list.reduce((s, r) => s + r.rating, 0) / list.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [reviews]);

  function submit() {
    const name = pName.trim();
    if (!name || !pCourse.trim() || pRating === 0) {
      setPError(t('prof.errRequired'));
      return;
    }
    const review: ProfReview = {
      id: Date.now(),
      course: pCourse.trim(),
      rating: pRating,
      text: pText.trim(),
      term: pTerm.trim(),
      at: Date.now(),
    };
    setReviews((prev) => ({
      ...prev,
      [name]: [review, ...(prev[name] ?? [])],
    }));
    setPName(''); setPCourse(''); setPRating(0); setPText(''); setPTerm('');
    setPError(null);
  }

  return (
    <>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', lineHeight: 2, marginBottom: 14 }}>
        {t('prof.demoNotice')}
      </p>

      {/* ── فرم ثبت نظر ── */}
      <div className="card" style={{ padding: 14, display: 'grid', gap: 10, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{t('prof.addTitle')}</div>
        <div className="form-grid-2">
          <div>
            <label style={labelStyle}>{t('prof.name')}</label>
            <input style={inputStyle} placeholder={t('prof.namePh')} value={pName} onChange={(e) => setPName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{t('prof.course')}</label>
            <input style={inputStyle} placeholder="مثلاً ساختمان داده" value={pCourse} onChange={(e) => setPCourse(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>{t('prof.rating')}</label>
          <div style={{ marginTop: 2 }}>
            <Stars value={pRating} onChange={setPRating} />
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label style={labelStyle}>{t('prof.term')}</label>
            <input style={inputStyle} placeholder={t('prof.termPh')} value={pTerm} onChange={(e) => setPTerm(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>{t('prof.text')}</label>
          <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={pText} onChange={(e) => setPText(e.target.value)} />
        </div>
        {pError && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{pError}</p>}
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.8 }}>
          {t('prof.warn')}
        </p>
        <button onClick={submit} className="btn btn-primary">{t('prof.submit')}</button>
      </div>

      {/* ── لیست اساتید ── */}
      <div style={{ display: 'grid', gap: 12 }}>
        {professors.map(({ name, list, avg }) => (
          <div key={name} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>👨‍🏫 {name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stars value={Math.round(avg)} />
                <strong style={{ fontSize: 13, color: '#f59e0b' }}>{avg.toFixed(1)}</strong>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t('prof.reviewsCount', { n: list.length })}</span>
              </div>
            </div>
            {list.map((r) => (
              <div key={r.id} style={{ marginTop: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.course}</span>
                  <Stars value={r.rating} />
                </div>
                {r.text && <div style={{ marginTop: 4, lineHeight: 1.9 }}>{r.text}</div>}
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                  {r.term && <span>{r.term} — </span>}
                  {new Date(r.at).toLocaleDateString('fa-IR')}
                </div>
              </div>
            ))}
          </div>
        ))}
        {professors.length === 0 && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 24 }}>
            {t('prof.empty')}
          </p>
        )}
      </div>
    </>
  );
}
