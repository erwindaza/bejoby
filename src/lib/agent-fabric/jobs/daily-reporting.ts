import { createAgentContext } from "../core/context";
import type { AgentRunResult, TenantId } from "../core/types";
import { createDefaultAgentOrchestrator } from "../factory";

export interface DailyReportingJobInput {
  tenantId?: TenantId;
  dryRun?: boolean;
  send?: boolean;
}

export async function runDailyReportingJob(input: DailyReportingJobInput = {}): Promise<AgentRunResult> {
  const tenantId = input.tenantId || "bejoby";
  const orchestrator = createDefaultAgentOrchestrator();
  const message = {
    id: `daily-report-${new Date().toISOString().slice(0, 10)}`,
    tenantId,
    role: "admin" as const,
    channel: "scheduler" as const,
    text: "reporte diario",
  };

  const context = createAgentContext(message, {
    dryRun: input.dryRun ?? !input.send,
    authorizedScopes: input.send ? ["reports:send"] : [],
  });

  return orchestrator.run(message, context);
}
