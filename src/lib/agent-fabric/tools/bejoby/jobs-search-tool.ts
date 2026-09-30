import { AgentTool } from "../../core/tool";
import type { AgentContext, ToolResult } from "../../core/types";

export interface JobsSearchInput {
  query?: string;
  limit?: number;
}

export interface JobsSearchOutput {
  jobs: Array<{ id: string; title: string; company: string; location: string; url: string }>;
}

export class JobsSearchTool extends AgentTool<JobsSearchInput, JobsSearchOutput> {
  readonly id = "jobs.search" as const;
  readonly description = "Search public BeJoby jobs using a typed, tenant-scoped interface.";

  async execute(input: JobsSearchInput, context: AgentContext): Promise<ToolResult<JobsSearchOutput>> {
    if (context.tenantId !== "bejoby") return { ok: false, error: "tenant_not_allowed" };

    const query = (input.query || "").toLowerCase();
    const catalog = [
      {
        id: "cloud-data-architect",
        title: "Cloud Data Architect",
        company: "BeJoby",
        location: "Remote",
        url: "/en/jobs/1kWUCXkp0lQbLnMUIn6J",
      },
    ];

    const jobs = catalog
      .filter((job) => !query || `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(query))
      .slice(0, input.limit || 5);

    return {
      ok: true,
      data: { jobs },
      evidence: [{ source: "jobs.search", summary: `${jobs.length} public jobs matched`, ref: "static-poc-catalog" }],
    };
  }
}
