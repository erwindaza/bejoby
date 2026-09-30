import { BaseAgent } from "../../core/agent";
import type { AgentSkill } from "../../core/skill";
import { FaqRagSkill } from "../../skills/shared/faq-rag-skill";
import { ConversationSummarySkill } from "../../skills/shared/conversation-summary-skill";
import { AgentSkill as AbstractSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, SkillResult } from "../../core/types";
import type { ToolRegistry } from "../../core/tool";
import type { LeadCreateInput } from "../../tools/bejoby/lead-create-tool";

class Aif369DiscoverySkill extends AbstractSkill {
  readonly id = "aif369.discovery" as const;
  readonly description = "Capture AIF369 B2B discovery needs for review.";

  canHandle(): boolean {
    return true;
  }

  async run(message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<SkillResult> {
    const result = await tools
      .get<LeadCreateInput, { leadId: string; dryRun: boolean }>("lead.create")
      .execute({ need: message.text, source: "aif369" }, context);

    return {
      response: "Deje preparado el requerimiento para revision. Una persona debe aprobar cualquier propuesta o contacto externo.",
      actions: [{ type: "tool_call", name: "lead.create", payload: { lead_id: result.data?.leadId, dry_run: result.data?.dryRun } }],
      evidence: result.evidence || [],
    };
  }
}

export class Aif369Agent extends BaseAgent {
  readonly id = "agent-aif369" as const;
  readonly displayName = "AIF369 Agent";

  protected readonly skills: AgentSkill[] = [
    new ConversationSummarySkill(),
    new FaqRagSkill(),
    new Aif369DiscoverySkill(),
  ];
}
