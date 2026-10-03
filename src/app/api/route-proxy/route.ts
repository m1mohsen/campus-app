import { NextRequest, NextResponse } from "next/server";

/**
 * پروکسی مسیریابی: از سرور کلید API را مخفی نگه می‌دارد و پاسخ
 * منابع مختلف را به یک شکل یکسان (سازگار با نشان) برمی‌گرداند.
 *
 * mode=foot → مسیریابی پیاده‌روی (سرور متن‌باز OSM) — مناسب مسیرهای داخل پردیس
 * mode=car  → نشان (اگر کلید کار کند) و در غیر این صورت OSRM
 * اگر مسیر پیاده پیدا نشد، خودکار به خودرو برمی‌گردیم.
 */

interface LatLng {
  lat: number;
  lng: number;
}

function parseLatLng(raw: string): LatLng | null {
  const m = raw.match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} متر`
    : `${(meters / 1000).toFixed(1)} کیلومتر`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} دقیقه`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}

function normalize(route: { geometry: string; distance: number; duration: number }) {
  return {
    routes: [
      {
        overview_polyline: { points: route.geometry },
        legs: [
          {
            distance: { text: formatDistance(route.distance) },
            duration: { text: formatDuration(route.duration) },
          },
        ],
      },
    ],
  };
}

/** پیاده‌روی — سرور متن‌باز OSM (پروفایل foot) */
async function fetchFoot(origin: LatLng, destination: LatLng) {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const res = await fetch(
    `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`,
    { cache: "no-store", signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`OSRM foot error ${res.status}`);

  const data = await res.json();
  const route = data?.routes?.[0];
  if (data?.code !== "Ok" || !route?.geometry) throw new Error("مسیر پیاده یافت نشد");
  return normalize(route);
}

/** خودرو — سرور متن‌باز OSRM */
async function fetchOSRM(origin: LatLng, destination: LatLng) {
  // OSRM ترتیب lng,lat می‌خواهد
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`,
    { cache: "no-store", signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`OSRM error ${res.status}`);

  const data = await res.json();
  const route = data?.routes?.[0];
  if (data?.code !== "Ok" || !route?.geometry) throw new Error("مسیر یافت نشد");
  return normalize(route);
}

/** خودرو — نشان (اگر کلید معتبر باشد) */
async function fetchNeshan(origin: LatLng, destination: LatLng, apiKey: string) {
  const res = await fetch(
    `https://api.neshan.org/v4/direction?type=car&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
    { headers: { "Api-Key": apiKey }, cache: "no-store", signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`Neshan error ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = parseLatLng(searchParams.get("origin") ?? "");
  const destination = parseLatLng(searchParams.get("destination") ?? "");
  const mode = searchParams.get("mode") === "foot" ? "foot" : "car";

  if (!origin || !destination) {
    return NextResponse.json({ error: "مختصات نامعتبر است" }, { status: 400 });
  }

  const apiKey = process.env.NESHAN_API_KEY;

  try {
    if (mode === "foot") {
      // مسیر پیاده؛ اگر نشد مسیر خودرو (بهتر از هیچی)
      try {
        return NextResponse.json(await fetchFoot(origin, destination));
      } catch {
        return NextResponse.json(await fetchOSRM(origin, destination));
      }
    }

    // خودرو: اول نشان (اگر کلید باشد)، در خطا OSRM
    if (apiKey) {
      try {
        const data = await fetchNeshan(origin, destination, apiKey);
        if (data?.routes?.[0]?.overview_polyline?.points) {
          return NextResponse.json(data);
        }
      } catch {
        // رد شدن به OSRM
      }
    }
    return NextResponse.json(await fetchOSRM(origin, destination));
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطای ناشناخته";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
