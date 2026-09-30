import { BaseAgent } from "../../core/agent";
import type { AgentSkill } from "../../core/skill";
import { BeJobyApplicationStatusSkill } from "../../skills/bejoby/application-status-skill";
import { ConsentSkill } from "../../skills/bejoby/consent-skill";
import { EmployerLeadSkill } from "../../skills/bejoby/employer-lead-skill";
import { BeJobyIntentSkill } from "../../skills/bejoby/intent-skill";
import { BeJobyJobsSearchSkill } from "../../skills/bejoby/jobs-search-skill";
import { FaqRagSkill } from "../../skills/shared/faq-rag-skill";
import { ConversationSummarySkill } from "../../skills/shared/conversation-summary-skill";

export class BeJobyAgent extends BaseAgent {
  readonly id = "agent-bejoby" as const;
  readonly displayName = "BeJoby Agent";

  protected readonly skills: AgentSkill[] = [
    new ConversationSummarySkill(),
    new ConsentSkill(),
    new BeJobyApplicationStatusSkill(),
    new BeJobyJobsSearchSkill(),
    new EmployerLeadSkill(),
    new FaqRagSkill(),
    new BeJobyIntentSkill(),
  ];
}
