'use client';

import { useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import { useLang } from '@/components/LangProvider';
import { campusLocations } from '@/data/locations';
import { spotTags, ALL_SPOT_TAGS } from '@/data/spotTags';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ReviewList } from '@/components/spots/ReviewList';
import { Location } from '@/types/location';

export default function SpotsPage() {
  const { t } = useLang();
  // دیتای شخصی (نظرات) در localStorage — در فاز بعد به Supabase می‌رود
  const [reviews] = useLocalStorage<Record<number, { rating: number; count: number }>>('spotRatings', {});

  const spots = useMemo(
    () =>
      campusLocations.filter(
        (l: Location) => l.category === 'food' || (spotTags[l.id]?.length ?? 0) > 0
      ),
    []
  );

  return (
    <>
      <PageHeader
        icon="☕"
        title={t('spots.title')}
        subtitle={t('spots.subtitle')}
        color="orange"
      />
      <main dir="rtl" style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 48px' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        {spots.map((spot) => {
          const tags = [...(spotTags[spot.id] ?? []), ...(spot.tags ?? [])];
          const r = reviews[spot.id];
          return (
            <div
              key={spot.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{spot.name}</div>
                {r && (
                  <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>
                    ⭐ {r.rating.toFixed(1)} ({r.count})
                  </div>
                )}
              </div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{spot.description}</div>

              {tags.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        background: '#e0e7ff',
                        color: '#3730a3',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <ReviewList spotId={spot.id} spotName={spot.name} />

              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#eef2ff',
                    color: '#1d4ed8',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {t('spots.routeGoogle')}
                </a>
                <a
                  href={`/map?loc=${spot.id}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#eef2ff',
                    color: '#1d4ed8',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {t('spots.onMap')}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 24, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
        {t('spots.tagsLabel')} {ALL_SPOT_TAGS.join(' • ')}
      </p>
      </main>
    </>
  );
}
