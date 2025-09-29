// src/types/paypal.d.ts
export {};

declare global {
  interface PayPalActions {
    order: {
      create: (options: {
        purchase_units: { amount: { value: string } }[];
      }) => Promise<string>;
      capture: () => Promise<{ id: string }>;
    };
  }

  interface PayPalButtonProps {
    amount: number;
    onSuccess: (details: { orderID: string }) => void;
    onError: (err: unknown) => void;
  }

  interface Window {
    paypal: {
      Buttons: (options: {
        createOrder: (
          data: Record<string, unknown>,
          actions: PayPalActions
        ) => Promise<string>;
        onApprove: (
          data: Record<string, unknown>,
          actions: PayPalActions
        ) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => {
        render: (container: HTMLElement) => void;
      };
    };
  }
}
