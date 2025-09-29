// src/types/paypal.d.ts
export {};

declare global {
  interface Window {
    paypal: any; // 👈 puedes tiparlo después, pero así se quita el error
  }
}