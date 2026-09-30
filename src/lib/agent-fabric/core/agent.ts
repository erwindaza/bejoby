import type { AgentContext, AgentId, AgentMessage, AgentRunResult } from "./types";
import { PolicyValidator } from "./policy-validator";
import type { AgentSkill } from "./skill";
import type { ToolRegistry } from "./tool";

export abstract class BaseAgent {
  abstract readonly id: AgentId;
  abstract readonly displayName: string;
  protected abstract readonly skills: AgentSkill[];

  protected readonly policy = new PolicyValidator();

  async run(message: AgentMessage, context: AgentContext, tools: ToolRegistry): Promise<AgentRunResult> {
    const messageDecision = this.policy.validateMessage(message, context);
    if (!messageDecision.allowed) {
      return this.blocked(context, messageDecision.reason);
    }

    const skill = this.skills.find((candidate) => candidate.canHandle(message, context));
    if (!skill) {
      return {
        agentId: this.id,
        traceId: context.traceId,
        response: "Puedo ayudarte, pero necesito un poco mas de contexto para derivarte al apoyo correcto.",
        actions: [{ type: "handoff", name: "clarify_intent", payload: { reason: "no_skill_match" } }],
        handoffRequired: true,
        evidence: [],
        metadata: { reason: "no_skill_match" },
      };
    }

    const result = await skill.run(message, context, tools);
    const allowedActions = result.actions.filter((action) => this.policy.validateAction(action, context).allowed);
    const blockedActions = result.actions.length - allowedActions.length;

    return {
      agentId: this.id,
      traceId: context.traceId,
      response: result.response || "Listo, deje preparada la accion solicitada.",
      actions: allowedActions,
      handoffRequired: allowedActions.some((action) => action.type === "handoff"),
      evidence: result.evidence,
      metadata: {
        skill: skill.id,
        blocked_actions: blockedActions,
        ...(result.metadata || {}),
      },
    };
  }

  private blocked(context: AgentContext, reason: string): AgentRunResult {
    return {
      agentId: this.id,
      traceId: context.traceId,
      response: "No puedo continuar con esa solicitud sin validar primero las reglas de seguridad y privacidad.",
      actions: [{ type: "handoff", name: "policy_block", payload: { reason } }],
      handoffRequired: true,
      evidence: [],
      metadata: { reason },
    };
  }
}
