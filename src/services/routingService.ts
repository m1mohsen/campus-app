import type { RoutingLocation } from "@/types/location";

export interface RouteResult {
  polylinePoints: [number, number][];
  distance: string | null;
  duration: string | null;
}

/**
 * دریافت مسیر از سمت سرور (`/api/route-proxy`).
 * mode=foot → مسیر پیاده (داخل پردیس با BRouter) / mode=car → مسیر خودرو.
 * منابع: BRouter و OSRM (رایگان) و نشان به‌عنوان پشتیبان خودرو؛ پاسخ همه
 * در پروکسی یکسان نرمال‌سازی شده است.
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
  if (!data.ok || !Array.isArray(data.points) || data.points.length < 2) {
    throw new Error(data.error ?? "مسیر یافت نشد");
  }

  return {
    polylinePoints: data.points,
    distance: data.distanceText ?? null,
    duration: data.durationText ?? null,
  };
}
