import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useWalletSecurity = () => {
  const { user } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const autoLockTimer = useRef<NodeJS.Timeout | null>(null);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30000; // قفل محلي لمدة 30 ثانية بعد 5 محاولات خاطئة

  // جلب آمن: لا نطلب الـ pin_hash أبداً لحماية الذاكرة من هجمات الاستخراج
  const refresh = useCallback(async () => {
    if (!user) return setHasPin(false);
    const { data } = await supabase
      .from("wallet_security")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setHasPin(!!data);
  }, [user]);

  // آلية القفل التلقائي لحماية الجلسة الحية عند الخمول أو نسيان التطبيق مفتوحاً
  const startAutoLockTimer = useCallback(() => {
    if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    autoLockTimer.current = setTimeout(() => {
      setUnlocked(false);
    }, 3 * 60 * 1000); // إغلاق تلقائي للمحفظة بعد 3 دقائق من عدم النشاط
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    };
  }, [refresh]);

  const setPin = async (pin: string) => {
    if (lockoutTime && Date.now() < lockoutTime) {
      throw new Error("المنظومة في حالة قفل مؤقت لحماية المحفظة.");
    }
    const { error } = await supabase.rpc("set_wallet_pin", { _pin: pin });
    if (error) throw error;
    await refresh();
    setUnlocked(true);
    startAutoLockTimer();
  };

  const verifyPin = async (pin: string) => {
    // التحقق من حالة القفل الزمني
    if (lockoutTime && Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      throw new Error(`المنظومة مقفلة حمايةً للمحفظة الرقمية. انتظر ${remaining} ثانية.`);
    }

    const { data, error } = await supabase.rpc("verify_wallet_pin", { _pin: pin });
    if (error) throw error;

    if (data === true) {
      setUnlocked(true);
      setAttempts(0);
      setLockoutTime(null);
      startAutoLockTimer();
      return true;
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockoutTime(Date.now() + LOCKOUT_DURATION);
        setAttempts(0);
        throw new Error("تم تجاوز الحد الأقصى للمحاولات. تم تفعيل قفل الأمان المؤقت للطرفية.");
      }
      return false;
    }
  };

  const isLockedOut = lockoutTime ? Date.now() < lockoutTime : false;

  return { 
    hasPin, 
    unlocked, 
    setUnlocked, 
    setPin, 
    verifyPin, 
    refresh,
    isLockedOut,
    remainingAttempts: MAX_ATTEMPTS - attempts
  };
};
