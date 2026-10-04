import { NextRequest, NextResponse } from "next/server";

/**
 * اطلاعات عمومی کانال‌های بله — بله فید عمومی پست‌ها ندارد، اما
 * عنوان، توضیح و تعداد اعضای کانال‌های عمومی در صفحه‌ی وبشان هست.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

function unescapeBale(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\+/g, "")
    .trim();
}

async function fetchBaleChannel(channel: string) {
  const res = await fetch(`https://ble.ir/${channel}`, {
    headers: { "User-Agent": UA },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // og:title مثل: «بله | کانال آموزش دانشگاه علم و صنعت ایران»
  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? "";
  const title = ogTitle.replace(/^بله\s*\|\s*/, "").trim() || channel;

  // RSC payload داخل HTML به‌صورت escape شده است (\"members\":12066)
  const members = html.match(/\\?"members\\?":(\d+)/)?.[1] ?? null;

  // توضیح کانال: از \"description\":\" تا \",
  let description: string | null = null;
  const marker = '\\"description\\":\\"';
  const di = html.indexOf(marker);
  if (di >= 0) {
    const start = di + marker.length;
    const end = html.indexOf('\\",', start);
    if (end > start) description = unescapeBale(html.slice(start, end));
  }

  return { title, description, members: members ? Number(members) : null };
}

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel")?.trim();
  if (!channel || !/^[A-Za-z0-9_]{3,64}$/.test(channel)) {
    return NextResponse.json({ error: "شناسه کانال نامعتبر است" }, { status: 400 });
  }

  try {
    const data = await fetchBaleChannel(channel);
    return NextResponse.json({ ok: true, channel, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطای ناشناخته";
    return NextResponse.json({ ok: false, channel, error: message }, { status: 200 });
  }
}
