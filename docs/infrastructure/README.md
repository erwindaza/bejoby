# BeJoby / AIF369 Infrastructure

Estado operativo inicial de la infraestructura local-first.

## Hosts

| Host | Rol | Estado |
|------|-----|--------|
| `dev01` | MacBook Pro, workstation de desarrollo/control | Activo |
| `agent01` | Lenovo Legion, servidor productivo on-prem | Activo |

## Runbooks

- [agent01 SSH](runbooks/agent01-ssh.md)

## Architecture And Decisions

- [agent01 state](agent01.md)
- [architecture](architecture.md)
- [reconciliation 2026-09-25](reconciliation-2026-09-25.md)
- [ADR-001 Multi-Agent Runtime](adr/ADR-001-multi-agent-runtime-agent01.md)
- [ADR-002 Local Operator Control Plane](adr/ADR-002-local-operator-control-plane.md)

## Reglas Criticas

- No guardar passwords, tokens, service-account JSON ni llaves privadas en Git.
- No formatear ni reparticionar discos sin inspeccion y aprobacion explicita.
- No exponer SSH, PostgreSQL ni Docker daemon directamente a internet.
- No deshabilitar password SSH hasta verificar acceso por llave y ruta de recuperacion.
- Cambios operacionales deben convertirse en scripts/configuracion versionada cuando sea posible.
