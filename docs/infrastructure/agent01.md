# agent01 Infrastructure State

**Host:** `agent01`
**Device:** Lenovo Legion Y520-15IKBN
**Role:** first productive AIF369 Agent Fabric node
**Status:** active
**Date:** 2026-09-25

---

## Operating Model

`dev01` is the development/control workstation. `agent01` is a production-style server.

Rules:
- Do not use `agent01` as the primary development workstation.
- Do not install unnecessary GUI/development tools on `agent01`.
- Infrastructure changes should become reproducible scripts/configuration in Git.
- Do not recreate verified infrastructure without a reason.

---

## Verified System

```text
hostname: agent01
os: Ubuntu 26.04.1 LTS
kernel: Linux 7.0.0-34-generic
architecture: x86-64
user: erwin
timezone: America/Santiago
```

Hardware:

```text
model: Lenovo Legion Y520-15IKBN
cpu: Intel Core i5-7300HQ
logical CPUs: 4
memory: 15 GiB
gpu: NVIDIA GeForce GTX 1050 Mobile
gpu_vram: NOT_YET_VERIFIED
```

Network:

```text
current IPv4: 192.168.100.93
interface: wlp3s0
ssh_port: 22
```

The LAN IP must not be assumed static until DHCP reservation or static addressing is configured.

---

## Storage

NVMe:

```text
device: /dev/nvme0n1
root: /dev/nvme0n1p1
efi: /dev/nvme0n1p2
intended use: Ubuntu, Docker, app runtime, active PostgreSQL data
```

HDD:

```text
device: /dev/sda
planned mountpoint: /data
planned use: RAG documents, local models, backups, archived logs, datasets
```

Critical rule:

```text
Do not format or repartition /dev/sda until inspected read-only and explicitly approved.
```

---

## Server Mode

Verified:
- `sleep.target` masked.
- `suspend.target` masked.
- `hibernate.target` masked.
- `hybrid-sleep.target` masked.
- Lid-closed SSH test passed at low load.

Thermal rule:
- Benchmark temperatures before sustained GPU/LLM workloads.
- If lid closure harms cooling, operate with lid open and display off.

---

## SSH

SSH access from `dev01` is documented in:

```text
docs/infrastructure/runbooks/agent01-ssh.md
```

Current access:

```bash
ssh agent01
```

---

## Safe Inspection

Non-destructive baseline command:

```bash
ssh agent01 'hostname; whoami; pwd; uptime; free -h; df -h; ip -br addr'
```

---

## Pending Infrastructure Tasks

1. Confirm DHCP reservation/static address strategy.
2. Inspect NVIDIA driver state and VRAM with `nvidia-smi`.
3. Inspect `/dev/sda` read-only before mounting or formatting.
4. Prepare `/data` only after explicit approval.
5. Install Docker only through documented, idempotent provisioning.
6. Deploy minimal Agent Gateway `/health`.
7. Add PostgreSQL + pgvector only after persistence/backup plan.
