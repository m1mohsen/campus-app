// ساخت فایل تقویم استاندارد (.ics) برای همگام‌سازی با گوگل کلندر / تقویم موبایل

export interface IcsClass {
  course: string;
  /** 0=شنبه ... 6=جمعه */
  day: number;
  /** "08:00" */
  start: string;
  end: string;
  locationName: string;
}

export interface IcsExam {
  course: string;
  /** "2026-10-20" */
  date: string;
  /** "10:00" */
  time: string;
  location: string;
}

/** ترتیب روزهای هفته‌ی ایرانی → کد day-of-week جاوااسکریپت (شنبه=6) */
const DAY_TO_JS_DAY = [6, 0, 1, 2, 3, 4, 5];
/** شنبه..جمعه → کد BYDAY در iCal */
const DAY_TO_BYDAY = ['SA', 'SU', 'MO', 'TU', 'WE', 'TH', 'FR'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function icalDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeIcal(s: string): string {
  return s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

/** اولین تاریخ آینده‌ی منطبق با روز هفته‌ی داده‌شده (اگر امروز است، امروز) */
function nextOccurrence(jsDay: number): Date {
  const d = new Date();
  const diff = (jsDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

export function buildIcs(classes: IcsClass[], exams: IcsExam[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus App//Paydaas//FA',
    'CALSCALE:GREGORIAN',
  ];

  for (const c of classes) {
    const start = parseTime(c.start);
    const end = parseTime(c.end);
    const d = nextOccurrence(DAY_TO_JS_DAY[c.day] ?? 6);
    const startDt = new Date(d);
    startDt.setHours(start.h, start.m, 0, 0);
    const endDt = new Date(d);
    endDt.setHours(end.h, end.m, 0, 0);

    lines.push(
      'BEGIN:VEVENT',
      `UID:class-${c.course}-${c.day}-${c.start}-${Date.now()}@campus-app`,
      `DTSTART:${icalDate(startDt)}`,
      `DTEND:${icalDate(endDt)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${DAY_TO_BYDAY[c.day] ?? 'SA'}`,
      `SUMMARY:${escapeIcal(c.course)}`,
      `LOCATION:${escapeIcal(c.locationName)}`,
      'END:VEVENT'
    );
  }

  for (const e of exams) {
    const t = parseTime(e.time);
    const [y, mo, da] = e.date.split('-').map(Number);
    if (!y || !mo || !da) continue;
    const startDt = new Date(y, mo - 1, da, t.h, t.m);
    const endDt = new Date(startDt.getTime() + 2 * 60 * 60 * 1000); // پیش‌فرض ۲ ساعت

    lines.push(
      'BEGIN:VEVENT',
      `UID:exam-${e.course}-${e.date}-${Date.now()}@campus-app`,
      `DTSTART:${icalDate(startDt)}`,
      `DTEND:${icalDate(endDt)}`,
      `SUMMARY:${escapeIcal(`امتحان ${e.course}`)}`,
      `LOCATION:${escapeIcal(e.location)}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(content: string, filename = 'campus-schedule.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
