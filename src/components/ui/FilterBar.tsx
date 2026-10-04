'use client';

import { LocationCategory } from '@/types/location';
import { useLang } from '@/components/LangProvider';

const CATEGORIES: { value: LocationCategory | 'all'; key: string }[] = [
  { value: 'all',      key: 'filter.all' },
  { value: 'academic', key: 'filter.academic' },
  { value: 'food',     key: 'filter.food' },
  { value: 'admin',    key: 'filter.admin' },
  { value: 'sport',    key: 'filter.sport' },
  { value: 'gate',     key: 'filter.gate' },
  { value: 'other',    key: 'filter.other' },
];

interface FilterBarProps {
  selected: LocationCategory | 'all';
  onChange: (category: LocationCategory | 'all') => void;
}

export default function FilterBar({ selected, onChange }: FilterBarProps) {
  const { t, dir } = useLang();

  return (
    <div
      dir={dir}
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
            {t(cat.key)}
          </button>
        );
      })}
    </div>
  );
}
