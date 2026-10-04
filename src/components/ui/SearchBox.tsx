'use client';

import { useLang } from '@/components/LangProvider';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBox({ value, onChange }: SearchBoxProps) {
  const { t, dir } = useLang();
  return (
    <div style={{
      position: 'relative',
      width: '100%',
    }}>
      {/* آیکون ذره‌بین */}
      <span style={{
        position: 'absolute',
        insetInlineEnd: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '16px',
        color: '#64748b',
        pointerEvents: 'none',
      }}>
        🔍
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search.placeholder')}
        style={{
          width: '100%',
          padding: '10px 40px 10px 12px',
          fontSize: '15px',
          color: '#0f172a',
          border: '1.5px solid #cbd5e1',
          borderRadius: '10px',
          outline: 'none',
          direction: dir,
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
      />
    </div>
  );
}

