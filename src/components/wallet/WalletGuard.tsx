import { useState } from "react";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWalletSecurity } from "@/hooks/useWalletSecurity";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

const PinPad = ({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) => {
  const press = (d: string) => {
    if (value.length < length) onChange(value + d);
  };
  const back = () => onChange(value.slice(0, -1));
  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-3" dir="ltr">
        {Array.from({ length }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: value.length === i + 1 ? 1.2 : 1 }}
            className={`h-14 w-12 rounded-xl border-2 flex items-center justify-center font-cyber text-2xl ${
              value.length > i ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
            }`}
          >
            {value.length > i ? "●" : ""}
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, idx) => (
          <Button
            key={idx}
            type="button"
            variant={k === "⌫" ? "outline" : "secondary"}
            className="h-14 text-xl font-bold"
            disabled={k === ""}
            onClick={() => (k === "⌫" ? back() : k && press(k))}
          >
            {k}
          </Button>
        ))}
      </div>
    </div>
  );
};

const WalletGuard = ({ children }: Props) => {
  const { hasPin, unlocked, setUnlocked, setPin, verifyPin } = useWalletSecurity();
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirm] = useState("");
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [busy, setBusy] = useState(false);

  if (hasPin === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحقق من الحماية...</div>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  // إنشاء PIN جديد
  if (!hasPin) {
    return (
      <div className="container py-10 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 text-center border-2 border-accent/30"
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center mb-4 animate-pulse-glow">
            <ShieldCheck className="h-10 w-10 text-background" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-gradient-primary">
            {stage === "enter" ? "أنشئ PIN لحماية محفظتك" : "أكّد رمزك السري"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            هذا الرمز يحمي معاملاتك وعملياتك المالية
          </p>
          <PinPad
            value={stage === "enter" ? pin : confirmPin}
            onChange={stage === "enter" ? setPinValue : setConfirm}
          />
          <Button
            variant="hero"
            className="w-full mt-8"
            disabled={busy || (stage === "enter" ? pin.length < 4 : confirmPin.length < 4)}
            onClick={async () => {
              if (stage === "enter") {
                setStage("confirm");
              } else {
                if (pin !== confirmPin) {
                  toast.error("الرمزان غير متطابقين");
                  setConfirm("");
                  return;
                }
                setBusy(true);
                try {
                  await setPin(pin);
                  toast.success("✨ تم تفعيل حماية المحفظة بنجاح");
                } catch (e: any) {
                  toast.error(e.message || "خطأ في إنشاء PIN");
                } finally {
                  setBusy(false);
                }
              }
            }}
          >
            {stage === "enter" ? "متابعة" : "تأكيد وتفعيل"}
          </Button>
        </motion.div>
      </div>
    );
  }

  // إدخال PIN موجود
  return (
    <div className="container py-10 max-w-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8 text-center border-2 border-primary/30"
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary to-purple-800 flex items-center justify-center mb-4">
          <Lock className="h-10 w-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-black mb-2">المحفظة مقفلة</h2>
        <p className="text-sm text-muted-foreground mb-8">
          أدخل رمز PIN لفتح محفظتك الذكية
        </p>
        <PinPad value={pin} onChange={setPinValue} />
        <Button
          variant="gold"
          className="w-full mt-8"
          disabled={busy || pin.length < 4}
          onClick={async () => {
            setBusy(true);
            try {
              const ok = await verifyPin(pin);
              if (ok) {
                toast.success("✅ تم فتح المحفظة");
                setUnlocked(true);
              } else {
                toast.error("رمز خاطئ");
                setPinValue("");
              }
            } catch (e: any) {
              toast.error(e.message === "WALLET_LOCKED" ? "المحفظة مقفلة مؤقتاً 15 دقيقة" : "خطأ");
            } finally {
              setBusy(false);
            }
          }}
        >
          <KeyRound className="h-4 w-4 ms-2" /> فتح المحفظة
        </Button>
      </motion.div>
    </div>
  );
};

export default WalletGuard;
