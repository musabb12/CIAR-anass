const currencyConfig: Record<string, { symbol: string; rate: number; locale: string; decimals: number }> = {
  YER: { symbol: "ر.ي", rate: 1, locale: "ar-YE", decimals: 0 },
  SAR: { symbol: "ر.س", rate: 0.00625, locale: "ar-SA", decimals: 2 },
  USD: { symbol: "$", rate: 0.00166, locale: "en-US", decimals: 2 },
  EUR: { symbol: "€", rate: 0.00155, locale: "de-DE", decimals: 2 },
  AED: { symbol: "د.إ", rate: 0.0061, locale: "ar-AE", decimals: 2 },
  OMR: { symbol: "ر.ع", rate: 0.00064, locale: "ar-OM", decimals: 3 },
  BHD: { symbol: "د.ب", rate: 0.00062, locale: "ar-BH", decimals: 3 },
  KWD: { symbol: "د.ك", rate: 0.00051, locale: "ar-KW", decimals: 3 },
  QAR: { symbol: "ر.ق", rate: 0.0060, locale: "ar-QA", decimals: 2 },
  EGP: { symbol: "ج.م", rate: 0.080, locale: "ar-EG", decimals: 2 },
  JOD: { symbol: "د.أ", rate: 0.00118, locale: "ar-JO", decimals: 2 },
  IQD: { symbol: "د.ع", rate: 2.18, locale: "ar-IQ", decimals: 0 },
  LYD: { symbol: "د.ل", rate: 0.0081, locale: "ar-LY", decimals: 2 },
  MAD: { symbol: "د.م", rate: 0.0167, locale: "ar-MA", decimals: 2 },
  TND: { symbol: "د.ت", rate: 0.0052, locale: "ar-TN", decimals: 2 },
  DZD: { symbol: "د.ج", rate: 0.22, locale: "ar-DZ", decimals: 0 },
  SDG: { symbol: "ج.س", rate: 1.00, locale: "ar-SD", decimals: 2 },
  LBP: { symbol: "ل.ل", rate: 0.15, locale: "ar-LB", decimals: 0 },
  TRY: { symbol: "₺", rate: 0.054, locale: "tr-TR", decimals: 2 },
  GBP: { symbol: "£", rate: 0.0013, locale: "en-GB", decimals: 2 }
};

export const formatYER = (n: number | string) => {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";

  // جلب العملة الحالية المخزنة في المتصفح تلقائياً عند إعادة الرندرة
  const savedCode = typeof window !== "undefined" ? localStorage.getItem("ciar-currency") || "YER" : "YER";
  const curr = currencyConfig[savedCode] || currencyConfig.YER;

  // الحساب اللحظي بناءً على سعر الصرف المعين
  const converted = num * curr.rate;

  return new Intl.NumberFormat(curr.locale, {
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals
  }).format(converted) + " " + curr.symbol;
};

export const formatDate = (s: string) => {
  try {
    return new Intl.DateTimeFormat("ar-YE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));
  } catch { return s; }
};

export const orderStatusLabel: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  shipping: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  returned: "مرتجع",
};

export const orderStatusColor: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  confirmed: "text-blue-400 bg-blue-400/10",
  preparing: "text-purple-400 bg-purple-400/10",
  shipping: "text-cyan-400 bg-cyan-400/10",
  delivered: "text-green-400 bg-green-400/10",
  cancelled: "text-red-400 bg-red-400/10",
  returned: "text-orange-400 bg-orange-400/10",
};

export const paymentMethodLabel: Record<string, string> = {
  wallet: "المحفظة",
  cod: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
};
