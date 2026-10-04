import { useState, useCallback, useRef, useEffect } from "react";
import { fetchRoute } from "@/services/routingService";
import type { RoutingLocation } from "@/types/location";
import { useLang } from "@/components/LangProvider";

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
  const { t } = useLang();
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
            error: e instanceof Error ? e.message : t("route.errGeneric"),
          });
        });
    },
    [apply, t]
  );

  const selectLocation = useCallback(
    (location: RoutingLocation) => {
      const prev = stateRef.current;

      if (!prev.origin) {
        apply({ ...prev, isActive: true, origin: location });
        // اگر مقصد از قبل انتخاب شده (مثلاً با نگه‌داشتن سریع روی مکان)،
        // همین الان مسیر بگیر
        if (prev.destination) {
          startFetch(location, prev.destination, resolveMode(preferredModeRef.current, location, prev.destination));
        }
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

  // مسیریابی سریع: مکان داده‌شده مقصد می‌شود؛ اگر مبدأ نداریم،
  // موقعیت کاربر خودکار مبدأ می‌شود
  const routeTo = useCallback(
    (location: RoutingLocation) => {
      const prev = stateRef.current;
      const mode = (o: RoutingLocation) => resolveMode(preferredModeRef.current, o, location);

      if (prev.origin) {
        // مبدأ داریم → این مکان مقصد می‌شود (جایگزین مقصد قبلی)
        apply({
          ...prev,
          isActive: true,
          destination: location,
          polylinePoints: [],
          distance: null,
          duration: null,
          error: null,
        });
        startFetch(prev.origin, location, mode(prev.origin));
        return;
      }

      // مبدأ نداریم → مقصد ثبت و موقعیت کاربر مبدأ می‌شود
      apply({
        ...prev,
        isActive: true,
        destination: location,
        polylinePoints: [],
        distance: null,
        duration: null,
        error: null,
      });

      if (!("geolocation" in navigator)) {
        apply({
          ...stateRef.current,
          error: `${t("geo.unsupported")} — ${t("route.pickOrigin")}`,
        });
        return;
      }

      apply({ ...stateRef.current, locating: true });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin: RoutingLocation = {
            id: -1,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: "موقعیت من",
          };
          apply({ ...stateRef.current, locating: false, origin });
          startFetch(origin, location, mode(origin));
        },
        () => {
          apply({
            ...stateRef.current,
            locating: false,
            error: t("geo.denied"),
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    },
    [apply, startFetch, t]
  );

  // «موقعیت من» — مبدأ را به موقعیت لحظه‌ای کاربر تغییر می‌دهد؛
  // اگر مقصد قبلاً انتخاب شده باشد مسیر جدید گرفته می‌شود
  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      apply({ ...stateRef.current, isActive: true, error: t("geo.unsupported") });
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
          1: t("geo.denied"),
          2: t("geo.unavailable"),
          3: t("geo.timeout"),
        };
        apply({
          ...stateRef.current,
          locating: false,
          error: messages[err.code] ?? t("geo.errGeneric"),
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [apply, startFetch, t]);

  const toggleRouting = useCallback(() => {
    abortRef.current?.abort();
    apply(resetRoute({ ...stateRef.current, isActive: !stateRef.current.isActive }));
  }, [apply]);

  const clearRoute = useCallback(() => {
    abortRef.current?.abort();
    apply(resetRoute({ ...stateRef.current, isActive: false }));
  }, [apply]);

  return { state, preferredMode, setPreferredMode, toggleRouting, selectLocation, routeTo, locateMe, clearRoute };
}
