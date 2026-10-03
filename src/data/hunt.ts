// نقاط شکار گنج — QR کد هر نقطه را چاپ و در محل چسبانید!
// فرمت محتوای QR: HUNT-<کد>
export interface HuntSpot {
  id: string;
  name: string;
  hint: string;
  code: string;        // بدون پیشوند HUNT-
  reward: string;      // جایزه‌ی اسپانسری (نمونه)
}

export const huntSpots: HuntSpot[] = [
  { id: 'sardar',    name: 'سر در دانشگاه',        hint: 'از جایی که هر روز ازش رد می‌شی شروع کن',        code: 'SARDAR',    reward: '۱۰٪ تخفیف کافه سام (نمونه)' },
  { id: 'library',   name: 'کتاب‌خانه مرکزی',       hint: 'خانه‌ی سکوت و جزوه‌ها',                          code: 'KETAB',     reward: 'جزوه رایگان انتشارات (نمونه)' },
  { id: 'salman',    name: 'سلف سرویس پسران',       hint: 'جایی که صف ناهار معروف است',                    code: 'SALMAN',    reward: 'دسر رایگان (نمونه)' },
  { id: 'hijab',     name: 'سالن حجاب',             hint: 'خانه‌ی والیبال و فوتسال دختران',                code: 'HIJAB',     reward: 'نوشیدنی رایگان (نمونه)' },
  { id: 'bahrami',   name: 'آمفی تئاتر بهرامی',     hint: 'جایی که همایش‌ها برگزار می‌شود',                code: 'BAHRAMI',   reward: 'استیکر کمبو (نمونه)' },
  { id: 'mosque',    name: 'مسجد الشهدا',            hint: 'نقطه‌ی آرامش وسط پردیس',                        code: 'MASJED',    reward: 'چای رایگان (نمونه)' },
];

export const HUNT_PREFIX = 'HUNT-';
