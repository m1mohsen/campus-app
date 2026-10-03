# Campus App — نقشه پردیس

نقشه تعاملی پردیس دانشگاه علم و صنعت ایران: جستجوی مکان، فیلتر دسته‌بندی، مسیریابی (OSRM رایگان + نشان به‌عنوان پشتیبان) و دکمه «موقعیت من».

## اجرا

```bash
npm install
npm run dev
```

سپس [http://localhost:3000/map](http://localhost:3000/map) را باز کنید.

## افزودن مکان جدید (کلاس، دفتر استاد و...)

در `src/data/locations.ts` یک رکورد به آرایه اضافه کنید:

```ts
{
  id: 147,                              // عدد یکتا (ادامه‌ی آخرین id)
  name: "کلاس ۲۰۵ دانشکده برق",          // نامی که در جستجو و popup دیده می‌شود
  lat: 35.74272, lng: 51.50766,         // مختصات دقیق نقطه
  category: "academic",                 // academic | food | admin | sport | other
  description: "طبقه دوم، انتهای راهرو", // توضیح اختیاری
  floor: 2,                             // طبقه (اختیاری)
}
```

- گرفتن مختصات: در Google Maps راست‌کلیک روی نقطه → اولین عدد `lat` و دومی `lng`.
- برای دفتر استاد: نام را «دفتر استاد X» بگذارید و شماره اتاق و ساعت مراجعه را در `description` بنویسید.

## مسیریابی

منبع اصلی OSRM (متن‌باز، رایگان و بدون کلید) است. کلید نشان در `.env.local` (`NESHAN_API_KEY`) اختیاری است — اگر کار کند خودکار اولویت پیدا می‌کند، وگرنه OSRM جایگزین می‌شود. هر دو پاسخ در `src/app/api/route-proxy/route.ts` به شکل یکسان نرمال‌سازی می‌شوند.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
