# ADR-001 - Multi-Agent Runtime On agent01

**Status:** Accepted
**Date:** 2026-09-25

---

## Context

BeJoby and AIF369 both need conversational agents, but duplicating full infrastructure stacks would waste resources and create inconsistent governance.

`agent01` has limited but useful local capacity and should run shared Agent Fabric services.

---

## Decision

`agent01` runs one shared agentic team behind a common `agent-gateway`, not separate duplicated BeJoby and AIF369 stacks.

Entrypoint:

```text
agent-gateway
```

Initial specialist agents:
- `agent-bejoby`
- `agent-aif369`

Shared services:
- `policy-validator`
- `llm-gateway`
- `mcp-registry`
- `rag-runtime`
- `postgres-pgvector`
- `observability`

---

## Routing

Use this hierarchy:
1. Explicit channel or tenant.
2. Persisted conversation context.
3. Deterministic domain rules.
4. Intent classification.
5. Clarification when ambiguous.

Do not let an LLM choose the route without validation.

---

## Validation

Critical best practices must be enforced by code, schemas and policies rather than prompt instructions alone.

Required validation categories:
- authorization
- tenant isolation
- tool permission
- input schema
- output schema
- grounding
- business rules
- privacy
- iteration budget
- timeout
- idempotency where applicable
- human approval where required

---

## Handoff

Handoff is enabled between specialist agents.

Preserve:
- `trace_id`
- `conversation_id`
- authorized context
- `handoff_reason`

Example:
- A BeJoby conversation becomes a request for an enterprise AI Sprint.
- `agent-bejoby` hands off to `agent-aif369`.

---

## Consequences

Positive:
- Shared infrastructure.
- Lower operational load.
- Better governance.
- Easier observability.

Tradeoffs:
- Requires strong tenant isolation.
- Requires policy validation before and after tool/model use.
- Requires careful routing and handoff design.
