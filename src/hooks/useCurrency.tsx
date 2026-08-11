import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // معامل التحويل من الريال اليمني إلى هذه العملة
}

// قائمة الـ 20 عملة الشاملة لدول الخليج والعملات العالمية والعربية المهمة
export const currencies: Record<string, Currency> = {
  YER: { code: "YER", name: "الريال اليمني", symbol: "ر.ي", rate: 1 },
  SAR: { code: "SAR", name: "الريال السعودي", symbol: "ر.س", rate: 0.00625 }, // بافتراض 1 سعودي = 160 ريال
  USD: { code: "USD", name: "الدولار الأمريكي", symbol: "$", rate: 0.00166 }, // بافتراض 1 دولار = 600 ريال
  EUR: { code: "EUR", name: "اليورو", symbol: "€", rate: 0.00155 },
  AED: { code: "AED", name: "الدرهم الإماراتي", symbol: "د.إ", rate: 0.0061 },
  OMR: { code: "OMR", name: "الريال العماني", symbol: "ر.ع", rate: 0.00064 },
  BHD: { code: "BHD", name: "الدينار البحريني", symbol: "د.ب", rate: 0.00062 },
  KWD: { code: "KWD", name: "الدينار الكويتي", symbol: "د.ك", rate: 0.00051 },
  QAR: { code: "QAR", name: "الريال القطري", symbol: "ر.ق", rate: 0.0060 },
  EGP: { code: "EGP", name: "الجنيه المصري", symbol: "ج.م", rate: 0.080 },
  JOD: { code: "JOD", name: "الدينار الأردني", symbol: "د.أ", rate: 0.00118 },
  IQD: { code: "IQD", name: "الدينار العراقي", symbol: "د.ع", rate: 2.18 },
  LYD: { code: "LYD", name: "الدينار الليبي", symbol: "د.ل", rate: 0.0081 },
  MAD: { code: "MAD", name: "الدرهم المغربي", symbol: "د.م", rate: 0.0167 },
  TND: { code: "TND", name: "الدينار التونسي", symbol: "د.ت", rate: 0.0052 },
  DZD: { code: "DZD", name: "الدينار الجزائري", symbol: "د.ج", rate: 0.22 },
  SDG: { code: "SDG", name: "الجنيه السوداني", symbol: "ج.س", rate: 1.00 },
  LBP: { code: "LBP", name: "الليرة اللبنانية", symbol: "ل.ل", rate: 0.15 },
  TRY: { code: "TRY", name: "الليرة التركية", symbol: "₺", rate: 0.054 },
  GBP: { code: "GBP", name: "الجنيه الإسترليني", symbol: "£", rate: 0.0013 }
};

interface CurrencyCtx {
  currentCurrency: Currency;
  setCurrency: (code: string) => void;
}

const Ctx = createContext<CurrencyCtx>({
  currentCurrency: currencies.YER,
  setCurrency: () => {},
});

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currentCurrency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return currencies.YER;
    const saved = localStorage.getItem("ciar-currency");
    return saved && currencies[saved] ? currencies[saved] : currencies.YER;
  });

  const setCurrency = (code: string) => {
    if (currencies[code]) {
      setCurrencyState(currencies[code]);
      localStorage.setItem("ciar-currency", code);
    }
  };

  return (
    <Ctx.Provider value={{ currentCurrency, setCurrency }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCurrency = () => useContext(Ctx);
