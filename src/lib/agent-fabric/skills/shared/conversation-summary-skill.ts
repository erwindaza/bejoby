import { AgentSkill } from "../../core/skill";
import type { AgentMessage, SkillResult } from "../../core/types";

export class ConversationSummarySkill extends AgentSkill {
  readonly id = "shared.conversation_summary" as const;
  readonly description = "Summarize a conversation for audit or handoff without hidden chain-of-thought.";

  canHandle(message: AgentMessage): boolean {
    return /resumen|summary|handoff/i.test(message.text);
  }

  async run(message: AgentMessage): Promise<SkillResult> {
    return {
      response: "Prepare un resumen operativo breve para continuidad o derivacion humana.",
      actions: [{ type: "noop", name: "conversation_summary", payload: { text_length: message.text.length } }],
      evidence: [{ source: "shared.conversation_summary", summary: "Operational summary requested" }],
    };
  }
}
