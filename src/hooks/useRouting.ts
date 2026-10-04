import { useState, useCallback, useRef, useEffect } from "react";
import { fetchRoute } from "@/services/routingService";
import type { RoutingLocation } from "@/types/location";

export type { RoutingLocation };

export type RoutingMode = 'foot' | 'car';
export type ModePreference = 'auto' | RoutingMode;

export interface RoutingState {
  isActive: boolean;
  locating: boolean;               // در حال دریافت موقعیت کاربر
  origin: RoutingLocation | null;
  destination: RoutingLocation | null;
  polylinePoints: [number, number][];
  loading: boolean;
  error: string | null;
  distance: string | null;
  duration: string | null;
  mode: RoutingMode;               // حالتی که واقعاً برای آخرین مسیر استفاده شد
}

/** محدوده‌ی تقریبی پردیس دانشگاه — اگر هر دو نقطه داخل آن باشند مسیر پیاده حساب می‌شود */
const CAMPUS_BOUNDS = {
  minLat: 35.727, maxLat: 35.757,
  minLng: 51.492, maxLng: 51.522,
};

function isInsideCampus(p: RoutingLocation): boolean {
  return (
    p.lat >= CAMPUS_BOUNDS.minLat && p.lat <= CAMPUS_BOUNDS.maxLat &&
    p.lng >= CAMPUS_BOUNDS.minLng && p.lng <= CAMPUS_BOUNDS.maxLng
  );
}

function routeMode(origin: RoutingLocation, destination: RoutingLocation): RoutingMode {
  return isInsideCampus(origin) && isInsideCampus(destination) ? "foot" : "car";
}

function resolveMode(
  preference: ModePreference,
  origin: RoutingLocation,
  destination: RoutingLocation
): RoutingMode {
  if (preference === "auto") return routeMode(origin, destination);
  return preference;
}

const INITIAL_STATE: RoutingState = {
  isActive: false,
  locating: false,
  origin: null,
  destination: null,
  polylinePoints: [],
  loading: false,
  error: null,
  distance: null,
  duration: null,
  mode: "car",
};

function resetRoute(state: RoutingState): RoutingState {
  return {
    ...state,
    origin: null,
    destination: null,
    polylinePoints: [],
    loading: false,
    locating: false,
    error: null,
    distance: null,
    duration: null,
  };
}

export function useRouting() {
  const [state, setState] = useState<RoutingState>(INITIAL_STATE);

  // آخرین وضعیت برای استفاده داخل callbackها. هر تغییر state از طریق
  // apply (که ref را هم به‌روز می‌کند) انجام می‌شود، پس ref همیشه
  // هم‌گام است و نیازی به نوشتن در render نیست.
  const stateRef = useRef(INITIAL_STATE);

  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((next: RoutingState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // ── انتخاب حالت مسیریابی: خودکار (پیاده داخل پردیس)، پیاده یا خودرو ──
  const [preferredMode, setPreferredMode] = useState<ModePreference>('auto');
  const preferredModeRef = useRef(preferredMode);
  useEffect(() => {
    preferredModeRef.current = preferredMode;
  }, [preferredMode]);

  // شروع دریافت مسیر — هر درخواست قبلی را قطع می‌کند تا پاسخ قدیمی
  // جای پاسخ جدید را نگیرد
  const startFetch = useCallback(
    (origin: RoutingLocation, destination: RoutingLocation, mode: RoutingMode) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      apply({ ...stateRef.current, loading: true, error: null, mode });

      fetchRoute(origin, destination, mode, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          apply({
            ...stateRef.current,
            loading: false,
            polylinePoints: result.polylinePoints,
            distance: result.distance,
            duration: result.duration,
          });
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          apply({
            ...stateRef.current,
            loading: false,
            error: e instanceof Error ? e.message : "خطا در دریافت مسیر",
          });
        });
    },
    [apply]
  );

  const selectLocation = useCallback(
    (location: RoutingLocation) => {
      const prev = stateRef.current;

      if (!prev.origin) {
        apply({ ...prev, isActive: true, origin: location });
        return;
      }

      if (!prev.destination) {
        const origin = prev.origin;
        const next: RoutingState = {
          ...prev,
          isActive: true,
          destination: location,
          polylinePoints: [],
          distance: null,
          duration: null,
        };
        apply(next);
        // هر دو انتخاب شدند؛ مسیر را بگیر. حالت: اولویت کاربر — و در
        // حالت خودکار، اگر هر دو نقطه داخل پردیس باشند پیاده‌روی
        startFetch(origin, location, resolveMode(preferredModeRef.current, origin, location));
        return;
      }

      // هر دو قبلاً انتخاب شده‌اند: شروع دوباره با مبدأ جدید
      apply(resetRoute({ ...prev, isActive: true, origin: location }));
    },
    [apply, startFetch]
  );

  // «موقعیت من» — مبدأ را به موقعیت لحظه‌ای کاربر تغییر می‌دهد؛
  // اگر مقصد قبلاً انتخاب شده باشد مسیر جدید گرفته می‌شود
  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      apply({ ...stateRef.current, isActive: true, error: "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند" });
      return;
    }

    apply({ ...stateRef.current, isActive: true, locating: true, error: null });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLocation: RoutingLocation = {
          id: -1, // مکان ذخیره‌شده نیست؛ نباید با هیچ مارکری مطابقت کند
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "موقعیت من",
        };
        const destination = stateRef.current.destination;
        apply({
          ...stateRef.current,
          isActive: true,
          locating: false,
          origin: myLocation,
          destination,
          polylinePoints: [],
          distance: null,
          duration: null,
        });
        if (destination) startFetch(myLocation, destination, resolveMode(preferredModeRef.current, myLocation, destination));
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "دسترسی به موقعیت مکانی رد شد",
          2: "موقعیت مکانی در دسترس نیست",
          3: "دریافت موقعیت بیش از حد طول کشید",
        };
        apply({
          ...stateRef.current,
          locating: false,
          error: messages[err.code] ?? "خطا در دریافت موقعیت",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [apply, startFetch]);

  const toggleRouting = useCallback(() => {
    abortRef.current?.abort();
    apply(resetRoute({ ...stateRef.current, isActive: !stateRef.current.isActive }));
  }, [apply]);

  const clearRoute = useCallback(() => {
    abortRef.current?.abort();
    apply(resetRoute({ ...stateRef.current, isActive: false }));
  }, [apply]);

  return { state, preferredMode, setPreferredMode, toggleRouting, selectLocation, locateMe, clearRoute };
}
