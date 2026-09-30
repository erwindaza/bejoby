import type { AgentContext, AgentMessage, SkillId, SkillResult } from "./types";
import type { ToolRegistry } from "./tool";

export abstract class AgentSkill {
  abstract readonly id: SkillId;
  abstract readonly description: string;

  abstract canHandle(message: AgentMessage, context: AgentContext): boolean;

  abstract run(message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<SkillResult>;
}
