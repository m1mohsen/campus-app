// هر مکان دانشگاه چه اطلاعاتی داره
export type LocationCategory =
  | 'academic'    // کلاس، آزمایشگاه
  | 'food'        // سلف، کافه
  | 'admin'       // اداری، دفاتر
  | 'sport'       // ورزشی
  | 'other';      // بقیه

export interface Location {
  id: string;
  name: string;               // نام مکان
  nameEn?: string;            // نام انگلیسی (اختیاری)
  category: LocationCategory;
  lat: number;                // عرض جغرافیایی
  lng: number;                // طول جغرافیایی
  description?: string;       // توضیح کوتاه
  floor?: number;             // طبقه (اگر داخل ساختمان باشه)
  isOpen?: boolean;           // الان باز هست یا نه
}
