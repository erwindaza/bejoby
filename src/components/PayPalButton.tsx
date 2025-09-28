// src/components/PayPalButton.tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    paypal: {
      Buttons: (config: any) => { render: (selector: string) => void };
    };
  }
}

type PayPalButtonProps = {
  amount: string;
  onSuccess: (details: Record<string, unknown>) => void;
  onError?: (err: unknown) => void;
};

export default function PayPalButton({ amount, onSuccess, onError }: PayPalButtonProps) {
  useEffect(() => {
    const existingScript = document.getElementById("paypal-sdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
      script.id = "paypal-sdk";
      script.async = true;
      script.onload = () => renderButton();
      document.body.appendChild(script);
    } else {
      renderButton();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderButton = () => {
    if (!window.paypal) return;
    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        },
        createOrder: (_data: unknown, actions: any) => {
          return actions.order.create({
            purchase_units: [{ amount: { value: amount } }],
          });
        },
        onApprove: async (_data: unknown, actions: any) => {
          const details = await actions.order.capture();
          onSuccess(details);
        },
        onError: (err: unknown) => {
          console.error("PayPal Checkout Error", err);
          if (onError) onError(err);
        },
      })
      .render("#paypal-button-container");
  };

  return <div id="paypal-button-container" />;
}

