// src/types/paypal.d.ts
export {};

declare global {
  interface Window {
    paypal: {
      Buttons: (options: {
        createOrder: (
          data: Record<string, unknown>,
          actions: {
            order: {
              create: (input: {
                purchase_units: { amount: { value: string } }[];
              }) => Promise<string>;
            };
          }
        ) => Promise<string>;
        onApprove: (
          data: { orderID: string },
          actions: {
            order: {
              capture: () => Promise<{ id: string }>;
            };
          }
        ) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => {
        render: (element: HTMLElement) => void;
      };
    };
  }
}
