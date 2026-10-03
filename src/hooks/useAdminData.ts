'use client';

import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { allLocations } from '@/data/classrooms';
import { campusEvents, type CampusEvent } from '@/data/events';
import type { Location } from '@/types/location';

/**
 * لایه‌ی دیتای ادمین — داشبورد `/admin` با این هوک‌ها کار می‌کند.
 * دیتای پایه (فایل‌های src/data) + اضافه‌های ادمین (localStorage) ادغام می‌شوند.
 * در فاز Supabase فقط منبع «custom» عوض می‌شود؛ بقیه‌ی اپ دست‌نخورده می‌ماند.
 */

export function useCustomLocations() {
  return useLocalStorage<Location[]>('adminLocations', []);
}

/** همه‌ی مکان‌ها: پایه (پردیس + کلاس‌ها) + اضافه‌های ادمین */
export function useMergedLocations(): Location[] {
  const [custom] = useCustomLocations();
  return useMemo(() => [...allLocations, ...custom], [custom]);
}

export function useCustomEvents() {
  return useLocalStorage<CampusEvent[]>('adminEvents', []);
}

/** همه‌ی رویدادها: پایه + اضافه‌های ادمین */
export function useMergedEvents(): CampusEvent[] {
  const [custom] = useCustomEvents();
  return useMemo(() => [...campusEvents, ...custom], [custom]);
}
