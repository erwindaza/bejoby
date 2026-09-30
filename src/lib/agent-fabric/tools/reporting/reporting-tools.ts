import { AgentTool } from "../../core/tool";
import type { AgentContext, DailyReport, DailyReportAudience, ToolResult } from "../../core/types";

export class CollectDailyMetricsTool extends AgentTool<{ date: string }, { metrics: Record<string, unknown> }> {
  readonly id = "reporting.collect_daily_metrics" as const;
  readonly description = "Collect daily metrics for candidate, employer and admin digests.";

  async execute(input: { date: string }, context: AgentContext): Promise<ToolResult<{ metrics: Record<string, unknown> }>> {
    return {
      ok: true,
      data: {
        metrics: {
          date: input.date,
          tenant_id: context.tenantId,
          applications_submitted: 0,
          jobs_published: 1,
          help_requests: 0,
          ai_bookings: 0,
        },
      },
      evidence: [{ source: "reporting.collect_daily_metrics", summary: "PoC metrics collected in dry-run mode" }],
    };
  }
}

export class DeliverDigestTool extends AgentTool<{ reports: DailyReport[] }, { delivered: number; dryRun: boolean }> {
  readonly id = "reporting.deliver_digest" as const;
  readonly description = "Deliver or simulate delivery of daily reports.";

  async execute(input: { reports: DailyReport[] }, context: AgentContext): Promise<ToolResult<{ delivered: number; dryRun: boolean }>> {
    if (!context.dryRun && !context.authorizedScopes.includes("reports:send")) {
      return { ok: false, error: "missing_reports_send_scope" };
    }

    return {
      ok: true,
      data: { delivered: input.reports.length, dryRun: context.dryRun },
      evidence: [{ source: "reporting.deliver_digest", summary: `${input.reports.length} reports prepared` }],
    };
  }
}

export function buildDefaultAudiences(tenantId: "bejoby" | "aif369"): DailyReportAudience[] {
  if (tenantId !== "bejoby") return [];
  return [
    { id: "candidate-digest", type: "candidate", tenantId, channel: "dashboard" },
    { id: "employer-digest", type: "employer", tenantId, channel: "dashboard" },
    { id: "admin-digest", type: "admin", tenantId, channel: "email" },
  ];
}
