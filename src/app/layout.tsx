import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PWARegister from "@/components/PWARegister";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: {
    default: "پردیس — اپ جامع دانشجویی",
    template: "%s | پردیس",
  },
  description:
    "نقشه پردیس، دستیار هوشمند، پاتوق‌های اطراف، برنامه کلاس‌ها، رویدادها و سرگرمی — همه‌ی نیازهای دانشجویی در یک اپ",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body>
        <NavBar />
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
