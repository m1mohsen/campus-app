import type { Location } from '../types/location';
import type { Lang } from '../lib/i18n';

/**
 * ترجمه‌ی نام مکان‌های مهم دانشگاه به انگلیسی و عربی.
 * کلید = id در locations.ts. مکان‌هایی که ترجمه ندارند
 * (مثل مغازه‌های اطراف) با نام اصلی نمایش داده می‌شوند.
 */
export const locNameOverrides: Record<number, { en: string; ar: string }> = {
  // ── دانشکده‌ها و بخش‌های آموزشی ──
  2:   { en: 'Iran University of Science & Technology (IUST)', ar: 'جامعة العلوم والتكنولوجيا الإيرانية' },
  3:   { en: 'Faculty of Mechanical, Civil & Architecture', ar: 'كلية الهندسة الميكانيكية والمدنية والمعمارية' },
  4:   { en: 'Faculty of Industrial Engineering', ar: 'كلية الهندسة الصناعية' },
  5:   { en: 'Faculty of Materials & Chemical Engineering', ar: 'كلية هندسة المواد والكيمياء' },
  6:   { en: 'Faculty of Automotive Engineering', ar: 'كلية هندسة السيارات' },
  7:   { en: 'Faculty of Electrical Engineering', ar: 'كلية الهندسة الكهربائية' },
  8:   { en: 'Faculty of Railway Engineering', ar: 'كلية هندسة السكك الحديدية' },
  9:   { en: 'Faculty of Computer Engineering', ar: 'كلية هندسة الحاسوب' },
  10:  { en: 'Department of Physics', ar: 'قسم الفيزياء' },
  11:  { en: 'Department of Mathematics', ar: 'قسم الرياضيات' },
  12:  { en: 'Islamic Studies Department (Maaref)', ar: 'قسم المعارف الإسلامية' },
  13:  { en: 'Central Library', ar: 'المكتبة المركزية' },
  15:  { en: 'Department of Foreign Languages', ar: 'قسم اللغات الأجنبية' },
  38:  { en: 'Civil Engineering Building 2', ar: 'مبنى الهندسة المدنية ٢' },
  56:  { en: 'Old Electrical Engineering Building', ar: 'مبنى الكهرباء القديم' },
  112: { en: 'Gamification Academy', ar: 'أكاديمية التلعيب' },

  // ── تغذیه ──
  1:   { en: 'Boys’ Cafeteria', ar: 'المطعم الجامعي - طلاب' },
  14:  { en: 'Girls’ Cafeteria', ar: 'المطعم الجامعي - طالبات' },
  61:  { en: 'Faculty Cafeteria', ar: 'مطعم هيئة التدريس' },
  121: { en: 'Dormitory Cafeteria', ar: 'مطعم السكن الجامعي' },
  148: { en: 'Computer Faculty Buffet', ar: 'بوفية كلية الحاسوب' },

  // ── ورزشی ──
  16:  { en: 'University Swimming Pool', ar: 'مسبح الجامعة' },
  33:  { en: 'Melkloo Sports Hall', ar: 'صالة ملك‌لو الرياضية' },
  44:  { en: 'Hejab Sports Hall', ar: 'صالة الحجاب الرياضية' },
  34:  { en: 'Environment Dome', ar: 'قبة البيئة' },

  // ── اداری و خدمات ──
  40:  { en: 'University Health Center', ar: 'المركز الصحي للجامعة' },
  43:  { en: 'University President’s Building', ar: 'مبنى رئاسة الجامعة' },
  133: { en: 'University Daycare', ar: 'حضانة الجامعة' },
  147: { en: 'University Press & Bookstore', ar: 'مطبعة الجامعة ومكتبتها' },
  24:  { en: 'Alghadir Hospital', ar: 'مستشفى الغدير' },

  // ── درها ──
  65:  { en: 'Gate No. 2', ar: 'البوابة رقم ٢' },
  66:  { en: 'Main Gate', ar: 'البوابة الرئيسية' },
  149: { en: 'Khatam Dorm North Gate', ar: 'البوابة الشمالية لسكن خاتم' },

  // ── مساجد و آمفی‌تئاترها ──
  21:  { en: 'Imam Sajjad Mosque', ar: 'مسجد الإمام السجاد' },
  46:  { en: 'Al-Shohada Mosque', ar: 'مسجد الشهداء' },
  62:  { en: 'Imam Khomeini Amphitheater', ar: 'مدرج الإمام الخميني' },
  63:  { en: 'Bahrami Amphitheater', ar: 'مدرج البهرامي' },
  64:  { en: 'Open-Air Theater', ar: 'المسرح المكشوف' },

  // ── آزمایشگاه‌ها و مراکز ──
  32:  { en: 'Traffic Research Lab', ar: 'مختبر أبحاث المرور' },
  37:  { en: 'Smart City Lab', ar: 'مختبر المدينة الذكية' },
  48:  { en: 'Khatam Dormitory', ar: 'سكن خاتم الجامعي' },

  // ── کلاس‌ها و دفاتر اساتید (نمونه) ──
  145: { en: 'Class 104 — Computer Faculty', ar: 'قاعة ١٠٤ — كلية الحاسوب' },
  146: { en: 'Professor’s Office (sample)', ar: 'مكتب أستاذ (نموذج)' },
  201: { en: 'Class 101 — Computer Faculty', ar: 'قاعة ١٠١ — كلية الحاسوب' },
  202: { en: 'Class 203 — Computer Faculty', ar: 'قاعة ٢٠٣ — كلية الحاسوب' },
  203: { en: 'Network Lab — Computer Faculty', ar: 'مختبر الشبكات — كلية الحاسوب' },
  204: { en: 'Class 104 — Electrical Faculty', ar: 'قاعة ١٠٤ — كلية الكهرباء' },
  205: { en: 'Class 212 — Industrial Faculty', ar: 'قاعة ٢١٢ — كلية الصناعية' },
  206: { en: 'Class 305 — Mechanical Faculty', ar: 'قاعة ٣٠٥ — كلية الميكانيكا' },
  207: { en: 'Maaref Classes', ar: 'قاعات المعارف' },
};

/** نام نمایشی مکان بر اساس زبان فعلی */
export function locationName(loc: Location, lang: Lang): string {
  if (lang === 'fa') return loc.name;
  return locNameOverrides[loc.id]?.[lang] ?? loc.name;
}
