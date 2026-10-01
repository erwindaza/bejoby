// src/app/api/webhooks/whatsapp/route.ts
// Webhook para WhatsApp Cloud API de Meta.
// - GET: verificación del webhook.
// - POST: recepción de mensajes y respuesta automática vía agente.

import { NextRequest, NextResponse } from "next/server";
import {
  extractMessages,
  sendWhatsAppText,
  verifyWhatsAppWebhook,
} from "@/lib/agent-fabric/channels/whatsapp";
import { createAgentContext, createDefaultAgentOrchestrator } from "@/lib/agent-fabric";
import type { AgentMessage } from "@/lib/agent-fabric/core/types";
import { logAuditEvent } from "@/lib/compliance/audit";

export const runtime = "nodejs";

// GET /api/webhooks/whatsapp — verificación de Meta
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifiedChallenge = verifyWhatsAppWebhook(mode, token, challenge);
  if (verifiedChallenge) {
    return new NextResponse(verifiedChallenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST /api/webhooks/whatsapp — mensajes entrantes
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const messages = extractMessages(payload);

    if (messages.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    const orchestrator = createDefaultAgentOrchestrator();
    const results: Array<{ to: string; sent: boolean }> = [];

    for (const msg of messages) {
      const agentMessage: AgentMessage = {
        id: `wa_${msg.messageId}`,
        tenantId: "bejoby",
        role: "unknown",
        channel: "whatsapp",
        text: msg.text,
        userId: msg.from,
        conversationId: msg.from,
        metadata: {
          profile_name: msg.profileName,
          timestamp: msg.timestamp,
        },
      };

      const context = createAgentContext(agentMessage, {
        dryRun: false,
        authorizedScopes: ["reply:whatsapp"],
      });

      let responseText: string;
      let handoff = false;

      try {
        const result = await orchestrator.run(agentMessage, context);
        responseText = result.response;
        handoff = result.handoffRequired;
      } catch (agentError) {
        console.error("[WhatsApp webhook] agent error:", agentError);
        responseText =
          "Gracias por escribirnos. En este momento no puedo procesar tu consulta automáticamente. Un humano te contactará pronto.";
        handoff = true;
      }

      // Si el agente pide handoff, agregar mensaje de escalamiento
      const finalText = handoff
        ? `${responseText}\n\n_(Escalado a atención humana)_`
        : responseText;

      try {
        await sendWhatsAppText({ to: msg.from, text: finalText, replyToMessageId: msg.messageId });
        results.push({ to: msg.from, sent: true });
      } catch (sendError) {
        console.error("[WhatsApp webhook] send error:", sendError);
        results.push({ to: msg.from, sent: false });
      }

      // Auditoría mínima (sin guardar el texto completo del usuario)
      await logAuditEvent({
        type: "AI_INFERENCE",
        actor_id: msg.from,
        subject_id: msg.messageId,
        subject_type: "whatsapp_message",
        purpose: "whatsapp_auto_reply",
        metadata: {
          handoff,
          response_length: finalText.length,
          profile_name: msg.profileName,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err) {
    console.error("[POST /api/webhooks/whatsapp]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
