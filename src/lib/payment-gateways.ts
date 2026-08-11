// بوابات الدفع المتاحة في مارد التفوق
export type GatewayKind =
  | "wallet"
  | "kuraimi"
  | "qasimi"
  | "tadhamon"
  | "alkuraimi_islamic"
  | "binance"
  | "crypto_usdt"
  | "stripe"
  | "cod";

export interface Gateway {
  id: GatewayKind;
  name: string;
  type: "wallet" | "bank" | "crypto" | "cash";
  icon: string;
  description: string;
  instructions?: string;
  account?: string;
  color: string;
  fee?: number; // % رسوم
  available: boolean;
}

export const GATEWAYS: Gateway[] = [
  {
    id: "wallet",
    name: "محفظة مارد التفوق",
    type: "wallet",
    icon: "💎",
    description: "دفع فوري من €دك المحمي",
    color: "from-primary to-purple-700",
    available: true,
  },
  {
    id: "kuraimi",
    name: "بنك الكريمي",
    type: "bank",
    icon: "🏦",
    description: "تحويل فوري عبر EasyPay",
    instructions: "حوّل المبلغ إلى الرقم التالي ثم ارفع صورة الإشعار",
    account: "777-123-456",
    color: "from-amber-600 to-amber-800",
    fee: 0,
    available: true,
  },
  {
    id: "qasimi",
    name: "بنك القاسمي",
    type: "bank",
    icon: "🏛️",
    description: "تحويل بنكي يدوي مع إثبات",
    instructions: "حوّل عبر شبكة القاسمي ثم ارفق المرجع",
    account: "QSM-998-2024",
    color: "from-emerald-600 to-emerald-800",
    fee: 0,
    available: true,
  },
  {
    id: "tadhamon",
    name: "بنك التضامن الإسلامي",
    type: "bank",
    icon: "🕌",
    description: "حوالة ش€ة معتمدة",
    instructions: "حوّل عبر فروع التضامن أو تطبيقهم",
    account: "TDH-554-001",
    color: "from-teal-600 to-teal-800",
    fee: 0,
    available: true,
  },
  {
    id: "alkuraimi_islamic",
    name: "الكريمي الإسلامي",
    type: "bank",
    icon: "📿",
    description: "خدمة الجوبي الذكية",
    account: "AKI-771-789",
    color: "from-indigo-600 to-indigo-800",
    fee: 0,
    available: true,
  },
  {
    id: "binance",
    name: "Binance Pay",
    type: "crypto",
    icon: "🪙",
    description: "ادفع بالعملات الرقمية فوراً",
    instructions: "أرسل USDT أو BNB إلى Binance ID",
    account: "MARED-TAFAWUQ",
    color: "from-yellow-500 to-orange-600",
    fee: 1,
    available: true,
  },
  {
    id: "crypto_usdt",
    name: "USDT (TRC20)",
    type: "crypto",
    icon: "₮",
    description: "تحويل مباشر على شبكة Tron",
    instructions: "أرسل USDT إلى المحفظة التالية",
    account: "TXyZ...maredTAF...9k2",
    color: "from-green-500 to-green-700",
    fee: 0.5,
    available: true,
  },
  {
    id: "cod",
    name: "الدفع عند الاستلام",
    type: "cash",
    icon: "💵",
    description: "ادفع نقداً للسائق عند التسليم",
    color: "from-slate-600 to-slate-800",
    fee: 0,
    available: true,
  },
];

export const getGateway = (id: GatewayKind) => GATEWAYS.find((g) => g.id === id);
