// src/components/PayPalButton.tsx
"use client";

import { useEffect, useRef } from "react";

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: { orderID: string }) => void;
  onError: (err: unknown) => void;
}

type PayPalActions = {
  order: {
    create: (options: {
      purchase_units: { amount: { value: string } }[];
    }) => Promise<string>;
    capture: () => Promise<{ id: string }>;
  };
};

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
        createOrder: (
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
          _data: Record<string, unknown>,
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
  }, [amount, onError, onSuccess]);

  return <div ref={paypalRef} />;
}
