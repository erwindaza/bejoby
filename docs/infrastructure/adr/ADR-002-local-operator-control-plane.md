# ADR-002 - Local Operator Control Plane

**Status:** Proposed
**Date:** 2026-09-25

---

## Context

`dev01` is already the workstation for VS Code, Codex, Git and SSH administration. Some repetitive development and operations tasks can be automated locally while preserving human approval for high-impact actions.

---

## Decision

Use `dev01` as a supervised local operator workstation where the assistant can:
- automate repetitive tasks;
- report plans to Erwin;
- request approvals;
- later reproduce workflows on `agent01` or cloud.

---

## Local Stack

```text
VS Code / Codex / Hermes on dev01
  -> local operator policy
  -> approval + notification channel
  -> tools / MCP / scripts
  -> reproducible containerized services
  -> agent01 or cloud runtime
```

---

## Notification Channels

Use an abstraction, not one hardwired provider.

Initial modes:
- console
- webhook
- Telegram
- Pushover

WhatsApp rule:
- WhatsApp is preferred for human habit.
- Infrastructure control should use official WhatsApp Business Cloud API or a trusted provider.
- Avoid unofficial WhatsApp Web automation.

---

## May Automate

- status reports
- test runs
- diff summaries
- documentation updates
- log review
- health checks
- drafting messages
- preparing commits for review
- preparing PR summaries
- non-destructive diagnostics

---

## Requires Explicit Approval

- sending messages to third parties
- submitting forms
- submitting applications
- submitting test results
- committing code
- pushing code
- deploying infrastructure
- changing credentials
- changing IAM
- changing DNS
- changing payment settings
- touching production data
- disk partitioning or formatting
- destructive commands

---

## Stop Mechanisms

- `Ctrl+C`
- `/stop`
- newer user instruction
- operator approval denial
