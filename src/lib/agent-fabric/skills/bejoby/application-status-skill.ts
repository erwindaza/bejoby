import { AgentSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, SkillResult } from "../../core/types";
import type { ToolRegistry } from "../../core/tool";
import type { ApplicationStatusInput, ApplicationStatusOutput } from "../../tools/bejoby/application-status-tool";

export class BeJobyApplicationStatusSkill extends AgentSkill {
  readonly id = "bejoby.application_status" as const;
  readonly description = "Help candidates check an application status with authorization.";

  canHandle(message: AgentMessage): boolean {
    return /estado|postulaci|aplicaci|status/i.test(message.text);
  }

  async run(message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<SkillResult> {
    const result = await tools
      .get<ApplicationStatusInput, ApplicationStatusOutput>("application.get_status")
      .execute({ candidateId: message.userId }, context);

    return {
      response: result.data?.message || "No pude obtener el estado en este momento. Puedo derivarte a una persona.",
      actions: [{ type: "tool_call", name: "application.get_status", payload: { status: result.data?.status || "error" } }],
      evidence: result.evidence || [],
      metadata: { requires_identity: result.data?.status === "requires_identity" },
    };
  }
}
