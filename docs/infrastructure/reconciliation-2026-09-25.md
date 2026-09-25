# Infrastructure Reconciliation - 2026-09-25

This document reconciles the BeJoby repository, AIF369 Agent Fabric specs and verified `agent01` infrastructure state.

---

## Current Repository State

Existing:
- BeJoby Next.js app in `src/`.
- SDD specs at repo root.
- `docs/infrastructure/` for operational runbooks.
- `scripts/` for existing app/data scripts.

Not yet present:
- `infra/agent01/`
- `agents/`
- `mcp/`
- `rag/`
- Agent Gateway implementation.
- PostgreSQL/pgvector deployment.

---

## Integration Rule

Do not duplicate shared fabric components for BeJoby and AIF369.

Shared components belong to the Agent Fabric layer:
- Agent Gateway
- LLM Gateway
- MCP registry
- RAG runtime
- PostgreSQL/pgvector
- Observability
- Deployment scripts

Tenant-specific components stay separated:
- BeJoby prompts/policies/tools/knowledge.
- AIF369 prompts/policies/tools/knowledge.

---

## Suggested Paths

```text
docs/infrastructure/
  agent01.md
  architecture.md
  reconciliation-2026-09-25.md
  adr/
    ADR-001-multi-agent-runtime-agent01.md
    ADR-002-local-operator-control-plane.md
  runbooks/
    agent01-ssh.md

infra/agent01/
  README.md
  bootstrap.sh
  deploy.sh
  healthcheck.sh
  scripts/
    inspect-system.sh
    inspect-disks-readonly.sh
    verify-ssh.sh
    verify-gpu.sh
```

Do not create `infra/agent01` scripts until we are ready to implement non-destructive, idempotent operations.

---

## First Implementation Sequence

1. Finalize docs alignment across BeJoby and AIF369 agents.
2. Choose lightweight operator notification channel.
3. Add minimal Agent Gateway `/health` endpoint.
4. Add non-destructive `agent01` diagnostics script.
5. Implement notify -> plan -> approval -> execute -> verify -> report for one repetitive task.
6. Containerize the same workflow for `agent01`/cloud reproducibility.
7. Implement first BeJoby typed tool and vertical slice.
8. Connect WhatsApp Cloud API only after internal path works.

---

## Safety Rules

- Do not commit secrets, credentials, tokens or private SSH keys.
- Do not expose PostgreSQL, Docker daemon or SSH directly to the public Internet.
- Do not disable SSH password authentication until dedicated key auth is verified and rollback is ready.
- Do not give autonomous agents unrestricted sudo/root privileges.
- Do not format `/dev/sda`.
- Do not install local LLMs before GPU/VRAM/thermal baseline is verified.
- Do not install Kubernetes for the MVP.
- Document infrastructure changes in the repository.
- Provide verification command and rollback strategy for meaningful infrastructure changes.
