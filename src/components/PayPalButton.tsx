// src/components/PayPalButton.tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    paypal: any;
  }
}

type PayPalButtonProps = {
  amount: string; // monto en USD
  onSuccess: (details: any) => void;
  onError?: (err: any) => void;
};

export default function PayPalButton({ amount, onSuccess, onError }: PayPalButtonProps) {
  useEffect(() => {
    // Cargar el script de PayPal si no existe
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
  }, []);

  const renderButton = () => {
    if (!window.paypal) return;
    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
      },
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: { value: amount },
            },
          ],
        });
      },
      onApprove: async (_data: any, actions: any) => {
        const details = await actions.order.capture();
        onSuccess(details);
      },
      onError: (err: any) => {
        console.error("PayPal Checkout Error", err);
        if (onError) onError(err);
      },
    }).render("#paypal-button-container");
  };

  return <div id="paypal-button-container" />;
}
