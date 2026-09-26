'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import FilterBar from '@/components/ui/FilterBar';
import SearchBox from '@/components/ui/SearchBox';
import { campusLocations as locations } from '@/data/locations';
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

export default function MapPage() {
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = selectedCategory === 'all'
    ? locations
    : locations.filter(
        (l: (typeof locations)[0]) => l.category === selectedCategory
      );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div dir="rtl" style={{
        padding: '12px 16px',
        background: 'hsl(220 80% 50%)',
        color: '#fff',
        fontSize: '18px',
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
        <CampusMap
          locations={filtered}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

