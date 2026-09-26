// src/components/ui/FilterBar.tsx
'use client';

import { LocationCategory } from '@/types/location';

const CATEGORIES: { value: LocationCategory | 'all'; label: string }[] = [
  { value: 'all',      label: 'همه' },
  { value: 'academic', label: '🎓 آموزشی' },
  { value: 'food',     label: '🍽️ غذا' },
  { value: 'admin',    label: '🏛️ اداری' },
  { value: 'sport',    label: '⚽ ورزشی' },
  { value: 'other',    label: '📍 سایر' },
];

interface FilterBarProps {
  selected: LocationCategory | 'all';
  onChange: (category: LocationCategory | 'all') => void;
}

export default function FilterBar({ selected, onChange }: FilterBarProps) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '12px 16px',
        background: 'hsl(0 0% 98%)',
        borderBottom: '1px solid hsl(0 0% 90%)',
      }}
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: active ? '2px solid hsl(220 80% 50%)' : '2px solid hsl(0 0% 85%)',
              background: active ? 'hsl(220 80% 50%)' : 'hsl(0 0% 100%)',
              color: active ? '#fff' : 'hsl(0 0% 25%)',
              fontFamily: 'inherit',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
