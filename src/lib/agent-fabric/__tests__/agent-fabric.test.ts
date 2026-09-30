import { describe, expect, it } from "vitest";
import { createAgentContext } from "../core/context";
import type { AgentMessage } from "../core/types";
import { createDefaultAgentOrchestrator } from "../factory";
import { runDailyReportingJob } from "../jobs/daily-reporting";

describe("agent fabric", () => {
  it("routes BeJoby candidate job search to agent-bejoby", async () => {
    const message: AgentMessage = {
      id: "msg-1",
      tenantId: "bejoby",
      role: "candidate",
      channel: "webchat",
      text: "busco trabajo cloud data",
    };

    const result = await createDefaultAgentOrchestrator().run(message, createAgentContext(message));

    expect(result.agentId).toBe("agent-bejoby");
    expect(result.metadata.skill).toBe("bejoby.jobs_search");
    expect(result.actions[0]?.name).toBe("jobs.search");
  });

  it("requires authorization before application status data", async () => {
    const message: AgentMessage = {
      id: "msg-2",
      tenantId: "bejoby",
      role: "candidate",
      channel: "webchat",
      text: "quiero ver el estado de mi postulacion",
    };

    const result = await createDefaultAgentOrchestrator().run(message, createAgentContext(message));

    expect(result.agentId).toBe("agent-bejoby");
    expect(result.metadata.requires_identity).toBe(true);
    expect(result.response).toContain("validar tu identidad");
  });

  it("routes AIF369 requests to agent-aif369", async () => {
    const message: AgentMessage = {
      id: "msg-3",
      tenantId: "aif369",
      role: "employer",
      channel: "webchat",
      text: "necesito un AI Sprint para mi empresa",
    };

    const result = await createDefaultAgentOrchestrator().run(message, createAgentContext(message));

    expect(result.agentId).toBe("agent-aif369");
    expect(result.metadata.skill).toBe("aif369.discovery");
  });

  it("prepares daily reports in dry-run mode", async () => {
    const result = await runDailyReportingJob({ tenantId: "bejoby", dryRun: true });

    expect(result.agentId).toBe("agent-reporting");
    expect(result.metadata.skill).toBe("reporting.daily_digest");
    expect(result.actions.some((action) => action.name === "reporting.deliver_digest")).toBe(true);
    expect(result.response).toContain("Reporte diario preparado");
  });
});
