import { useEffect, useState } from "react";
import { GATEWAYS, Gateway } from "@/lib/payment-gateways";
import { useIntegration } from "@/hooks/useIntegration";

export const useGateways = () => {
  const stripe = useIntegration("stripe");
  const [list, setList] = useState<Gateway[]>(GATEWAYS);

  useEffect(() => {
    const extra: Gateway[] = [];
    if (stripe.enabled && stripe.publicKey) {
      extra.push({
        id: "stripe" as any,
        name: "Stripe — Visa / Mastercard",
        type: "bank",
        icon: "💳",
        description: "دفع آمن عالمي بالبطاقة (Visa, MasterCard, Apple Pay)",
        color: "from-indigo-500 to-purple-700",
        fee: 2.9,
        available: true,
        account: stripe.publicKey,
      });
    }
    setList([...GATEWAYS, ...extra]);
  }, [stripe.enabled, stripe.publicKey]);

  return list;
};
