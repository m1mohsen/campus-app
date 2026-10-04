import { allLocations } from "@/data/classrooms";
import { faqs } from "@/data/faq";
import { locationName } from "@/data/locationNames";
import type { Location } from "@/types/location";
import type { Lang as LangCode } from "@/lib/i18n";

export interface AssistantReply {
  text: string;
  links: { label: string; href: string }[];
}

/** یکسان‌سازی ی/ک عربی و حذف نیم‌فاصله برای جستجو */
function normalize(s: string): string {
  return s
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .toLowerCase();
}

const STOP_WORDS = new Set([
  "کجاست", "کجاست؟", "کجا", "چیه", "چیست", "چی", "چطور", "چه", "برای",
  "به", "از", "روی", "در", "که", "را", "و", "من", "میخوام", "می", "خوام",
  "اینجا", "دانشگاه", "پردیس", "برم", "است", "هست", "بودن", "دنبال",
  "لطفا", "سلام", "میکنم", "کنم",
]);

const ANSWER_NOT_FOUND =
  "متوجه نشدم! با کلمه‌ی ساده‌تری بپرس (مثلاً اسم استاد یا کلاس) یا یکی از پیشنهادهای بالای چت را بزن.";

export function askAssistant(
  raw: string,
  locations: Location[] = allLocations,
  lang: LangCode = "fa"
): AssistantReply {
  const q = normalize(raw.trim());
  if (!q) return { text: "سوالی بپرس! 😊", links: [] };

  // ۱) سوالات متداول اداری
  for (const faq of faqs) {
    if (faq.patterns.some((p) => p.test(q))) {
      return { text: faq.answer, links: faq.links ?? [] };
    }
  }

  // ۲) جستجو در دیتابیس مکان‌ها (کلاس، استاد، سلف و...)
  const tokens = q
    .split(/[\s،.,؟?!:]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  if (tokens.length > 0) {
    const scored = locations
      .map((loc) => {
        const hay = normalize(
          `${locationName(loc, lang)} ${loc.name} ${loc.nameEn ?? ""} ${loc.description ?? ""} ${(loc.tags ?? []).join(" ")}`
        );
        let score = 0;
        for (const t of tokens) if (hay.includes(t)) score++;
        return { loc, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length > 0) {
      const lines = scored.map(({ loc }) => {
        const floor = loc.floor !== undefined ? ` (طبقه ${loc.floor})` : "";
        const desc = loc.description && loc.description !== loc.name ? ` — ${loc.description}` : "";
        return `• ${locationName(loc, lang)}${floor}${desc}`;
      });
      return {
        text: `این‌ها را پیدا کردم:\n${lines.join("\n")}\n\nبرای دیدن روی نقشه و مسیریابی کلیک کن:`,
        links: scored.map(({ loc }) => ({
          label: `📍 ${loc.name}`,
          href: `/map?loc=${loc.id}`,
        })),
      };
    }
  }

  return { text: ANSWER_NOT_FOUND, links: [] };
}
