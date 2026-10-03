'use client';

import { Suspense, useState } from 'react';
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
  const searchParams = useSearchParams();
  const focusId = searchParams.get('loc');
  const focusIdNumber = focusId ? parseInt(focusId, 10) : undefined;

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
      }}>
        نقشه پردیس
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
