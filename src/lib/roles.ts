import { Store, Factory, Bike, Briefcase, ShoppingBag, Shield, type LucideIcon } from "lucide-react";
import type { AppRole } from "@/hooks/useAuth";

export interface RoleConfig {
  id: AppRole;
  label: string;
  desc: string;
  icon: LucideIcon;
  accent: "blue" | "gold";
  path: string;
}

export const ROLES: RoleConfig[] = [
  { id: "customer",  label: "عميل",        desc: "تسوّق من آلاف المتاجر بسعر شفاف وتوصيل ذكي", icon: ShoppingBag, accent: "blue", path: "/dashboard/customer" },
  { id: "seller",    label: "بائع / تاجر", desc: "أنشئ متجرك الإلكتروني بهوية مستقلة خلال دقائق", icon: Store,       accent: "gold", path: "/dashboard/seller" },
  { id: "factory",   label: "صاحب مصنع",   desc: "بوابة B2B لإدارة الجملة والاستيراد والتصدير",   icon: Factory,     accent: "blue", path: "/dashboard/factory" },
  { id: "pilot",     label: "موصِّل (قائد)", desc: "استلم الطلبات، احسب الإكراميات وقد المهام",     icon: Bike,        accent: "gold", path: "/dashboard/pilot" },
  { id: "jobseeker", label: "باحث عن عمل", desc: "تقدّم لآلاف الوظائف داخل التطبيق مباشرة",       icon: Briefcase,   accent: "blue", path: "/dashboard/jobseeker" },
  { id: "admin",     label: "مشرف النظام",  desc: "تحكم كامل في المنصة والمستخدمين والمالية",     icon: Shield,      accent: "gold", path: "/dashboard/admin" },
];
