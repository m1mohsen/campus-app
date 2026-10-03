'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { askAssistant, AssistantReply } from '@/lib/assistant';
import { useMergedLocations } from '@/hooks/useAdminData';

interface Message {
  role: 'user' | 'bot';
  text: string;
  links?: { label: string; href: string }[];
}

const SUGGESTIONS = [
  'حذف و اضافه',
  'سلف کجاست؟',
  'دفتر استاد',
  'ساعت کتابخانه',
  'آرایشگاه',
  'مترو',
  'کلاس ۱۰۴ کامپیوتر',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'سلام! من دستیار پردیس هستم 🤖\nسوالت را بپرس: کلاس، استاد، سلف، امور اداری یا مسیر رسیدن به دانشگاه.',
      links: [],
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const locations = useMergedLocations();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(text: string) {
    const question = text.trim();
    if (!question) return;

    const reply: AssistantReply = askAssistant(question, locations);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: question, links: [] },
      { role: 'bot', text: reply.text, links: reply.links },
    ]);
    setInput('');
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 52px)',
      maxWidth: 640,
      margin: '0 auto',
      width: '100%',
    }}>
      <div style={{
        padding: '10px 16px',
        background: 'var(--grad-violet)',
        color: '#fff',
        fontWeight: 700,
      }}>
        🤖 دستیار پردیس
      </div>

      {/* پیشنهادهای سریع */}
      <div dir="rtl" style={{
        display: 'flex',
        gap: 6,
        padding: '10px 12px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
      }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: '#eef2ff',
              color: '#3730a3',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* پیام‌ها */}
      <div dir="rtl" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end',
              marginBottom: 8,
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: 14,
              fontSize: 14,
              lineHeight: 1.9,
              whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? '#1d4ed8' : 'var(--card)',
              color: m.role === 'user' ? '#fff' : 'var(--foreground)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
            }}>
              {m.text}
              {m.links && m.links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {m.links.map((l) =>
                    l.href.startsWith('http') ? (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener"
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: '#fef9c3',
                          color: '#854d0e',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link
                        key={l.href}
                        href={l.href}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: '#eef2ff',
                          color: '#1d4ed8',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {l.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ورودی */}
      <form
        dir="rtl"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="سوالت را بنویس..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1.5px solid var(--border)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#1d4ed8',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ارسال
        </button>
      </form>
    </main>
  );
}
