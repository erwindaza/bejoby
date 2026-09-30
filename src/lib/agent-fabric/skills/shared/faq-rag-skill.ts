import { AgentSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, SkillResult } from "../../core/types";

export class FaqRagSkill extends AgentSkill {
  readonly id = "shared.faq_rag" as const;
  readonly description = "Answer basic BeJoby/AIF369 FAQs with supportive grounded wording.";

  canHandle(message: AgentMessage): boolean {
    return /como funciona|qué es|que es|faq|ayuda|privacidad|donaci/i.test(message.text);
  }

  async run(message: AgentMessage, context: AgentContext): Promise<SkillResult> {
    const response = context.tenantId === "bejoby"
      ? "BeJoby es un espacio de apoyo laboral: puedes revisar oportunidades, contenidos practicos y pedir orientacion. La donacion es voluntaria y no condiciona el acceso."
      : "AIF369 ayuda a empresas a diseñar e implementar soluciones de IA, agentes, RAG, automatizacion y gobierno con foco pragmatico.";

    return {
      response,
      actions: [{ type: "reply", name: "faq_answer", payload: { tenant_id: context.tenantId } }],
      evidence: [{ source: "shared.faq_rag", summary: "Static PoC FAQ response" }],
    };
  }
}
