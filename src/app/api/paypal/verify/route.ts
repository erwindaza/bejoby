// src/app/api/paypal/verify/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { orderID } = await req.json();

  try {
    // Obtener token de PayPal
    const auth = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const { access_token } = await auth.json();

    // Verificar orden
    const verify = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await verify.json();

    if (data.status === "COMPLETED") {
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, data });
  } catch (err) {
    console.error("PayPal verify error:", err);
    return NextResponse.json(
      { success: false, error: "Error verificando el pago." },
      { status: 500 }
    );
  }
}
