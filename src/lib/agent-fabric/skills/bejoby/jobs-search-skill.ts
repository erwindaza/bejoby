import { AgentSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, SkillResult } from "../../core/types";
import type { ToolRegistry } from "../../core/tool";
import type { JobsSearchInput, JobsSearchOutput } from "../../tools/bejoby/jobs-search-tool";

export class BeJobyJobsSearchSkill extends AgentSkill {
  readonly id = "bejoby.jobs_search" as const;
  readonly description = "Help candidates search public jobs.";

  canHandle(message: AgentMessage): boolean {
    return /trabajo|vacante|oferta|empleo|job|buscar/i.test(message.text);
  }

  async run(message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<SkillResult> {
    const result = await tools.get<JobsSearchInput, JobsSearchOutput>("jobs.search").execute({ query: message.text, limit: 3 }, context);
    const jobs = result.data?.jobs || [];

    return {
      response: jobs.length
        ? `Encontre ${jobs.length} oportunidad(es). La mas relevante es: ${jobs[0].title} (${jobs[0].location}).`
        : "No encontre vacantes publicas con esos terminos. Puedo ayudarte a ajustar la busqueda o revisar contenidos de apoyo.",
      actions: [{ type: "tool_call", name: "jobs.search", payload: { count: jobs.length } }],
      evidence: result.evidence || [],
    };
  }
}
