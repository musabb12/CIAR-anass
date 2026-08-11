// محرك العمولة المركزي - يطابق دالة compute_split في DB
export interface AppSettings {
  app_commission_pct: number;
  pilot_base_pct: number;
  min_pilot_fee: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  app_commission_pct: 5,
  pilot_base_pct: 80,
  min_pilot_fee: 500,
};

export interface Split {
  app_amount: number;
  seller_amount: number;
  pilot_amount: number;
  pilot_tip: number;
  total: number;
}

export const computeSplit = (
  subtotal: number,
  shipping: number,
  tip: number = 0,
  settings: AppSettings = DEFAULT_SETTINGS,
): Split => {
  const app_amount = +(subtotal * (settings.app_commission_pct / 100)).toFixed(2);
  const pilot_amount = Math.max(
    +(shipping * (settings.pilot_base_pct / 100)).toFixed(2),
    settings.min_pilot_fee,
  );
  const seller_amount = +(subtotal - app_amount).toFixed(2);
  return {
    app_amount,
    seller_amount,
    pilot_amount,
    pilot_tip: tip,
    total: subtotal + shipping + tip,
  };
};

// توليد كود التسليم الذهبي (6 أرقام)
export const generateHandoverCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
