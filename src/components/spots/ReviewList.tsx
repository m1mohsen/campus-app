'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Review {
  id: number;
  rating: number; // 1..5
  text: string;
  photo?: string; // dataURL (حداکثر ~150KB)
  createdAt: number;
}

interface ReviewListProps {
  spotId: number;
  spotName: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span style={{ fontSize: 20, cursor: onChange ? 'pointer' : 'default' }}>
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

export function ReviewList({ spotId }: ReviewListProps) {
  const [reviews, setReviews] = useLocalStorage<Record<number, Review[]>>(
    'spotReviews',
    {}
  );
  const [open, setOpen] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const list = reviews[spotId] ?? [];
  const avg =
    list.length > 0 ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  function submit() {
    if (draftRating === 0) {
      setError('اول امتیاز بده!');
      return;
    }
    const review: Review = {
      id: Date.now(),
      rating: draftRating,
      text: draftText.trim(),
      photo: draftPhoto,
      createdAt: Date.now(),
    };
    setReviews((prev) => ({ ...prev, [spotId]: [review, ...(prev[spotId] ?? [])] }));
    setOpen(false);
    setDraftRating(0);
    setDraftText('');
    setDraftPhoto(undefined);
    setError(null);
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > 150 * 1024) {
      setError('عکس خیلی بزرگ است (حداکثر ۱۵۰ کیلوبایت) — این محدودیت در نسخه‌ی دیتابیس‌دار برداشته می‌شود');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraftPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ marginTop: 10 }}>
      {/* امتیاز کلی + امتیاز دادن سریع (همیشه دیده می‌شود) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '8px 10px', background: '#f8fafc', borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {list.length > 0 ? (
            <>امتیاز کلی: <strong style={{ color: '#f59e0b' }}>{avg.toFixed(1)}</strong> از ۵ ({list.length} نظر)</>
          ) : (
            'هنوز امتیازی ندارد'
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>امتیاز شما:</span>
          <Stars value={open ? draftRating : 0} onChange={(v) => { setDraftRating(v); setOpen(true); }} />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#f8fafc',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {open ? '✕ بستن' : `💬 نظر دادن${list.length ? ` (${list.length})` : ''}`}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
          <Stars value={draftRating} onChange={setDraftRating} />
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="نظرت چیه؟ (اختیاری)"
            rows={2}
            style={{
              width: '100%',
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
              style={{ fontSize: 12 }}
            />
            {draftPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draftPhoto}
                alt="پیش‌نمایش"
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{error}</p>}
          <button
            onClick={submit}
            style={{
              marginTop: 10,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#1d4ed8',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ثبت نظر
          </button>
        </div>
      )}

      {list.map((r) => (
        <div
          key={r.id}
          style={{
            marginTop: 8,
            padding: '8px 10px',
            background: '#f8fafc',
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Stars value={r.rating} />
            <span style={{ color: '#94a3b8', fontSize: 11 }}>
              {new Date(r.createdAt).toLocaleDateString('fa-IR')}
            </span>
          </div>
          {r.text && <div style={{ marginTop: 4, lineHeight: 1.8 }}>{r.text}</div>}
          {r.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.photo}
              alt="عکس کاربر"
              style={{ marginTop: 6, maxWidth: '100%', maxHeight: 180, borderRadius: 8 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
