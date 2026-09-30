import { createAgentContext, createDefaultAgentOrchestrator } from "@/lib/agent-fabric";
import { error, serverError, success } from "@/lib/utils/api-response";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  tenant_id: z.enum(["bejoby", "aif369"]).default("bejoby"),
  role: z.enum(["candidate", "employer", "admin", "operator", "unknown"]).default("unknown"),
  channel: z.enum(["whatsapp", "webchat", "internal", "scheduler"]).default("internal"),
  text: z.string().min(1).max(4000),
  user_id: z.string().optional(),
  conversation_id: z.string().optional(),
  dry_run: z.boolean().default(true),
  authorized_scopes: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return error("Solicitud inválida", 400);

    const message = {
      id: `msg_${Date.now()}`,
      tenantId: parsed.data.tenant_id,
      role: parsed.data.role,
      channel: parsed.data.channel,
      text: parsed.data.text,
      userId: parsed.data.user_id,
      conversationId: parsed.data.conversation_id,
    };

    const context = createAgentContext(message, {
      dryRun: parsed.data.dry_run,
      authorizedScopes: parsed.data.authorized_scopes,
    });

    const result = await createDefaultAgentOrchestrator().run(message, context);
    return success({ result });
  } catch (err) {
    console.error("[POST /api/agent/messages]", err);
    return serverError();
  }
}
