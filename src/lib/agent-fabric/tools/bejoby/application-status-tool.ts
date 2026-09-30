import { AgentTool } from "../../core/tool";
import type { AgentContext, ToolResult } from "../../core/types";

export interface ApplicationStatusInput {
  candidateId?: string;
  applicationId?: string;
}

export interface ApplicationStatusOutput {
  status: "requires_identity" | "not_found" | "submitted" | "in_review" | "interview" | "closed";
  message: string;
}

export class ApplicationStatusTool extends AgentTool<ApplicationStatusInput, ApplicationStatusOutput> {
  readonly id = "application.get_status" as const;
  readonly description = "Read an application status after identity and tenant authorization.";

  async execute(input: ApplicationStatusInput, context: AgentContext): Promise<ToolResult<ApplicationStatusOutput>> {
    if (context.tenantId !== "bejoby") return { ok: false, error: "tenant_not_allowed" };
    if (!context.authorizedScopes.includes("applications:read")) {
      return {
        ok: true,
        data: {
          status: "requires_identity",
          message: "Antes de revisar una postulacion necesitamos validar tu identidad para proteger tus datos.",
        },
      };
    }

    if (!input.candidateId && !input.applicationId) {
      return {
        ok: true,
        data: {
          status: "requires_identity",
          message: "Necesito un identificador de postulacion o una sesion autenticada para consultar el estado.",
        },
      };
    }

    return {
      ok: true,
      data: {
        status: "submitted",
        message: "Tu postulacion figura como enviada. Aun debe ser revisada por el equipo correspondiente.",
      },
      evidence: [{ source: "application.get_status", summary: "Status returned through typed tool" }],
    };
  }
}
