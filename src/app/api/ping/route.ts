// src/app/api/ping/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  console.log("✅ Ping recibido en /api/ping");
  return NextResponse.json({ message: "Pong! API funcionando 🚀" });
}
