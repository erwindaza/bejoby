import { Aif369Agent } from "./agents/aif369/aif369-agent";
import { BeJobyAgent } from "./agents/bejoby/bejoby-agent";
import { ReportingAgent } from "./agents/reporting/reporting-agent";
import { AgentOrchestrator } from "./core/orchestrator";
import { ToolRegistry } from "./core/tool";
import { ApplicationStatusTool } from "./tools/bejoby/application-status-tool";
import { JobsSearchTool } from "./tools/bejoby/jobs-search-tool";
import { LeadCreateTool } from "./tools/bejoby/lead-create-tool";
import { CollectDailyMetricsTool, DeliverDigestTool } from "./tools/reporting/reporting-tools";

export function createDefaultToolRegistry(): ToolRegistry {
  return new ToolRegistry()
    .register(new JobsSearchTool())
    .register(new ApplicationStatusTool())
    .register(new LeadCreateTool())
    .register(new CollectDailyMetricsTool())
    .register(new DeliverDigestTool());
}

export function createDefaultAgentOrchestrator(): AgentOrchestrator {
  const tools = createDefaultToolRegistry();
  return new AgentOrchestrator(tools)
    .register(new BeJobyAgent())
    .register(new Aif369Agent())
    .register(new ReportingAgent());
}
