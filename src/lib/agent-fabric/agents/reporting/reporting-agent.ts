import { BaseAgent } from "../../core/agent";
import type { AgentSkill } from "../../core/skill";
import { DailyDigestSkill } from "../../skills/reporting/daily-digest-skill";
import { ConversationSummarySkill } from "../../skills/shared/conversation-summary-skill";

export class ReportingAgent extends BaseAgent {
  readonly id = "agent-reporting" as const;
  readonly displayName = "Reporting Agent";

  protected readonly skills: AgentSkill[] = [
    new DailyDigestSkill(),
    new ConversationSummarySkill(),
  ];
}
