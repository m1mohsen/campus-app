import { NextRequest, NextResponse } from "next/server";

/**
 * فید زنده‌ی کانال‌های عمومی تلگرام از طریق پیش‌نمایش وب (t.me/s/<channel>)
 * — بدون هیچ کلید یا هزینه‌ای. اگر دسترسی مسدود بود (فیلترینگ)، کلاینت
 * به پست‌های ذخیره‌شده‌ی `channels.ts` برمی‌گردد.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchChannel(channel: string) {
  const res = await fetch(`https://t.me/s/${channel}`, {
    headers: { "User-Agent": UA, "Accept-Language": "fa,en;q=0.8" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const title =
    html.match(/<meta property="og:title" content="([^"]*)"/)?.[1]?.trim() ?? channel;

  // هر پیام یک بلوک مستقل است؛ از هر بلوک تاریخ و متن را جدا می‌کنیم
  const posts: { date: string | null; text: string }[] = [];
  const blocks = html.split('<div class="tgme_widget_message_wrap');
  for (const block of blocks.slice(1)) {
    const date = block.match(/datetime="([^"]+)"/)?.[1] ?? null;
    const rawText = block.match(
      /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/
    )?.[1];
    if (!rawText) continue;
    const text = stripHtml(rawText);
    if (text) posts.push({ date, text });
  }

  return { title, posts: posts.slice(-15).reverse() }; // جدیدترین اول
}

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel")?.trim();
  if (!channel || !/^[A-Za-z0-9_]{3,64}$/.test(channel)) {
    return NextResponse.json({ error: "شناسه کانال نامعتبر است" }, { status: 400 });
  }

  try {
    const data = await fetchChannel(channel);
    return NextResponse.json({ ok: true, channel, ...data });
  } catch (err) {
    // تلگرام از داخل ایران معمولاً فیلتر است؛ کلاینت fallback دارد
    const message = err instanceof Error ? err.message : "خطای ناشناخته";
    return NextResponse.json(
      { ok: false, channel, error: message },
      { status: 200 }
    );
  }
}
