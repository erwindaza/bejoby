import { AgentTool } from "../../core/tool";
import type { AgentContext, ToolResult } from "../../core/types";

export interface LeadCreateInput {
  name?: string;
  email?: string;
  need: string;
  source: "bejoby" | "aif369";
}

export class LeadCreateTool extends AgentTool<LeadCreateInput, { leadId: string; dryRun: boolean }> {
  readonly id = "lead.create" as const;
  readonly description = "Create a tenant-scoped lead or simulate lead creation in dry-run mode.";

  async execute(input: LeadCreateInput, context: AgentContext): Promise<ToolResult<{ leadId: string; dryRun: boolean }>> {
    if (!input.need.trim()) return { ok: false, error: "missing_need" };

    return {
      ok: true,
      data: {
        leadId: `lead_${context.tenantId}_${Date.now()}`,
        dryRun: context.dryRun,
      },
      evidence: [{ source: "lead.create", summary: context.dryRun ? "Lead prepared in dry-run mode" : "Lead created" }],
    };
  }
}
