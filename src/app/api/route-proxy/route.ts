import { NextRequest, NextResponse } from "next/server";
import { decodePolyline } from "@/lib/decodePolyline";

/**
 * پروکسی مسیریابی — پاسخ یکپارچه: { ok, mode, points, distanceText, durationText }
 *
 * mode=foot → اول BRouter (پروفایل shortest — مسیر واقعی داخل پردیس رد می‌شود)،
 *             اگر نشد OSRM foot، و در نهایت OSRM خودرو.
 * mode=car  → نشان (اگر کلید کار کند) و در غیر این صورت OSRM.
 */

interface LatLng {
  lat: number;
  lng: number;
}

interface UnifiedRoute {
  points: [number, number][];
  distanceText: string;
  durationText: string;
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
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} دقیقه`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}

/** BRouter با پروفایل shortest — مسیرهای داخل پردیس را هم رد می‌کند */
async function fetchBRouterFoot(origin: LatLng, destination: LatLng): Promise<UnifiedRoute> {
  const lonlats = `${origin.lng},${origin.lat}|${destination.lng},${destination.lat}`;
  const res = await fetch(
    `https://brouter.de/brouter?lonlats=${lonlats}&profile=shortest&alternativeidx=0&format=geojson`,
    { cache: "no-store", signal: AbortSignal.timeout(20000) }
  );
  const text = await res.text();
  let data: {
    features?: {
      properties?: Record<string, string>;
      geometry?: { coordinates?: [number, number][] };
    }[];
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("BRouter error");
  }
  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!coords || coords.length < 2) throw new Error("مسیر پیاده یافت نشد");

  const points = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
  const meters = Number(feature?.properties?.["track-length"] ?? 0);
  const seconds = Number(feature?.properties?.["total-time"] ?? 0);

  return {
    points,
    distanceText: formatDistance(meters),
    durationText: formatDuration(seconds),
  };
}

/** OSRM (foot یا driving) — پاسخ polyline با دقت 1e5 */
async function fetchOSRM(
  origin: LatLng,
  destination: LatLng,
  profile: "foot" | "driving"
): Promise<UnifiedRoute> {
  const base =
    profile === "foot"
      ? "https://routing.openstreetmap.de/routed-foot/route/v1/foot"
      : "https://router.project-osrm.org/route/v1/driving";
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const res = await fetch(`${base}/${coords}?overview=full&geometries=polyline`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`OSRM error ${res.status}`);

  const data = await res.json();
  const route = data?.routes?.[0];
  if (data?.code !== "Ok" || !route?.geometry) throw new Error("مسیر یافت نشد");

  return {
    points: decodePolyline(route.geometry),
    distanceText: formatDistance(route.distance),
    durationText: formatDuration(route.duration),
  };
}

/** نشان (خودرو) — polyline با دقت 1e5 */
async function fetchNeshan(
  origin: LatLng,
  destination: LatLng,
  apiKey: string
): Promise<UnifiedRoute> {
  const res = await fetch(
    `https://api.neshan.org/v4/direction?type=car&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
    { headers: { "Api-Key": apiKey }, cache: "no-store", signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`Neshan error ${res.status}`);
  const data = await res.json();
  const route = data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route?.overview_polyline?.points) throw new Error("مسیر یافت نشد");

  return {
    points: decodePolyline(route.overview_polyline.points),
    distanceText: leg?.distance?.text ?? formatDistance(route.distance ?? 0),
    durationText: leg?.duration?.text ?? formatDuration(route.duration ?? 0),
  };
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
  let result: UnifiedRoute | null = null;
  const errors: string[] = [];

  try {
    if (mode === "foot") {
      // ۱) BRouter — تنها سروری که مسیر داخل پردیس را درست می‌دهد
      try {
        result = await fetchBRouterFoot(origin, destination);
      } catch (e) {
        errors.push(`brouter: ${e instanceof Error ? e.message : "?"}`);
      }
      // ۲) OSRM پیاده
      if (!result) {
        try {
          result = await fetchOSRM(origin, destination, "foot");
        } catch (e) {
          errors.push(`osrm-foot: ${e instanceof Error ? e.message : "?"}`);
        }
      }
      // ۳) آخرین جایگزین: مسیر خودرو
      if (!result) {
        try {
          result = await fetchOSRM(origin, destination, "driving");
        } catch (e) {
          errors.push(`osrm-car: ${e instanceof Error ? e.message : "?"}`);
        }
      }
    } else {
      // خودرو: اول نشان (اگر کلید باشد)، بعد OSRM
      if (apiKey) {
        try {
          result = await fetchNeshan(origin, destination, apiKey);
        } catch (e) {
          errors.push(`neshan: ${e instanceof Error ? e.message : "?"}`);
        }
      }
      if (!result) {
        result = await fetchOSRM(origin, destination, "driving");
      }
    }
  } catch (err) {
    errors.push(`final: ${err instanceof Error ? err.message : "?"}`);
  }

  if (!result) {
    return NextResponse.json(
      { error: "هیچ مسیری پیدا نشد", detail: errors.join(" | ") },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, mode, ...result });
}
