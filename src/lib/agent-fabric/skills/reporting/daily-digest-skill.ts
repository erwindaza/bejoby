import { AgentSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, DailyReport, SkillResult } from "../../core/types";
import type { ToolRegistry } from "../../core/tool";
import { buildDefaultAudiences } from "../../tools/reporting/reporting-tools";

export class DailyDigestSkill extends AgentSkill {
  readonly id = "reporting.daily_digest" as const;
  readonly description = "Build and deliver candidate, employer and admin daily reports.";

  canHandle(message: AgentMessage, context: AgentContext): boolean {
    return message.channel === "scheduler" || context.role === "admin" || /reporte diario|daily report|digest/i.test(message.text);
  }

  async run(_message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<SkillResult> {
    const date = new Date().toISOString().slice(0, 10);
    const metricsResult = await tools
      .get<{ date: string }, { metrics: Record<string, unknown> }>("reporting.collect_daily_metrics")
      .execute({ date }, context);
    const metrics = metricsResult.data?.metrics || {};

    const reports: DailyReport[] = buildDefaultAudiences(context.tenantId).map((audience) => ({
      audience,
      subject: `Resumen diario BeJoby - ${date}`,
      body: this.bodyFor(audience.type),
      metrics,
    }));

    const delivery = await tools
      .get<{ reports: DailyReport[] }, { delivered: number; dryRun: boolean }>("reporting.deliver_digest")
      .execute({ reports }, context);

    return {
      response: `Reporte diario preparado para ${delivery.data?.delivered || 0} audiencia(s).`,
      actions: [
        { type: "tool_call", name: "reporting.collect_daily_metrics", payload: metrics },
        { type: "report_delivery", name: "reporting.deliver_digest", payload: { delivered: delivery.data?.delivered || 0, dry_run: delivery.data?.dryRun ?? true } },
      ],
      evidence: [...(metricsResult.evidence || []), ...(delivery.evidence || [])],
    };
  }

  private bodyFor(type: DailyReport["audience"]["type"]): string {
    if (type === "candidate") return "Resumen de oportunidades, contenidos de apoyo y proximos pasos sugeridos.";
    if (type === "employer") return "Resumen de postulaciones, candidatos nuevos y acciones recomendadas.";
    return "Resumen operacional: actividad, reportería, fallas y puntos que requieren revision.";
  }
}
