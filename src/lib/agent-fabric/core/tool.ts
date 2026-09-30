import type { AgentContext, ToolId, ToolResult } from "./types";

export abstract class AgentTool<TInput = unknown, TOutput = unknown> {
  abstract readonly id: ToolId;
  abstract readonly description: string;

  abstract execute(input: TInput, context: AgentContext): Promise<ToolResult<TOutput>>;
}

export class ToolRegistry {
  private readonly tools = new Map<ToolId, AgentTool>();

  register(tool: AgentTool): this {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool already registered: ${tool.id}`);
    }
    this.tools.set(tool.id, tool);
    return this;
  }

  get<TInput = unknown, TOutput = unknown>(id: ToolId): AgentTool<TInput, TOutput> {
    const tool = this.tools.get(id);
    if (!tool) throw new Error(`Tool not registered: ${id}`);
    return tool as AgentTool<TInput, TOutput>;
  }

  list(): ToolId[] {
    return [...this.tools.keys()];
  }
}
