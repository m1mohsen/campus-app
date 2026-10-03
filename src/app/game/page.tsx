'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { huntSpots, HUNT_PREFIX } from '@/data/hunt';
import { quizQuestions } from '@/data/quiz';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ensureNotificationPermission, notify } from '@/lib/notify';

interface ChatMsg {
  id: number;
  name: string;
  text: string;
  at: number;
}

// ── لیدربورد نمونه — در فاز دیتابیس، امتیاز واقعی همه کاربران می‌آید
const MOCK_LEADERS = [
  { name: 'آرش (کامپیوتر ۴۰۲)', score: 210 },
  { name: 'نگار (مواد ۴۰۱)', score: 180 },
  { name: 'سینا (برق ۴۰۳)', score: 150 },
  { name: 'مینا (صنایع ۴۰۲)', score: 120 },
  { name: 'حسین (عمران ۴۰۴)', score: 90 },
];

export default function GamePage() {
  // ── اسکونجر هانت ──
  const [found, setFound] = useLocalStorage<string[]>('huntFound', []);
  const [codeInput, setCodeInput] = useState('');
  const [huntMsg, setHuntMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanStopRef = useRef<(() => void) | null>(null);

  // ── کوییز ──
  const [quizBest, setQuizBest] = useLocalStorage<number>('quizBest', 0);
  const [qIndex, setQIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const stopScan = useCallback(() => {
    scanStopRef.current?.();
    scanStopRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stopScan, [stopScan]);

  async function startScan() {
    const w = window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } };
    if (!('BarcodeDetector' in w)) {
      setHuntMsg('مرورگر شما اسکن دوربین ندارد — کد را دستی وارد کنید (فقط برای QR باید جایزه بگیرید 😄)');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setScanning(true);
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const detector = new w.BarcodeDetector!({ formats: ['qr_code'] });
      const timer = setInterval(async () => {
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) {
            handleCode(codes[0].rawValue);
            stopScan();
          }
        } catch {
          /* فریم بعد */
        }
      }, 500);

      scanStopRef.current = () => {
        clearInterval(timer);
        stream.getTracks().forEach((t) => t.stop());
      };
    } catch {
      setHuntMsg('دسترسی به دوربین داده نشد.');
      setScanning(false);
    }
  }

  function handleCode(raw: string) {
    const code = raw.trim().toUpperCase().replace(HUNT_PREFIX, '');
    const spot = huntSpots.find((s) => s.code === code);
    if (!spot) {
      setHuntMsg('این کد مربوط به هیچ نقطه‌ای نیست! راهنمایی: ' + (huntSpots.find((s) => !found.includes(s.id))?.hint ?? ''));
      return;
    }
    if (found.includes(spot.id)) {
      setHuntMsg(`نقطه‌ی «${spot.name}» را قبلاً پیدا کرده بودی!`);
      return;
    }
    const next = [...found, spot.id];
    setFound(next);
    setHuntMsg(`🎉 آفرین! «${spot.name}» را پیدا کردی. جایزه: ${spot.reward}`);
    ensureNotificationPermission().then((ok) => {
      if (ok) notify('🎉 شکار موفق!', `${spot.name} — ${next.length}/${huntSpots.length}`);
    });
  }

  function submitCode() {
    handleCode(codeInput);
    setCodeInput('');
  }

  // ── کوییز ──
  function startQuiz() {
    setQIndex(0);
    setScore(0);
    setPicked(null);
  }

  function answerQuiz(option: number) {
    if (picked !== null) return;
    setPicked(option);
    if (option === quizQuestions[qIndex!].answer) setScore((s) => s + 1);
    setTimeout(() => {
      if (qIndex! + 1 >= quizQuestions.length) {
        const final = score + (option === quizQuestions[qIndex!].answer ? 1 : 0);
        setQuizBest((b) => Math.max(b, final));
        setQIndex(quizQuestions.length); // صفحه‌ی نتیجه
      } else {
        setQIndex(qIndex! + 1);
        setPicked(null);
      }
    }, 900);
  }

  const userScore = found.length * 10 + quizBest * 5;
  const leaderboard = [...MOCK_LEADERS, { name: 'شما ⭐', score: userScore }].sort((a, b) => b.score - a.score);

  // ── چت دانشجوها ──
  // نسخه‌ی نمایشی: پیام‌ها بین همه‌ی تب‌های باز همین دستگاه همگام می‌شوند
  // (BroadcastChannel). چت واقعی بین دانشجوهای مختلف با اتصال به
  // دیتابیس (Supabase Realtime) فعال می‌شود.
  const [chat, setChat] = useLocalStorage<ChatMsg[]>('gameChat', []);
  const [chatName, setChatName] = useLocalStorage<string>('chatName', '');
  const [chatText, setChatText] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel('campus-chat');
    bc.onmessage = (e: MessageEvent<ChatMsg>) => {
      setChat((prev) => [...prev.slice(-99), e.data]);
    };
    bcRef.current = bc;
    return () => bc.close();
  }, [setChat]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight });
  }, [chat]);

  function sendChat() {
    const text = chatText.trim();
    if (!text) return;
    const msg: ChatMsg = {
      id: Date.now(),
      name: chatName.trim() || 'دانشجوی ناشناس',
      text,
      at: Date.now(),
    };
    setChat((prev) => [...prev.slice(-99), msg]);
    bcRef.current?.postMessage(msg);
    setChatText('');
  }

  return (
    <>
      <PageHeader
        icon="🎮"
        title="شکار گنج و بازی"
        subtitle="QR های مخفی پردیس را پیدا کن، در کوییز رقابت کن و بالا بیا!"
        color="violet"
      />
      <main dir="rtl" style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 48px' }}>
      {/* ═══ اسکونجر هانت ═══ */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>🧭 شکار گنج با QR</h2>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{found.length} از {huntSpots.length}</span>
        </div>

        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(found.length / huntSpots.length) * 100}%`, background: '#16a34a', transition: 'width 300ms' }} />
        </div>

        <p style={{ marginTop: 10, fontSize: 13, color: '#64748b', lineHeight: 1.9 }}>
          دور پردیس بگرد، QR کدهای مخفی را پیدا کن و اسکن کن (یا کد را دستی وارد کن). جوایز اسپانسری از کافه‌های اطراف!
        </p>

        {scanning && (
          <div style={{ marginTop: 10 }}>
            <video ref={videoRef} style={{ width: '100%', borderRadius: 10 }} muted playsInline />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {scanning ? (
            <button onClick={stopScan} style={{ ...btnStyle, background: '#dc2626' }}>توقف دوربین</button>
          ) : (
            <button onClick={startScan} style={btnStyle}>📷 اسکن QR</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitCode()}
            placeholder="یا کد را دستی وارد کن (مثلاً HUNT-KETAB)"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 13,
              direction: 'ltr',
              textAlign: 'left',
            }}
          />
          <button onClick={submitCode} style={{ ...btnStyle, background: '#475569' }}>ثبت کد</button>
        </div>

        {huntMsg && (
          <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#1d4ed8', lineHeight: 1.8 }}>{huntMsg}</p>
        )}

        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {huntSpots.map((s) => {
            const done = found.includes(s.id);
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span>{done ? '✅' : '⬜'}</span>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                {!done && <span style={{ color: '#94a3b8', fontSize: 12 }}>— {s.hint}</span>}
                {done && <span style={{ color: '#16a34a', fontSize: 12 }}>— {s.reward}</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ کوییز ═══ */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>🧠 کوییز پردیس</h2>
          <span style={{ fontSize: 13, color: '#64748b' }}>رکورد شما: {quizBest}/{quizQuestions.length}</span>
        </div>

        {qIndex === null && (
          <button onClick={startQuiz} style={{ ...btnStyle, marginTop: 12 }}>شروع کوییز</button>
        )}

        {qIndex !== null && qIndex < quizQuestions.length && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.8 }}>
              سوال {qIndex + 1} از {quizQuestions.length}: {quizQuestions[qIndex].question}
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {quizQuestions[qIndex].options.map((opt, i) => {
                const correct = i === quizQuestions[qIndex].answer;
                const showColor = picked !== null && (correct || i === picked);
                return (
                  <button
                    key={i}
                    onClick={() => answerQuiz(i)}
                    style={{
                      textAlign: 'right',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: showColor
                        ? `2px solid ${correct ? '#16a34a' : '#dc2626'}`
                        : '1px solid var(--border)',
                      background: showColor ? (correct ? '#dcfce7' : '#fee2e2') : '#fff',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {qIndex === quizQuestions.length && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>
              امتیاز: {score} از {quizQuestions.length}
            </div>
            <button onClick={startQuiz} style={{ ...btnStyle, marginTop: 12 }}>دوباره</button>
          </div>
        )}
      </section>

      {/* ═══ چت دانشجوها ═══ */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>💬 گفتگوی دانشجوها</h2>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>نسخه نمایشی — همگام بین تب‌ها</span>
        </div>

        <div
          ref={chatBoxRef}
          style={{
            marginTop: 10,
            height: 200,
            overflowY: 'auto',
            background: '#f8fafc',
            borderRadius: 10,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {chat.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 12.5, textAlign: 'center', margin: 'auto' }}>
              اولین پیام را بفرست! 😊
            </p>
          )}
          {chat.map((m) => {
            const mine = m.name === (chatName.trim() || 'دانشجوی ناشناس');
            return (
              <div key={m.id} style={{ alignSelf: mine ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                <div style={{
                  padding: '7px 11px',
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.8,
                  background: mine ? '#dcfce7' : '#e0e7ff',
                  wordBreak: 'break-word',
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2, textAlign: mine ? 'right' : 'left' }}>
                  {mine ? 'شما' : m.name} — {new Date(m.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="اسمت (برای نمایش)"
            style={{
              width: 130,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 12.5,
              flexShrink: 0,
            }}
          />
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="پیامت را بنویس..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 13,
            }}
          />
          <button onClick={sendChat} style={{ ...btnStyle, padding: '8px 14px' }}>ارسال</button>
        </div>

        <p style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.8 }}>
          🔮 در نسخه‌ی دیتابیس‌دار، این چت بین همه‌ی دانشجوهای آنلاین زنده می‌شود (Supabase Realtime).
        </p>
      </section>

      {/* ═══ لیدربورد ═══ */}
      <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>🏆 لیدربورد</h2>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          امتیاز شما: هر نقطه‌ی شکار ۱۰ + هر جواب درست ۵ (در نسخه‌ی دیتابیس‌دار، رقابت واقعی بین همه است)
        </p>
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {leaderboard.map((row, i) => (
            <div
              key={row.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: row.name === 'شما ⭐' ? '#eef2ff' : '#f8fafc',
                fontWeight: row.name === 'شما ⭐' ? 700 : 400,
                fontSize: 14,
              }}
            >
              <span style={{ width: 24 }}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</span>
              <span style={{ flex: 1 }}>{row.name}</span>
              <span style={{ fontWeight: 700 }}>{row.score}</span>
            </div>
          ))}
        </div>
      </section>
      </main>
    </>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 8,
  border: 'none',
  background: '#1d4ed8',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};
