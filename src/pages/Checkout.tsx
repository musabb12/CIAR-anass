import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ChevronRight, Check, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";

/**
 * Amazon-style Checkout (single gateway: card)
 * - Off-white bg (#eaeded), white cards, numbered sections
 * - Sticky right "Order Summary" on desktop; sticky bottom bar on mobile
 * - Fully responsive: no horizontal overflow at any width
 */

type CardType = "visa" | "mastercard" | "amex" | "unknown";
const detectCard = (num: string): CardType => {
  const n = num.replace(/\s+/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "unknown";
};
const formatCardNumber = (v: string) =>
  v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

const Section = ({
  n, title, active, done, children, onEdit,
}: { n: number; title: string; active?: boolean; done?: boolean; children?: React.ReactNode; onEdit?: () => void }) => (
  <div className="bg-white border border-[#d5d9d9] rounded-lg mb-3 overflow-hidden">
    <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-[#e7e7e7] bg-[#f7f8f8]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-[#067D62] text-white" : active ? "bg-[#232f3e] text-white" : "bg-[#d5d9d9] text-[#565959]"}`}>
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        <h2 className="text-[14px] sm:text-[15px] font-bold text-[#0f1111] truncate">{title}</h2>
      </div>
      {onEdit && done && (
        <button onClick={onEdit} className="text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline shrink-0">Change</button>
      )}
    </div>
    {(active || !done) && <div className="p-3 sm:p-5">{children}</div>}
  </div>
);

const Checkout = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { items, subtotal, clearCart } = useCart();
  const validItems = items.filter((i) => Boolean(i.product));
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [addrId, setAddrId] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newAddr, setNewAddr] = useState({ city: "", district: "", street: "", phone: "", full_name: "" });

  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const cardType = detectCard(card.number);

  const selectedAddr = addresses.find((a) => a.id === addrId);
  const breakdown = useMemo(
    () => calculatePrice({ subtotal, city: selectedAddr?.city, tip: 0 }),
    [subtotal, selectedAddr?.city],
  );

  useEffect(() => {
    if (!user) return;
    supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).then(({ data }) => {
      setAddresses(data ?? []);
      if (data?.[0]) { setAddrId(data[0].id); setStep(2); }
    });
  }, [user]);

  const saveAddress = async () => {
    if (!user || !newAddr.city || !newAddr.phone || !newAddr.full_name) return toast.error(t("complete_address"));
    const { data, error } = await supabase.from("addresses").insert({
      user_id: user.id, ...newAddr, is_default: addresses.length === 0,
    }).select().single();
    if (error) return toast.error(t("address_save_failed"));
    setAddresses([data, ...addresses]);
    setAddrId(data.id);
    setNewAddr({ city: "", district: "", street: "", phone: "", full_name: "" });
    setStep(2);
    toast.success(t("address_added"));
  };

  const validatePayment = () => {
    if (card.number.replace(/\s/g, "").length < 13) return "Invalid card number";
    if (!card.name.trim()) return "Cardholder name required";
    if (!/^\d{2}\/\d{2}$/.test(card.exp)) return "Invalid expiry (MM/YY)";
    if (!/^\d{3,4}$/.test(card.cvc)) return "Invalid CVC";
    return null;
  };

  const submitOrder = async () => {
    if (!user) return;
    if (!addrId) return toast.error(t("pick_address"));
    if (validItems.length === 0) return toast.error(t("cart_empty"));
    const err = validatePayment();
    if (err) return toast.error(err);

    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      customer_id: user.id, address_id: addrId,
      subtotal: breakdown.subtotal, shipping_fee: breakdown.shipping,
      service_fee: breakdown.serviceFee, pilot_tip: 0,
      distance_km: breakdown.distanceKm, total: breakdown.total,
      payment_method: "global_gateway" as any, notes,
      escrow_status: 'none',
    }).select().single();
    if (error || !order) { setSubmitting(false); toast.error(t("order_failed")); return; }

    const orderItems = validItems.map(i => ({
      order_id: order.id, product_id: i.product_id, product_name: i.product.name,
      product_image: i.product.images?.[0] ?? null,
      unit_price: Number(i.product.discount_price ?? i.product.price),
      quantity: i.quantity,
      subtotal: Number(i.product.discount_price ?? i.product.price) * i.quantity,
    }));
    await supabase.from("order_items").insert(orderItems);
    await supabase.from("notifications").insert({
      user_id: user.id, title: t("new_order_title"), message: `${t("new_order_msg")} ${order.order_number}`, type: "order", link: `/orders/${order.id}`,
    });
    await clearCart();
    toast.success(t("order_created"));
    navigate(`/orders/${order.id}`);
  };

  if (!user) { navigate("/auth"); return null; }

  return (
    <div className="min-h-screen bg-[#eaeded] text-[#0f1111] overflow-x-hidden">
      {/* Amazon-style secure checkout header */}
      <div className="bg-white border-b border-[#d5d9d9] shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-[#131921] shrink-0">
            CiAR<span className="text-[#febd69]">.</span>
          </Link>
          <h1 className="text-sm sm:text-lg md:text-xl font-semibold flex items-center gap-2 min-w-0 truncate">
            <span className="truncate">{t("checkout_title")}</span>
            <span className="text-xs text-[#565959] font-normal hidden sm:inline">({validItems.length})</span>
          </h1>
          <div className="flex items-center gap-1.5 text-[#565959] text-sm shrink-0">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Secure</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-32 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 sm:gap-5">
          {/* LEFT */}
          <div className="min-w-0">
            {/* 1. Address */}
            <Section n={1} title={t("delivery_address")} active={step === 1} done={step > 1 && !!selectedAddr} onEdit={() => setStep(1)}>
              {step === 1 ? (
                <>
                  {addresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {addresses.map(a => (
                        <label key={a.id} className={`flex gap-3 p-3 rounded-md border cursor-pointer transition ${addrId === a.id ? "border-[#e77600] ring-2 ring-[#f0c14b] bg-[#fffbf3]" : "border-[#d5d9d9] hover:bg-[#f7fafa]"}`}>
                          <input type="radio" checked={addrId === a.id} onChange={() => setAddrId(a.id)} className="mt-1 accent-[#e77600]" />
                          <div className="flex-1 text-sm min-w-0">
                            <div className="font-bold truncate">{a.full_name || t("address_default")}</div>
                            <div className="text-[#565959] break-words">{a.city}{a.district && `, ${a.district}`}{a.street && `, ${a.street}`}</div>
                            <div className="text-xs text-[#565959] mt-0.5">{a.phone}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <details className="border border-dashed border-[#d5d9d9] rounded-md p-3">
                    <summary className="cursor-pointer text-sm font-medium text-[#007185] hover:text-[#c7511f] hover:underline">{t("add_new_address")}</summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <Input placeholder={t("full_name")} value={newAddr.full_name} onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })} />
                      <Input placeholder={t("phone")} value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
                      <Input placeholder={t("city_req")} value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                      <Input placeholder={t("district")} value={newAddr.district} onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })} />
                      <Input placeholder={t("street")} value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} className="sm:col-span-2" />
                      <button onClick={saveAddress} className="sm:col-span-2 h-10 rounded-md bg-[#ffd814] hover:bg-[#f7ca00] border border-[#fcd200] text-sm font-medium">{t("save_address")}</button>
                    </div>
                  </details>
                  {addrId && (
                    <button onClick={() => setStep(2)} className="mt-4 h-10 px-6 rounded-md bg-[#ffd814] hover:bg-[#f7ca00] border border-[#fcd200] text-sm font-medium inline-flex items-center gap-1">
                      Use this address <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : selectedAddr && (
                <div className="text-sm">
                  <div className="font-bold">{selectedAddr.full_name}</div>
                  <div className="text-[#565959] break-words">{selectedAddr.city}{selectedAddr.district && `, ${selectedAddr.district}`}{selectedAddr.street && `, ${selectedAddr.street}`}</div>
                  <div className="text-xs text-[#565959]">{selectedAddr.phone}</div>
                </div>
              )}
            </Section>

            {/* 2. Delivery */}
            <Section n={2} title="Delivery options" active={step === 2} done={step > 2} onEdit={() => setStep(2)}>
              {step >= 2 && (
                <div className="border border-[#d5d9d9] rounded-md p-3 bg-[#f7fafa]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" checked readOnly className="mt-1 accent-[#e77600]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#067D62] flex items-center gap-2 flex-wrap">
                        <Truck className="h-4 w-4" /> FREE Delivery — 1-3 business days
                      </div>
                      <div className="text-xs text-[#565959] mt-1">Choose <strong>FREE Delivery</strong> at checkout.</div>
                    </div>
                    <div className="text-sm font-bold shrink-0">
                      {breakdown.freeShippingApplied ? <span className="text-[#067D62]">FREE</span> : formatYER(breakdown.shipping)}
                    </div>
                  </label>
                  {step === 2 && (
                    <button onClick={() => setStep(3)} className="mt-3 h-9 px-5 rounded-md bg-[#ffd814] hover:bg-[#f7ca00] border border-[#fcd200] text-xs font-medium">Continue</button>
                  )}
                </div>
              )}
            </Section>

            {/* 3. Payment — Amazon single card gateway */}
            <Section n={3} title="Payment method" active={step === 3} done={step > 3} onEdit={() => setStep(3)}>
              {step === 3 ? (
                <div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-[#565959] mb-3">
                    <ShieldCheck className="h-4 w-4 text-[#067D62] shrink-0" />
                    <span>Your payment is encrypted and secure. We accept:</span>
                    <div className="flex gap-1.5">
                      {["VISA","MC","AMEX"].map(b => (
                        <span key={b} className="px-1.5 py-0.5 rounded border border-[#d5d9d9] bg-white text-[10px] font-bold text-[#232f3e]">{b}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-md border border-[#e77600] ring-2 ring-[#f0c14b] bg-[#fffbf3]">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-bold text-sm">Credit or debit card</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 relative">
                        <Input placeholder="Card number" value={card.number}
                          onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                          inputMode="numeric" className="pe-16 font-mono tracking-wider" />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#232f3e]">
                          {cardType === "visa" && "VISA"}
                          {cardType === "mastercard" && "MC"}
                          {cardType === "amex" && "AMEX"}
                        </span>
                      </div>
                      <Input placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="sm:col-span-2" />
                      <Input placeholder="MM/YY" value={card.exp}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                          setCard({ ...card, exp: v });
                        }} />
                      <Input placeholder="CVC" value={card.cvc}
                        onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                    </div>
                  </div>

                  <button onClick={() => { const e = validatePayment(); if (e) return toast.error(e); setStep(4); }}
                    className="mt-3 h-10 px-6 rounded-md bg-[#ffd814] hover:bg-[#f7ca00] border border-[#fcd200] text-sm font-medium">
                    Use this payment method
                  </button>
                </div>
              ) : step > 3 && (
                <div className="text-sm">
                  💳 <strong>{cardType.toUpperCase()}</strong> ending in <strong>{card.number.slice(-4)}</strong>
                </div>
              )}
            </Section>

            {/* 4. Review */}
            <Section n={4} title="Review items and shipping" active={step === 4}>
              {step === 4 && (
                <div className="space-y-3">
                  {validItems.map(i => (
                    <div key={i.id} className="flex gap-3 pb-3 border-b border-[#e7e7e7] last:border-0">
                      <img src={i.product.images?.[0] ?? "/placeholder.svg"} alt={i.product.name}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded border border-[#d5d9d9] object-cover bg-white shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline line-clamp-2 font-medium">{i.product.name}</div>
                        <div className="text-base sm:text-lg font-bold text-[#B12704] mt-0.5">
                          {formatYER(Number(i.product.discount_price ?? i.product.price))}
                        </div>
                        <div className="text-xs text-[#067D62]">In Stock</div>
                        <div className="text-xs text-[#565959] mt-1">Qty: {i.quantity}</div>
                      </div>
                    </div>
                  ))}
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("extra_notes")} rows={2}
                    className="w-full mt-2 bg-white border border-[#d5d9d9] rounded-md p-2 text-sm focus:border-[#e77600] focus:outline-none focus:ring-2 focus:ring-[#f0c14b]" />
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT: sticky summary (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-4">
              <div className="bg-white border border-[#d5d9d9] rounded-lg p-5">
                <PlaceOrderBox breakdown={breakdown} count={validItems.length} onSubmit={submitOrder} submitting={submitting} disabled={step < 4} />
              </div>
              <p className="text-[11px] text-[#565959] mt-3 leading-relaxed px-1">
                By placing your order, you agree to CiAR's <a className="text-[#007185] hover:underline" href="#">privacy notice</a> and <a className="text-[#007185] hover:underline" href="#">conditions of use</a>.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky mobile place-order bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#d5d9d9] px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm text-[#0f1111]">Order total:</span>
          <span className="text-base font-bold text-[#B12704]">{formatYER(breakdown.total)}</span>
        </div>
        <button onClick={submitOrder} disabled={submitting || step < 4}
          className="w-full h-11 rounded-lg bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] border border-[#fcd200] text-sm font-medium text-[#0f1111] disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? "Placing order..." : "Place your order"}
        </button>
      </div>

      <footer className="bg-[#232f3e] text-white text-center text-xs py-6 mt-8 hidden lg:block">
        <div className="opacity-80">© {new Date().getFullYear()} CiAR — Secure Global Checkout</div>
      </footer>
    </div>
  );
};

const PlaceOrderBox = ({
  breakdown, count, onSubmit, submitting, disabled,
}: { breakdown: any; count: number; onSubmit: () => void; submitting: boolean; disabled: boolean }) => (
  <>
    <button onClick={onSubmit} disabled={submitting || disabled}
      className="w-full h-10 rounded-lg bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] border border-[#fcd200] text-[13px] font-medium text-[#0f1111] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
      {submitting ? "Placing order..." : "Place your order"}
    </button>
    <h3 className="text-[18px] font-bold mt-4 pb-2 border-b border-[#e7e7e7]">Order Summary</h3>
    <div className="space-y-1.5 text-[13px] mt-3">
      <Row label={`Items (${count}):`} value={formatYER(breakdown.subtotal)} />
      <Row label="Shipping & handling:" value={breakdown.freeShippingApplied ? "FREE" : formatYER(breakdown.shipping)} valueClass={breakdown.freeShippingApplied ? "text-[#067D62] font-bold" : ""} />
      <Row label="Service fee:" value={formatYER(breakdown.serviceFee)} />
      <div className="border-t border-[#e7e7e7] my-2" />
      <div className="flex justify-between items-baseline text-[#B12704]">
        <span className="text-[17px] font-bold">Order total:</span>
        <span className="text-[17px] font-bold">{formatYER(breakdown.total)}</span>
      </div>
    </div>
  </>
);

const Row = ({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-[#0f1111]">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

export default Checkout;
