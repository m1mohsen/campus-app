import { decodePolyline } from "@/lib/decodePolyline";
import type { RoutingLocation } from "@/types/location";

export interface RouteResult {
  polylinePoints: [number, number][];
  distance: string | null;
  duration: string | null;
}

/**
 * دریافت مسیر از سمت سرور (`/api/route-proxy`).
 * mode=foot → مسیر پیاده (داخل پردیس) / mode=car → مسیر خودرو.
 * منبع اصلی OSRM رایگان است و نشان (در صورت کارکردن کلید) برای خودرو
 * اولویت دارد؛ پاسخ همه یکسان نرمال‌سازی شده است.
 */
export async function fetchRoute(
  origin: RoutingLocation,
  destination: RoutingLocation,
  mode: "foot" | "car" = "car",
  signal?: AbortSignal
): Promise<RouteResult> {
  const res = await fetch(
    `/api/route-proxy?mode=${mode}&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
    { signal }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `خطای سرور (${res.status})`);
  }

  const data = await res.json();
  const encoded = data.routes?.[0]?.overview_polyline?.points;
  const leg = data.routes?.[0]?.legs?.[0];

  if (!encoded) throw new Error("مسیر یافت نشد");

  return {
    polylinePoints: decodePolyline(encoded),
    distance: leg?.distance?.text ?? null,
    duration: leg?.duration?.text ?? null,
  };
}
