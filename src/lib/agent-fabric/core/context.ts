import type { AgentContext, AgentMessage } from "./types";

export function createAgentContext(
  message: AgentMessage,
  overrides: Partial<AgentContext> = {},
): AgentContext {
  return {
    traceId: overrides.traceId || `trace_${Date.now()}_${message.id}`,
    tenantId: overrides.tenantId || message.tenantId,
    role: overrides.role || message.role,
    locale: overrides.locale || "es",
    dryRun: overrides.dryRun ?? true,
    authorizedScopes: overrides.authorizedScopes || [],
    metadata: overrides.metadata || {},
  };
}
