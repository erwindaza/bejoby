export type TenantId = "bejoby" | "aif369";

export type AgentRole = "candidate" | "employer" | "admin" | "operator" | "unknown";

export type AgentId = "agent-bejoby" | "agent-aif369" | "agent-reporting";

export type SkillId =
  | "bejoby.intent"
  | "bejoby.jobs_search"
  | "bejoby.application_status"
  | "bejoby.consent"
  | "bejoby.employer_lead"
  | "bejoby.coach"
  | "aif369.discovery"
  | "reporting.daily_digest"
  | "shared.faq_rag"
  | "shared.conversation_summary";

export type ToolId =
  | "jobs.search"
  | "application.get_status"
  | "lead.create"
  | "reporting.collect_daily_metrics"
  | "reporting.deliver_digest";

export interface AgentMessage {
  id: string;
  tenantId: TenantId;
  role: AgentRole;
  channel: "whatsapp" | "webchat" | "internal" | "scheduler";
  text: string;
  userId?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  traceId: string;
  tenantId: TenantId;
  role: AgentRole;
  locale: "es" | "en";
  dryRun: boolean;
  authorizedScopes: string[];
  metadata: Record<string, unknown>;
}

export interface AgentRunResult {
  agentId: AgentId;
  traceId: string;
  response: string;
  actions: AgentAction[];
  handoffRequired: boolean;
  evidence: AgentEvidence[];
  metadata: Record<string, unknown>;
}

export interface AgentAction {
  type: "reply" | "tool_call" | "handoff" | "report_delivery" | "noop";
  name: string;
  payload: Record<string, unknown>;
}

export interface AgentEvidence {
  source: string;
  summary: string;
  ref?: string;
}

export interface SkillResult {
  response?: string;
  actions: AgentAction[];
  evidence: AgentEvidence[];
  metadata?: Record<string, unknown>;
}

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  evidence?: AgentEvidence[];
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export interface DailyReportAudience {
  id: string;
  type: "candidate" | "employer" | "admin";
  tenantId: TenantId;
  channel: "email" | "dashboard" | "whatsapp";
  address?: string;
}

export interface DailyReport {
  audience: DailyReportAudience;
  subject: string;
  body: string;
  metrics: Record<string, unknown>;
}
