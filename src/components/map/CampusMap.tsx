'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Location, LocationCategory, RoutingLocation } from '@/types/location';
import { useMergedLocations } from '@/hooks/useAdminData';
import { useRouting, ModePreference } from '@/hooks/useRouting';

const CampusMap3D = dynamic(() => import('./CampusMap3D'), { ssr: false });

const CATEGORY_COLORS: Record<LocationCategory, string> = {
  academic: '#3b82f6',
  food:     '#f97316',
  admin:    '#8b5cf6',
  sport:    '#22c55e',
  gate:     '#0ea5e9',
  other:    '#6b7280',
};

const ORIGIN_COLOR      = '#16a34a';
const DESTINATION_COLOR = '#dc2626';

interface CampusMapProps {
  selectedCategory: LocationCategory | 'all';
  searchQuery: string;
  /** مکان موردنظر از URL (مثلاً لینک «روی نقشه» از دستیار) — باز کردن popup و زوم */
  focusId?: number;
}

const MAP_CENTER: [number, number] = [35.742111, 51.507139];
const DEFAULT_ZOOM = 16;

/* ── آیکون پین (مارکر مکان‌ها و مبدأ/مقصد) ── */
function makePinIcon(color: string, size: number, halo = false): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ${halo ? `outline: 3px solid ${color}55;` : ''}
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
  });
}

/* ── محتوای popup مکان (دیتا استاتیک است؛ اگر بعداً از ورودی کاربر
      بیاید باید escape شود) ── */
function buildPopupHtml(location: Location): string {
  const floorLine =
    location.floor !== undefined
      ? `<p style="margin:4px 0;font-size:13px;color:#555;">طبقه: ${location.floor}</p>`
      : '';

  const openLine =
    location.isOpen !== undefined
      ? `<p style="margin:6px 0 0 0;">
          <span style="
            display:inline-block;
            padding:2px 8px;
            border-radius:12px;
            font-size:12px;
            background-color:${location.isOpen ? '#22c55e' : '#ef4444'};
            color:white;
          ">${location.isOpen ? 'باز' : 'بسته'}</span>
         </p>`
      : '';

  const nameEnLine = location.nameEn
    ? `<p style="margin:4px 0;color:#666;font-size:13px;">${location.nameEn}</p>`
    : '';

  const descLine = location.description
    ? `<p style="margin:8px 0 0 0;font-size:14px;">${location.description}</p>`
    : '';

  const tagsLine = location.tags?.length
    ? `<p style="margin:6px 0 0 0;">${location.tags
        .map((t) => `<span style="display:inline-block;padding:2px 8px;margin:2px 0 2px 4px;border-radius:12px;font-size:11px;background:#e0e7ff;color:#3730a3;">${t}</span>`)
        .join('')}</p>`
    : '';

  // دیپ‌لینک مسیریابی شهری تا همین نقطه
  const { lat, lng } = location;
  const deepLinks = [
    { label: 'نشان',   href: `https://neshan.org/maps/@${lat},${lng},17z,0.0p` },
    { label: 'بلد',    href: `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=17` },
    { label: 'گوگل‌مپ', href: `https://www.google.com/maps?q=${lat},${lng}` },
  ]
    .map(
      (l) =>
        `<a href="${l.href}" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;margin:8px 0 0 4px;border-radius:8px;font-size:12px;background:#1d4ed8;color:white;text-decoration:none;">🧭 ${l.label}</a>`
    )
    .join('');

  return `
    <div style="direction:rtl;text-align:right;font-family:sans-serif;min-width:160px;">
      <h3 style="margin:0 0 6px 0;font-size:16px;font-weight:bold;">${location.name}</h3>
      ${nameEnLine}
      ${descLine}
      ${floorLine}
      ${openLine}
      ${tagsLine}
      <div>${deepLinks}</div>
    </div>
  `;
}

export default function CampusMap({
  selectedCategory,
  searchQuery,
  focusId,
}: CampusMapProps) {
  const mapRef         = useRef<L.Map | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  // کلاستر: روی موبایل به‌جای ۱۵۰ پینِ تو‌در‌تو، خوشه‌های شمارش‌دار
  const baseLayerRef   = useRef<L.MarkerClusterGroup | null>(null);
  const routeLayerRef  = useRef<L.LayerGroup | null>(null); // مبدأ/مقصد
  const polylineRef    = useRef<L.Polyline | null>(null);
  const markersByIdRef = useRef<Map<number, L.Marker>>(new Map());

  const {
    state: routing,
    preferredMode,
    setPreferredMode,
    toggleRouting,
    selectLocation,
    routeTo,
    locateMe,
    clearRoute,
  } = useRouting();
  const locations = useMergedLocations(); // مکان‌های پایه + اضافه‌های داشبورد مدیریت
  const [show3D, setShow3D] = useState(false);

  // آخرین وضعیت مسیریابی برای استفاده داخل کلیک‌هندلر مارکرها،
  // بدون نیاز به بازسازی همه‌ی مارکرها هنگام تغییر انتخاب‌ها
  const routingRef = useRef(routing);
  useEffect(() => {
    routingRef.current = routing;
  }, [routing]);

  const handleMarkerClick = useCallback((location: Location, marker: L.Marker) => {
    if (routingRef.current.isActive) {
      const rl: RoutingLocation = {
        id:   location.id,
        lat:  location.lat,
        lng:  location.lng,
        name: location.name,
      };
      selectLocation(rl);
    } else {
      marker.bindPopup(buildPopupHtml(location)).openPopup();
    }
  }, [selectLocation]);

  /* ── راه‌اندازی نقشه ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // دو لایه‌ی جدا: مکان‌ها (کلاسترشده) فقط هنگام تغییر فیلتر بازسازی
    // می‌شوند و مبدأ/مقصد فقط هنگام تغییر انتخاب
    baseLayerRef.current = L.markerClusterGroup({
      maxClusterRadius: 45,
      showCoverageOnHover: false,
      spiderfyDistanceMultiplier: 1.5,
      disableClusteringAtZoom: 18,
    }).addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current        = null;
      baseLayerRef.current  = null;
      routeLayerRef.current = null;
    };
  }, []);

  /* ── فیلتر مکان‌ها (مکان‌های پردیس + کلاس‌ها + اضافه‌های ادمین) ── */
  const filteredLocations = useMemo(() => locations.filter((loc) => {
    const matchesCategory =
      selectedCategory === 'all' || loc.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.nameEn?.toLowerCase().includes(q) ||
      loc.description?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  }), [locations, selectedCategory, searchQuery]);

  /* ── مارکرهای مکان‌ها (فقط با تغییر فیلتر/جستجو بازسازی می‌شوند) ── */
  useEffect(() => {
    const layer = baseLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    markersByIdRef.current.clear();

    filteredLocations.forEach((location) => {
      const marker = L.marker(
        [location.lat, location.lng],
        { icon: makePinIcon(CATEGORY_COLORS[location.category], 30) }
      );

      marker.bindTooltip(location.name, { direction: 'top', offset: [0, -30] });
      marker.on('click', () => handleMarkerClick(location, marker));

      layer.addLayer(marker);
      markersByIdRef.current.set(location.id, marker);

      // مسیریابی سریع: نگه‌داشتن انگشت (موبایل) یا راست‌کلیک (دسکتاپ)
      const el = marker.getElement();
      if (el) {
        let holdTimer: ReturnType<typeof setTimeout> | null = null;
        const startHold = () => {
          holdTimer = setTimeout(() => {
            holdTimer = null;
            routeTo({
              id: location.id,
              lat: location.lat,
              lng: location.lng,
              name: location.name,
            });
          }, 550);
        };
        const cancelHold = () => {
          if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        };
        el.addEventListener('touchstart', startHold, { passive: true });
        el.addEventListener('touchend', cancelHold);
        el.addEventListener('touchmove', cancelHold);
        el.addEventListener('touchcancel', cancelHold);
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          routeTo({
            id: location.id,
            lat: location.lat,
            lng: location.lng,
            name: location.name,
          });
        });
      }
    });
  }, [filteredLocations, handleMarkerClick, routeTo]);

  /* ── فوکوس روی مکان درخواستی از URL ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!focusId || !map) return;

    const location = locations.find((l) => l.id === focusId);
    if (!location) return;

    map.setView([location.lat, location.lng], 18);
    const marker = markersByIdRef.current.get(focusId);
    if (marker) marker.bindPopup(buildPopupHtml(location)).openPopup();
  }, [focusId, locations, filteredLocations]);

  /* ── مارکرهای مبدأ و مقصد ── */
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (routing.origin) {
      layer.addLayer(L.marker(
        [routing.origin.lat, routing.origin.lng],
        { icon: makePinIcon(ORIGIN_COLOR, 36, true), zIndexOffset: 1000 }
      ));
    }

    if (routing.destination) {
      layer.addLayer(L.marker(
        [routing.destination.lat, routing.destination.lng],
        { icon: makePinIcon(DESTINATION_COLOR, 36, true), zIndexOffset: 1000 }
      ));
    }
  }, [routing.origin, routing.destination]);

  /* ── رسم / پاک‌کردن polyline مسیر ── */
  useEffect(() => {
    if (!mapRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routing.polylinePoints.length > 0) {
      const line = L.polyline(routing.polylinePoints, {
        color:   '#3b82f6',
        weight:  5,
        opacity: 0.8,
      }).addTo(mapRef.current);

      polylineRef.current = line;
      mapRef.current.fitBounds(line.getBounds(), { padding: [40, 40] });
    }
  }, [routing.polylinePoints]);

  /* ── رابط کاربری ── */
  const glass = 'rgba(255,255,255,0.92)';
  const buttonStyle: React.CSSProperties = {
    position:        'absolute',
    right:           '12px',
    zIndex:          1000,
    padding:         '9px 16px',
    borderRadius:    '12px',
    border:          'none',
    cursor:          'pointer',
    fontFamily:      'sans-serif',
    fontSize:        '14px',
    fontWeight:      600,
    color:           'white',
    boxShadow:       '0 4px 14px rgba(15,23,42,0.25)',
    transition:      'background-color 0.2s, transform 0.15s',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* دکمه مسیریابی — در حالت سه‌بعدی مخفی تا با دکمه بازگشت تداخل نکند */}
      {!show3D && (
        <button
          onClick={routing.isActive ? clearRoute : toggleRouting}
          aria-label={routing.isActive ? 'لغو مسیریابی' : 'شروع مسیریابی'}
          style={{
            ...buttonStyle,
            top:             '12px',
            background:      routing.isActive
              ? 'linear-gradient(135deg, #b91c1c, #ef4444)'
              : 'linear-gradient(135deg, #1e40af, #3b82f6)',
          }}
        >
          {routing.isActive ? '✕ لغو مسیریابی' : '🧭 مسیریابی'}
        </button>
      )}

      {/* دکمه موقعیت من */}
      {routing.isActive && !show3D && (
        <button
          onClick={locateMe}
          disabled={routing.locating}
          aria-label="استفاده از موقعیت من به‌عنوان مبدأ"
          style={{
            ...buttonStyle,
            top:             '56px',
            background:      routing.locating
              ? 'linear-gradient(135deg, #9ca3af, #d1d5db)'
              : 'linear-gradient(135deg, #15803d, #22c55e)',
            cursor:          routing.locating ? 'wait' : 'pointer',
          }}
        >
          {routing.locating ? '⏳ در حال دریافت موقعیت...' : '📍 موقعیت من'}
        </button>
      )}

      {/* دکمه نمای سه‌بعدی */}
      <button
        onClick={() => setShow3D((s) => !s)}
        aria-label={show3D ? 'بازگشت به نقشه دوبعدی' : 'نمای سه‌بعدی پردیس'}
        title={show3D ? 'بازگشت به نقشه دوبعدی' : 'نمای سه‌بعدی ساختمان‌های دانشگاه'}
        style={{
          position:        'absolute',
          top:             '84px',
          left:            '12px',
          zIndex:          1000,
          width:           '40px',
          height:          '40px',
          borderRadius:    '12px',
          border:          'none',
          cursor:          'pointer',
          fontSize:        '19px',
          background:      show3D ? 'rgba(15,23,42,0.85)' : glass,
          boxShadow:       '0 4px 14px rgba(15,23,42,0.2)',
          backdropFilter:  'blur(8px)',
          transition:      'transform 0.15s',
        }}
      >
        {show3D ? '🗺' : '🏙'}
      </button>

      {/* پنل راهنمای مسیریابی */}
      {routing.isActive && !show3D && (
        <div
          style={{
            position:        'absolute',
            top:             routing.origin || routing.error || routing.locating ? '100px' : '56px',
            right:           '12px',
            zIndex:          1000,
            padding:         '12px 14px',
            borderRadius:    '14px',
            backgroundColor: glass,
            boxShadow:       '0 8px 28px rgba(15,23,42,0.18)',
            border:          '1px solid rgba(226,232,240,0.9)',
            backdropFilter:  'blur(10px)',
            fontFamily:      'sans-serif',
            fontSize:        '13px',
            direction:       'rtl',
            minWidth:        '215px',
          }}
        >
          {/* انتخابگر حالت مسیریابی */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {([
              { value: 'auto', label: '⚡ خودکار' },
              { value: 'foot', label: '🚶 پیاده' },
              { value: 'car',  label: '🚗 خودرو' },
            ] as { value: ModePreference; label: string }[]).map((m) => (
              <button
                key={m.value}
                onClick={() => setPreferredMode(m.value)}
                style={{
                  flex: 1,
                  padding: '5px 6px',
                  borderRadius: 8,
                  border: preferredMode === m.value ? 'none' : '1px solid var(--border)',
                  background: preferredMode === m.value ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : '#fff',
                  color: preferredMode === m.value ? '#fff' : '#334155',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {routing.locating && (
            <p style={{ margin: 0, color: '#374151' }}>⏳ در حال دریافت موقعیت شما...</p>
          )}

          {!routing.locating && !routing.origin && (
            <p style={{ margin: 0, color: '#374151' }}>📍 روی مبدأ کلیک کنید یا «موقعیت من» را بزنید</p>
          )}

          {routing.origin && !routing.destination && (
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#374151' }}>
                🟢 <strong>{routing.origin.name}</strong>
              </p>
              <p style={{ margin: 0, color: '#6b7280' }}>حالا روی مقصد کلیک کنید</p>
            </div>
          )}

          {routing.origin && routing.destination && !routing.distance && !routing.error && (
            <p style={{ margin: 0, color: '#374151' }}>⏳ در حال دریافت مسیر...</p>
          )}

          {routing.error && (
            <p style={{ margin: 0, color: '#dc2626' }}>{routing.error}</p>
          )}

          {routing.distance && routing.duration && (
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#16a34a', fontWeight: 700 }}>
                {routing.mode === 'foot'
                  ? '🚶 مسیر پیاده‌روی داخل پردیس'
                  : '🚗 مسیر خودرو'}
              </p>
              <p style={{ margin: 0,           color: '#374151' }}>📏 {routing.distance}</p>
              <p style={{ margin: '2px 0 0 0', color: '#374151' }}>
                ⏱ {routing.duration}{routing.mode === 'foot' ? ' پیاده‌روی' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* کانتینر نقشه */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        className="leaflet-container"
      />

      {/* راهنمای مسیریابی سریع */}
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, background: 'rgba(15,23,42,0.78)', color: '#fff',
        padding: '6px 14px', borderRadius: 999, fontSize: 11.5,
        backdropFilter: 'blur(6px)', whiteSpace: 'nowrap', pointerEvents: 'none',
        maxWidth: '94%', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        👆 نگه‌داشتن روی هر مکان (یا راست‌کلیک) = مسیریابی سریع تا آنجا
      </div>

      {/* نمای سه‌بعدی */}
      {show3D && (
        <CampusMap3D locations={locations} onClose={() => setShow3D(false)} />
      )}
    </div>
  );
}
