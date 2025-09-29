// src/components/PayPalButton.tsx
"use client";

import { useEffect, useRef } from "react";

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: { orderID: string }) => void;
  onError: (err: unknown) => void;
}

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
        createOrder: (_: unknown, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toFixed(2),
                },
              },
            ],
          });
        },
        onApprove: async (_: unknown, actions: any) => {
          const details = await actions.order.capture();
          onSuccess({ orderID: details.id });
        },
        onError: (err: unknown) => {
          console.error("PayPal error:", err);
          onError(err);
        },
      })
      .render(paypalRef.current);
  }, [amount, onError, onSuccess]);

  return <div ref={paypalRef} />;
}


