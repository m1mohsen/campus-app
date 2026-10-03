import type { Location } from "../types/location";
import { campusLocations } from "./locations";

/**
 * 📚 محل کلاس‌ها — این بخش «تدوین» می‌شود: هر ترم محل کلاس‌ها را
 * (ساختمان، طبقه، شماره کلاس) اینجا ثبت کنید تا هم روی نقشه بیاید،
 * هم دستیار پیدایش کند و هم در «برنامه من» قابل انتخاب باشد.
 *
 * الگو: یک رکورد برای هر کلاس/آمفی‌تئاتر درس‌خور.
 * مختصات نمونه‌ها حدودی است — با مختصات دقیق جایگزین کنید.
 */
export const classrooms: Location[] = [
  {
    id: 201,
    name: "کلاس ۱۰۱ — دانشکده کامپیوتر",
    lat: 35.7439400, lng: 51.5022300,
    category: "academic",
    description: "ساختمان کامپیوتر، طبقه اول، انتهای راهرو شرقی",
    floor: 1,
  },
  {
    id: 202,
    name: "کلاس ۲۰۳ — دانشکده کامپیوتر",
    lat: 35.7439500, lng: 51.5022500,
    category: "academic",
    description: "ساختمان کامپیوتر، طبقه دوم، کنار دفتر اساتید",
    floor: 2,
  },
  {
    id: 203,
    name: "آزمایشگاه شبکه — دانشکده کامپیوتر",
    lat: 35.7439300, lng: 51.5022000,
    category: "academic",
    description: "ساختمان کامپیوتر، طبقه اول (برای کلاس‌های عملی)",
    floor: 1,
  },
  {
    id: 204,
    name: "کلاس ۱۰۴ — دانشکده برق",
    lat: 35.7427200, lng: 51.5076600,
    category: "academic",
    description: "ساختمان برق، طبقه اول",
    floor: 1,
  },
  {
    id: 205,
    name: "کلاس ۲۱۲ — دانشکده صنایع",
    lat: 35.7423100, lng: 51.5074900,
    category: "academic",
    description: "ساختمان صنایع، طبقه دوم",
    floor: 2,
  },
  {
    id: 206,
    name: "کلاس ۳۰۵ — دانشکده مکانیک",
    lat: 35.7401800, lng: 51.5045900,
    category: "academic",
    description: "ساختمان مکانیک، طبقه سوم",
    floor: 3,
  },
  {
    id: 207,
    name: "کلاس‌های دانشکده معارف",
    lat: 35.7447200, lng: 51.5024900,
    category: "academic",
    description: "طبق اطلاعیه ترم جاری، کلاس‌های معارف در آمفی تئاتر دانشکده‌ها برگزار می‌شود",
  },
];

/** همه‌ی مکان‌ها: مکان‌های پردیس + کلاس‌های تدوین‌شده */
export const allLocations: Location[] = [...campusLocations, ...classrooms];
