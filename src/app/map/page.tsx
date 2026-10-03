'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import FilterBar from '@/components/ui/FilterBar';
import SearchBox from '@/components/ui/SearchBox';
import { LocationCategory } from '@/types/location';

const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'hsl(0 0% 96%)',
      color: 'hsl(0 0% 50%)',
      fontSize: '16px',
    }}>
      در حال بارگذاری نقشه...
    </div>
  ),
});

function MapPageInner() {
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCampusImage, setShowCampusImage] = useState(false);
  const searchParams = useSearchParams();
  const focusId = searchParams.get('loc');
  const focusIdNumber = focusId ? parseInt(focusId, 10) : undefined;

  // بستن نمایشگر نقشه با Esc
  useEffect(() => {
    if (!showCampusImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCampusImage(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCampusImage]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 52px)',
      fontFamily: 'inherit',
    }}>
      <div dir="rtl" style={{
        padding: '10px 16px',
        background: 'var(--grad-blue)',
        color: '#fff',
        fontSize: '17px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <span>نقشه پردیس</span>
        <button
          onClick={() => setShowCampusImage(true)}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          🖼 نقشه اصلی دانشگاه
        </button>
      </div>

      <div style={{
        padding: '12px 16px',
        background: 'hsl(0 0% 98%)',
        borderBottom: '1px solid hsl(0 0% 90%)'
      }}>
        <SearchBox value={searchQuery} onChange={setSearchQuery} />
      </div>

      <FilterBar
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        {/* فیلتر دسته‌بندی و جستجو داخل CampusMap انجام می‌شود */}
        <CampusMap
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          focusId={focusIdNumber}
        />
      </div>

      {/* نمایشگر نقشه‌ی اصلی دانشگاه */}
      {showCampusImage && (
        <div
          onClick={() => setShowCampusImage(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            cursor: 'zoom-out',
          }}
        >
          <div dir="rtl" style={{
            alignSelf: 'stretch',
            maxWidth: 800,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 10,
          }}>
            <span>🖼 نقشه اصلی پردیس دانشگاه</span>
            <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.8 }}>
              برای بستن کلیک کنید یا Esc بزنید
            </span>
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 800,
            flex: 1,
            cursor: 'default',
          }}>
            <Image
              src="/campus-map.jpg"
              alt="نقشه اصلی پردیس دانشگاه علم و صنعت ایران"
              fill
              className="object-contain"
              sizes="(max-width: 800px) 100vw, 800px"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageInner />
    </Suspense>
  );
}
