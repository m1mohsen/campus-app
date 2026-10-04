'use client';

import { useEffect, useRef } from 'react';
import {
  Map as MlMap,
  NavigationControl,
  Popup,
  type LayerSpecification,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Location } from '@/types/location';

const CAMPUS_CENTER: [number, number] = [51.507139, 35.742111]; // lng,lat

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

  useEffect(() => {
    if (!containerRef.current) return;

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
      map.remove();
    };
  }, [locations]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 900, background: '#dfe8f2' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

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
