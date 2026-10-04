'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Map as MlMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type LayerSpecification,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Location } from '@/types/location';

// ورکر مپ‌لیبر با Turbopack درست لود نمی‌شود؛ نسخه‌ی استاتیک در public
// (با postinstall همیشه هم‌نسخه‌ی کتابخانه کپی می‌شود)
setWorkerUrl('/maplibre-gl-worker.mjs');

const CAMPUS_CENTER: [number, number] = [51.507139, 35.742111]; // lng,lat

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

interface CampusMap3DProps {
  locations: Location[];
  onClose: () => void;
}

/**
 * نمای سه‌بعدی پردیس — ساختمان‌های واقعی (ارتفاع‌ها از OpenStreetMap)
 * با موتور MapLibre GL و تایل‌های رایگان OpenFreeMap (بدون کلید).
 * چرخش: Ctrl + درگ — شیب: راست‌کلیک + درگ
 */
export default function CampusMap3D({ locations, onClose }: CampusMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fatal] = useState<string | null>(
    typeof window !== 'undefined' && !webglSupported()
      ? 'مرورگر فعلی از WebGL پشتیبانی نمی‌کند — لطفاً در Chrome یا Edge باز کنید'
      : null
  );
  const [errText, setErrText] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (fatal || !containerRef.current) return;

    const map = new MlMap({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: CAMPUS_CENTER,
      zoom: 16.2,
      pitch: 62,
      bearing: -18,
      attributionControl: false,
    });
    map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-left');
    // دسترسی دیباگ از کنسول
    (window as unknown as { __map3d?: MlMap }).__map3d = map;

    // هر خطای تایل/استایل را نمایش بده — نه صفحه‌ی خاکستریِ بی‌توضیح
    map.on('error', (e) => {
      const msg =
        (e as { error?: { message?: string } })?.error?.message ??
        'خطا در بارگذاری کاشی‌های نقشه';
      setErrText(msg);
    });

    // با لود موفق، بنر خطا (اگر هست) پاک شود
    map.on('load', () => setErrText(null));

    // اگر استایل بعد از ۱۲ ثانیه لود نشد، پیام بده
    const styleTimer = setTimeout(() => {
      if (!map.isStyleLoaded()) {
        setErrText('لود استایل نقشه طول کشید — احتمالاً فیلترینگ جلوی سرور تایل‌ها را گرفته');
      }
    }, 12000);

    let cancelled = false;

    map.on('load', () => {
      if (cancelled) return;

      // ── لایه‌ی سه‌بعدی ساختمان‌ها (بالاتر از نقشه پایه، زیر برچسب‌ها) ──
      const layers = (map.getStyle().layers ?? []) as LayerSpecification[];
      const labelLayerId = layers.find(
        (l) =>
          l.type === 'symbol' &&
          (l as unknown as { layout?: Record<string, unknown> }).layout?.['text-field']
      )?.id;

      if (map.getSource('openmaptiles')) {
        map.addLayer(
          {
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 13.5,
            paint: {
              'fill-extrusion-color': [
                'interpolate', ['linear'], ['get', 'render_height'],
                0, '#dbe6f5',
                20, '#b9cbe6',
                60, '#93aed1',
              ],
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.9,
            },
          } as LayerSpecification,
          labelLayerId
        );
      }

      // ── پین مکان‌های دانشگاه ──
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: locations.map((l) => ({
          type: 'Feature',
          properties: { id: l.id, name: l.name },
          geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
        })),
      };

      map.addSource('campus-pins', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'campus-pins',
        type: 'circle',
        source: 'campus-pins',
        paint: {
          'circle-radius': 7,
          'circle-color': '#2563eb',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      const onPinClick = (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const name = String(f.properties?.name ?? '');
        const id = String(f.properties?.id ?? '');
        new Popup({ offset: 12 })
          .setLngLat(coords)
          .setHTML(
            `<div dir="rtl" style="font-family:inherit;min-width:140px;">
               <b style="font-size:14px;">${name}</b><br>
               <a href="/map?loc=${id}" style="color:#2563eb;font-size:13px;text-decoration:none;">🧭 مسیر در نقشه دوبعدی</a>
             </div>`
          )
          .addTo(map);
      };
      map.on('click', 'campus-pins', onPinClick);
      map.on('mouseenter', 'campus-pins', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'campus-pins', () => { map.getCanvas().style.cursor = ''; });
    });

    return () => {
      cancelled = true;
      clearTimeout(styleTimer);
      map.remove();
    };
  }, [locations, fatal, reloadKey]);

  if (fatal) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 900, background: '#dfe8f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div dir="rtl" className="card" style={{ padding: 24, maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🏙</div>
          <p style={{ marginTop: 10, fontSize: 14, lineHeight: 2, color: 'var(--text)' }}>{fatal}</p>
          <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 10 }}>
            بازگشت به نقشه دوبعدی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 900, background: '#dfe8f2' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* بنر خطا (به‌جای صفحه‌ی خاکستری بی‌توضیح) */}
      {errText && (
        <div dir="rtl" style={{
          position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)',
          zIndex: 980, maxWidth: '92%',
          background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
          padding: '10px 14px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.9,
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}>
          ⚠ {errText}
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setErrText(null); setReloadKey((k) => k + 1); }}
              style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fde68a', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
            >
              ↻ تلاش دوباره
            </button>
          </div>
        </div>
      )}

      {/* برچسب راهنما */}
      <div dir="rtl" style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        zIndex: 950, background: 'rgba(15,23,42,0.75)', color: '#fff',
        padding: '6px 14px', borderRadius: 999, fontSize: 12,
        backdropFilter: 'blur(6px)', whiteSpace: 'nowrap',
      }}>
        🏙 نمای سه‌بعدی پردیس — چرخش: Ctrl + درگ | شیب: راست‌کلیک + درگ
      </div>

      {/* اعتبار نقشه */}
      <div dir="ltr" style={{
        position: 'absolute', bottom: 4, right: 6, zIndex: 950,
        fontSize: 10, color: 'rgba(255,255,255,0.9)',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      }}>
        © OpenStreetMap contributors · OpenFreeMap
      </div>

      {/* دکمه بازگشت */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          padding: '9px 16px', borderRadius: 12, border: 'none',
          background: 'rgba(15,23,42,0.85)', color: '#fff',
          fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
          backdropFilter: 'blur(6px)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        }}
      >
        ↩ بازگشت به نقشه دوبعدی
      </button>
    </div>
  );
}
