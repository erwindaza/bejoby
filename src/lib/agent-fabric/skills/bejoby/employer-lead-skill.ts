import { AgentSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, SkillResult } from "../../core/types";
import type { ToolRegistry } from "../../core/tool";
import type { LeadCreateInput } from "../../tools/bejoby/lead-create-tool";

export class EmployerLeadSkill extends AgentSkill {
  readonly id = "bejoby.employer_lead" as const;
  readonly description = "Capture an employer hiring need as a safe lead.";

  canHandle(message: AgentMessage): boolean {
    return /contratar|empresa|candidato|perfil|reclutar|hiring/i.test(message.text);
  }

  async run(message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<SkillResult> {
    const result = await tools
      .get<LeadCreateInput, { leadId: string; dryRun: boolean }>("lead.create")
      .execute({ need: message.text, source: "bejoby" }, context);

    return {
      response: "Gracias. Deje preparado tu requerimiento para que el equipo lo revise. No enviaremos propuestas externas sin aprobacion humana.",
      actions: [{ type: "tool_call", name: "lead.create", payload: { lead_id: result.data?.leadId, dry_run: result.data?.dryRun } }],
      evidence: result.evidence || [],
    };
  }
}
