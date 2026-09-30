import { AgentSkill } from "../../core/skill";
import type { SkillResult } from "../../core/types";

export class BeJobyIntentSkill extends AgentSkill {
  readonly id = "bejoby.intent" as const;
  readonly description = "Fallback supportive BeJoby intent response.";

  canHandle(): boolean {
    return true;
  }

  async run(): Promise<SkillResult> {
    return {
      response: "Estoy aqui para ayudarte a ordenar el siguiente paso: buscar oportunidades, revisar contenidos de apoyo, pedir orientacion o hablar con una persona.",
      actions: [{ type: "reply", name: "supportive_fallback", payload: {} }],
      evidence: [{ source: "bejoby.intent", summary: "Supportive fallback response" }],
    };
  }
}
