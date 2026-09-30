import type { AgentAction, AgentContext, AgentMessage, PolicyDecision } from "./types";

export class PolicyValidator {
  validateMessage(message: AgentMessage, context: AgentContext): PolicyDecision {
    if (message.tenantId !== context.tenantId) {
      return { allowed: false, reason: "tenant_mismatch" };
    }

    if (!message.text.trim()) {
      return { allowed: false, reason: "empty_message" };
    }

    return { allowed: true, reason: "ok" };
  }

  validateAction(action: AgentAction, context: AgentContext): PolicyDecision {
    if (action.type === "report_delivery" && !context.dryRun && !context.authorizedScopes.includes("reports:send")) {
      return { allowed: false, reason: "missing_reports_send_scope" };
    }

    if (action.name === "application.get_status" && !context.authorizedScopes.includes("applications:read")) {
      return { allowed: false, reason: "missing_applications_read_scope" };
    }

    return { allowed: true, reason: "ok" };
  }
}
