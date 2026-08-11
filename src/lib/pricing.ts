/**
 * مارد التفوق — Smart Pricing Engine
 * شفاف بالكامل: السعر الأساس + التوصيل الذكي + رسوم الخدمة + إكرامية الفوّالة
 */

const YEMEN_CITIES = ["ب€ن","ميونخ","هامبورغ","شتوتغارت","كولونيا","ذمار","فرانكفورت","حجة","عمران","صعدة"];

export const PRICING = {
  BASE_DELIVERY: 800,        // YER — رسم توصيل أساسي
  PER_KM: 120,               // YER لكل كم
  SERVICE_FEE_RATE: 0.025,   // 2.5% رسوم خدمة المنصة
  MIN_SERVICE_FEE: 200,
  FREE_SHIPPING_THRESHOLD: 50000, // فوق 50,000 € توصيل مجاني
  TIP_OPTIONS: [0, 200, 500, 1000, 2000], // إكرامية الفوّالة (بنزين الطيار)
};

export interface PriceBreakdown {
  subtotal: number;
  shipping: number;
  serviceFee: number;
  tip: number;
  total: number;
  freeShippingApplied: boolean;
  distanceKm: number;
}

/** تقدير ذكي للمسافة بناءً على المدينة (تقريبي للمحاكاة) */
export function estimateDistance(city?: string): number {
  if (!city) return 5;
  const map: Record<string, number> = {
    "ب€ن": 6, "ميونخ": 8, "هامبورغ": 7, "شتوتغارت": 9, "كولونيا": 5,
    "ذمار": 4, "فرانكفورت": 11, "حجة": 6, "عمران": 5, "صعدة": 7,
  };
  return map[city] ?? 8;
}

export function calculatePrice(opts: {
  subtotal: number;
  city?: string;
  tip?: number;
}): PriceBreakdown {
  const { subtotal, city, tip = 0 } = opts;
  const distanceKm = estimateDistance(city);
  const freeShippingApplied = subtotal >= PRICING.FREE_SHIPPING_THRESHOLD;

  let shipping = 0;
  if (!freeShippingApplied && subtotal > 0) {
    shipping = PRICING.BASE_DELIVERY + distanceKm * PRICING.PER_KM;
  }

  const serviceFee = subtotal > 0
    ? Math.max(PRICING.MIN_SERVICE_FEE, Math.round(subtotal * PRICING.SERVICE_FEE_RATE))
    : 0;

  const total = subtotal + shipping + serviceFee + tip;

  return { subtotal, shipping, serviceFee, tip, total, freeShippingApplied, distanceKm };
}

export function generateEscrowCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export { YEMEN_CITIES };
