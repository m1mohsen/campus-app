// هر مکان دانشگاه چه اطلاعاتی داره
export type LocationCategory =
  | 'academic'    // کلاس، آزمایشگاه
  | 'food'        // سلف، کافه
  | 'admin'       // اداری، دفاتر
  | 'sport'       // ورزشی
  | 'gate'        // در و ورودی‌های دانشگاه
  | 'other';      // بقیه

export interface Location {
  id: number;                 // شناسه عددی (هماهنگ با data/locations.ts)
  name: string;               // نام مکان
  nameEn?: string;            // نام انگلیسی (اختیاری)
  category: LocationCategory;
  lat: number;                // عرض جغرافیایی
  lng: number;                // طول جغرافیایی
  description?: string;       // توضیح کوتاه
  floor?: number;             // طبقه (اگر داخل ساختمان باشه)
  isOpen?: boolean;           // الان باز هست یا نه (مهم برای درها)
  tags?: string[];            // تگ‌های دانشجویی (دنج، اقتصادی، مناسب دیت و...)
}

// نقطه‌ی مورداستفاده در مسیریابی (مکان ذخیره‌شده یا موقعیت لحظه‌ای کاربر)
export interface RoutingLocation {
  id: number;
  lat: number;
  lng: number;
  name: string;
}
