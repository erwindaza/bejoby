// src/components/PayPalButton.tsx
// src/components/PayPalButton.tsx
"use client";

import { useEffect, useRef } from "react";

export default function PayPalButton({
  amount,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.paypal || !paypalRef.current) return;

    window.paypal
      .Buttons({
        createOrder: async (
          _data: Record<string, unknown>,
          actions: PayPalActions
        ) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: amount.toFixed(2) },
              },
            ],
          });
        },
        onApprove: async (
          data: Record<string, unknown>,
          actions: PayPalActions
        ) => {
          const details = await actions.order.capture();
          onSuccess({ orderID: details.id });
        },
        onError: (err: unknown) => {
          console.error("PayPal error:", err);
          onError(err);
        },
      })
      .render(paypalRef.current);
  }, [amount, onSuccess, onError]);

  return <div ref={paypalRef} />;
}
