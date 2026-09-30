import { AgentSkill } from "../../core/skill";
import type { AgentMessage, SkillResult } from "../../core/types";

export class ConsentSkill extends AgentSkill {
  readonly id = "bejoby.consent" as const;
  readonly description = "Explain privacy and consent in plain language.";

  canHandle(message: AgentMessage): boolean {
    return /privacidad|consent|datos personales|borrar datos/i.test(message.text);
  }

  async run(): Promise<SkillResult> {
    return {
      response: "Usaremos tus datos solo para orientarte y responder tu solicitud. No prometemos empleo ni tomamos decisiones de contratacion automatizadas.",
      actions: [{ type: "reply", name: "consent_explanation", payload: {} }],
      evidence: [{ source: "bejoby.consent", summary: "Consent explanation from SPEC-001" }],
    };
  }
}
