// رویدادها — ترکیبی از رویدادهای واقعی کانال‌های دانشگاه (مهر ۱۴۰۵) و نمونه‌ها
// منبع: @iust_ac ، @IUST_SSC ، @physical_education_Iust
export type EventCategory = 'فرهنگی' | 'علمی' | 'ورزشی' | 'تشکل';

export interface CampusEvent {
  id: number;
  title: string;
  category: EventCategory;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  place: string;
  description: string;
  source?: string; // کانال منبع خبر
}

export const EVENT_CATEGORIES: EventCategory[] = ['فرهنگی', 'علمی', 'ورزشی', 'تشکل'];

export const campusEvents: CampusEvent[] = [
  {
    id: 101,
    title: 'تمرینات والیبال دانشگاه (هر هفته)',
    category: 'ورزشی',
    date: '2026-10-10',
    time: '18:00',
    place: 'شنبه‌ها: سالن ملک‌لو / دوشنبه‌ها: سالن حجاب',
    description: 'تمرینات تيم والیبال از ابتدای ترم شروع شد؛ نودانشجوها هم می‌توانند شرکت کنند.',
    source: '@iust_ac',
  },
  {
    id: 102,
    title: 'مهلت ثبت‌نام آموزش‌یار/پژوهش‌یار بنیاد نخبگان',
    category: 'علمی',
    date: '2026-10-22',
    time: '23:59',
    place: 'ثبت‌نام آنلاین — sina.bmn.ir',
    description: 'فراخوان سال تحصیلی ۱۴۰۵-۱۴۰۶ بنیاد ملی نخبگان. آخرین فرصت: ۳۰ مهر ۱۴۰۵.',
    source: '@iust_ac',
  },
  {
    id: 103,
    title: 'دوره «کیهان‌شناسی مقدماتی» — انجمن نجوم',
    category: 'تشکل',
    date: '2026-12-30',
    time: '16:00',
    place: 'چهارشنبه‌ها از ۱۰ دی — ثبت‌نام از نگارستان',
    description: 'دوره‌ی آموزشی چهارجلسه‌ای انجمن نجوم و کیهان‌شناسی دانشگاه.',
    source: '@IUST_SSC',
  },
  {
    id: 104,
    title: 'دوره «بحثی در ناتمامیت (گودل)» — انجمن نجوم',
    category: 'تشکل',
    date: '2027-01-01',
    time: '16:00',
    place: 'جمعه‌ها از ۱۲ دی — ثبت‌نام از نگارستان',
    description: 'دوره‌ی بحثی درباره‌ی قضیه‌های ناتمامیت گودل.',
    source: '@IUST_SSC',
  },
  {
    id: 105,
    title: 'رویداد روز پژوهش دانشکده کامپیوتر',
    category: 'علمی',
    date: '2026-10-14',
    time: '10:00',
    place: 'آمفی تئاتر بهرامی',
    description: 'ارائه پروژه‌های دانشجویی و معرفی آزمایشگاه‌ها',
  },
  {
    id: 106,
    title: 'کارگاه رزومه‌نویسی و مصاحبه شغلی',
    category: 'فرهنگی',
    date: '2026-12-10',
    time: '15:00',
    place: 'کتاب‌خانه مرکزی',
    description: 'با همکاری انجمن علمی صنایع (@IUSTIE)',
  },
];
