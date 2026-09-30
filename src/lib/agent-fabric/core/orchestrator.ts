import type { AgentContext, AgentId, AgentMessage, AgentRunResult } from "./types";
import type { BaseAgent } from "./agent";
import type { ToolRegistry } from "./tool";

export class AgentOrchestrator {
  private readonly agents = new Map<AgentId, BaseAgent>();

  constructor(private readonly tools: ToolRegistry) {}

  register(agent: BaseAgent): this {
    if (this.agents.has(agent.id)) throw new Error(`Agent already registered: ${agent.id}`);
    this.agents.set(agent.id, agent);
    return this;
  }

  async run(message: AgentMessage, context: AgentContext): Promise<AgentRunResult> {
    const agent = this.resolveAgent(message);
    return agent.run(message, context, this.tools);
  }

  private resolveAgent(message: AgentMessage): BaseAgent {
    if (message.channel === "scheduler" || message.role === "admin") return this.mustGet("agent-reporting");
    if (message.tenantId === "aif369") return this.mustGet("agent-aif369");
    return this.mustGet("agent-bejoby");
  }

  private mustGet(id: AgentId): BaseAgent {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent not registered: ${id}`);
    return agent;
  }
}
