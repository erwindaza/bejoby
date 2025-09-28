// src/app/api/paypal/verify/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orderID } = await req.json();

    // Obtener access token de PayPal
    const auth = Buffer.from(
      `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json({ error: "No se pudo obtener token PayPal" }, { status: 500 });
    }

    // Verificar la orden con el token
    const orderRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    const orderData = await orderRes.json();

    if (orderData.status === "COMPLETED") {
      return NextResponse.json({ success: true, order: orderData });
    } else {
      return NextResponse.json({ success: false, order: orderData });
    }
  } catch (err) {
    console.error("Error verificando pago PayPal:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
