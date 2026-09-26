'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, LocationCategory } from '@/types/location';

// رنگ‌های مارکر برای هر دسته
const CATEGORY_COLORS: Record<LocationCategory, string> = {
  academic: '#3b82f6',  // آبی
  food: '#f97316',      // نارنجی
  admin: '#8b5cf6',     // بنفش
  stop: '#22c55e',      // سبز
  other: '#6b7280'      // خاکستری
};

interface CampusMapProps {
  locations: Location[];
  selectedCategory: LocationCategory | 'all';
  searchQuery: string;
}

export default function CampusMap({ locations, selectedCategory, searchQuery }: CampusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // مختصات مرکز نقشه (تهران - بعداً عوض می‌کنی)
  const MAP_CENTER: [number, number] = [35.7219, 51.3347];
  const DEFAULT_ZOOM = 16;

  // راه‌اندازی نقشه
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // ساخت نقشه
    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true
    });

    // اضافه کردن لایه OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // فیلتر کردن مکان‌ها
  const filteredLocations = locations.filter(loc => {
    const matchesCategory = selectedCategory === 'all' || loc.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.nameEn?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // به‌روزرسانی مارکرها
  useEffect(() => {
    if (!mapRef.current) return;

    // پاک کردن مارکرهای قبلی
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // اضافه کردن مارکرهای جدید
    filteredLocations.forEach(location => {
      const color = CATEGORY_COLORS[location.category];
      
      // آیکون رنگی برای مارکر
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([location.lat, location.lng], { icon })
        .bindPopup(`
          <div style="direction: rtl; text-align: right; font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
              ${location.name}
            </h3>
            ${location.nameEn ? `<p style="margin: 4px 0; color: #666; font-size: 13px;">${location.nameEn}</p>` : ''}
            ${location.description ? `<p style="margin: 8px 0 0 0; font-size: 14px;">${location.description}</p>` : ''}
            ${location.floor ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #888;">طبقه ${location.floor}</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 12px;">
              <span style="
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                background-color: ${location.isOpen ? '#22c55e' : '#ef4444'};
                color: white;
              ">
                ${location.isOpen ? 'باز' : 'بسته'}
              </span>
            </p>
          </div>
        `)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [filteredLocations]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%' }}
      className="leaflet-container"
    />
  );
}
