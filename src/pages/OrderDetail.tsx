import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, Package, Truck, MapPin, Shield, Fuel, QrCode, MessageCircle, Map } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LiveTracking from "@/components/tracking/LiveTracking";
import EncryptedChat from "@/components/chat/EncryptedChat";
import { formatYER, formatDate, orderStatusLabel, orderStatusColor, paymentMethodLabel } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import ActionHero from "@/components/common/ActionHero";

const STAGES = ["pending", "confirmed", "preparing", "shipping", "delivered"] as const;

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [hero, setHero] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    setOrder(data);
    if (data?.address_id) {
      const { data: a } = await supabase.from("addresses").select("*").eq("id", data.address_id).maybeSingle();
      setAddress(a);
    }
    const { data: it } = await supabase.from("order_items").select("*").eq("order_id", id);
    setItems(it ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const handleConfirm = async () => {
    if (!order?.escrow_code) return;
    setConfirming(true);
    const { error } = await supabase.rpc("confirm_delivery" as any, { _order_id: order.id, _code: confirmCode });
    setConfirming(false);
    if (error) {
      haptic("warning");
      toast.error(error.message.includes("INVALID_CODE") ? "الرمز غير صحيح" : "تعذّر التأكيد");
      return;
    }
    haptic("success");
    setHero(true);
    toast.success("تم تأكيد التسليم وإفراج المبلغ ✨");
    setShowQR(false);
    load();
  };

  if (!order) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">جاري التحميل...</div></div>;

  const currentStage = STAGES.indexOf(order.status as any);
  const isOwner = user?.id === order.customer_id;
  const escrowActive = order.escrow_status === "held";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ActionHero show={hero} title="تم التسليم بنجاح!" subtitle="جزاك الله خيراً" onClose={() => setHero(false)} />

      <main className="container py-8">
        <Link to="/orders" className="text-sm text-primary hover:underline mb-4 inline-block">← العودة إلى الطلبات</Link>

        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="font-cyber font-bold text-accent text-xl">{order.order_number}</div>
              <div className="text-xs text-muted-foreground mt-1">{formatDate(order.created_at)}</div>
            </div>
            <span className={`text-xs font-cyber px-3 py-1.5 rounded-full ${orderStatusColor[order.status]}`}>
              {orderStatusLabel[order.status]}
            </span>
          </div>

          {!["cancelled", "returned"].includes(order.status) && (
            <div className="grid grid-cols-5 gap-1 mt-6">
              {STAGES.map((s, i) => {
                const active = i <= currentStage;
                return (
                  <div key={s} className="text-center">
                    <div className={`mx-auto h-9 w-9 rounded-full flex items-center justify-center mb-1 ${active ? "bg-gradient-mystic text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {i === 0 ? <Clock className="h-4 w-4" /> : i === 1 ? <CheckCircle2 className="h-4 w-4" /> : i === 2 ? <Package className="h-4 w-4" /> : i === 3 ? <Truck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className={`text-[10px] font-cyber ${active ? "text-accent" : "text-muted-foreground"}`}>{orderStatusLabel[s]}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Escrow QR Banner */}
        {escrowActive && isOwner && (
          <div className="glass-gold rounded-2xl p-6 mb-6 border-2 border-accent/40">
            <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
              <div className="h-12 w-12 rounded-full bg-gradient-mystic flex items-center justify-center shrink-0 animate-mystic-pulse">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg mb-1">🛡️ ضمان آمن نشط</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  المبلغ مُجمَّد في المحفظة. عند وصول الطيار، اعرض رمز QR ليمسحه أو أدخل الرمز السري بنفسك لإفراج المبلغ.
                </p>
                <Button onClick={() => setShowQR(!showQR)} className="bg-gradient-gold text-accent-foreground hover:opacity-90">
                  <QrCode className="ms-2 h-4 w-4" /> {showQR ? "إخفاء" : "عرض رمز التأكيد"}
                </Button>
              </div>
            </div>

            {showQR && (
              <div className="mt-6 grid md:grid-cols-2 gap-6 items-center">
                <div className="bg-white p-4 rounded-2xl mx-auto w-fit">
                  <QRCodeSVG value={`mared://confirm/${order.id}/${order.escrow_code}`} size={180} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">رمز التأكيد السري:</div>
                  <div className="font-cyber text-3xl text-accent shimmer-gold mb-4 tracking-widest">{order.escrow_code}</div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="أدخل الرمز يدوياً"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      className="text-center font-cyber"
                    />
                    <Button onClick={handleConfirm} disabled={confirming} className="bg-gradient-mystic">
                      {confirming ? "..." : "تأكيد"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="details" className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
            <TabsTrigger value="tracking"><Map className="h-3.5 w-3.5 ms-1" /> التتبع</TabsTrigger>
            <TabsTrigger value="chat" disabled={!order.pilot_id}><MessageCircle className="h-3.5 w-3.5 ms-1" /> محادثة</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h2 className="font-bold mb-4">المنتجات ({items.length})</h2>
                <div className="space-y-3">
                  {items.map(it => (
                    <motion.div key={it.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 pb-3 border-b border-border/30 last:border-0">
                      <img src={it.product_image ?? "/placeholder.svg"} alt={it.product_name} className="h-16 w-16 rounded-lg object-cover bg-secondary/30" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{it.product_name}</div>
                        <div className="text-xs text-muted-foreground">الكمية: {it.quantity} × {formatYER(it.unit_price)}</div>
                      </div>
                      <div className="font-cyber font-bold">{formatYER(it.subtotal)}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold mb-3">ملخص الدفع</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">الف€</span><span className="font-cyber">{formatYER(order.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">الشحن{order.distance_km ? ` (~${order.distance_km}كم)` : ""}</span><span className="font-cyber">{formatYER(order.shipping_fee)}</span></div>
                    {Number(order.service_fee) > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">رسوم الخدمة</span><span className="font-cyber">{formatYER(order.service_fee)}</span></div>
                    )}
                    {Number(order.pilot_tip) > 0 && (
                      <div className="flex justify-between text-accent"><span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> فوّالة</span><span className="font-cyber">{formatYER(order.pilot_tip)}</span></div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-border/50"><span>الإجمالي</span><span className="font-cyber text-accent">{formatYER(order.total)}</span></div>
                    <div className="flex justify-between pt-2 text-xs"><span className="text-muted-foreground">طريقة الدفع</span><span>{paymentMethodLabel[order.payment_method]}</span></div>
                  </div>
                </div>

                {address && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> التوصيل</h3>
                    <div className="text-sm">
                      <div className="font-medium">{address.full_name}</div>
                      <div className="text-muted-foreground mt-1">{address.city} {address.district && `، ${address.district}`}</div>
                      {address.street && <div className="text-muted-foreground">{address.street}</div>}
                      <div className="text-xs text-muted-foreground mt-2">{address.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="mt-4">
            <LiveTracking
              orderId={order.id}
              customerLat={address?.lat}
              customerLng={address?.lng}
              asPilot={user?.id === order.pilot_id}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            {order.pilot_id && user && (
              <EncryptedChat
                orderId={order.id}
                otherUserId={user.id === order.customer_id ? order.pilot_id : order.customer_id}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OrderDetail;
