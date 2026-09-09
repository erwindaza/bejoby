# BeJoby — Tasks: Privacy & Consent Module

**Versión:** 0.1
**Dependencia:** privacy-consent-plan.md
**Estado:** 🔄 Awaiting Approval
**Fecha:** 2026-09-06

---

## 🔍 Hallazgo de Auditoría Previa (importante — leer antes de planificar)

Al revisar el codebase (fusionado desde una rama de tech-debt previa, ya en producción) se encontró una **base de compliance ya construida y funcional**, no reflejada originalmente en la spec fuente. Esto reduce significativamente el esfuerzo real:

| Ya existe y funciona | Archivo | Cubre |
|---|---|---|
| `audit_events` colección + `logAuditEvent()` | `src/lib/compliance/audit.ts` | Auditoría genérica (login, CV upload, export, consentimiento, IA, admin) |
| `consent_records` colección + `recordConsent()` | `src/lib/compliance/consent.ts` | Registro básico de consentimiento (falta extender schema) |
| `privacy_requests` colección + flujo completo | `src/lib/compliance/privacy-requests.ts`, `src/lib/validators/privacy-request.ts`, `src/app/api/privacy/requests/route.ts` | HU-5 (ARCO+) — GET/POST ya operativos |
| Registries de gobernanza IA/vendors | `src/lib/compliance/registries.ts`, `src/app/api/governance/registry/route.ts` | Requisitos de proveedor de IA (documentación, no runtime enforcement) |
| `ConsentCheckbox.tsx` | `src/components/ConsentCheckbox.tsx` | Checkbox reutilizable, no premarcado, con link a política |
| `legal/privacy` página | `src/app/[locale]/legal/privacy/page.tsx` | Política estática (NO versionada dinámicamente) |

**Regla:** ninguna tarea de este documento debe recrear lo anterior. Todas las tareas son **extender** o **construir lo que falta**.

### Gaps reales (lo que realmente falta)
- `candidate_data_sharing_events` (auditoría de cesión a empleadores) — no existe
- `cv_versions` (versionado de CV con consentimiento vinculado) — no existe (hoy es solo `cv_path` string)
- `ai_processing_events` (gobernanza por evento de IA, distinto de `ai_cost_logs`) — no existe
- `privacy_policy_versions` (versionado real de política) — no existe, la página es estática
- **El flujo de guardado de CV/perfil NO está bloqueado por consentimiento hoy** — `recordConsent()` existe pero nada lo invoca obligatoriamente antes de activar un CV
- Modales de frontend (`PrivacyConsentModal`, `ApplicationDataSharingModal`, `AIProcessingNotice`) — no existen
- Dashboard `/candidate/privacy` — no existe
- Endpoints: `/api/privacy/current-policy`, `/api/privacy/consents*`, `/api/privacy/data-sharing`, `/api/privacy/export`, `DELETE /api/privacy/profile`, `/api/privacy/automated-decision-review` — no existen
- Extensión de schema de `consent_records`: falta `legal_basis`, `consent_text_version`, `consent_text_snapshot`, `accepted_at`/`withdrawn_at` explícitos, `ip_hash`, `user_agent`

---

## 📋 Legend
- **P**: P0 (bloqueante legal) | P1 (requerido, no bloqueante de lanzamiento) | P2 (fase posterior)
- **Est**: S=1-2h, M=3-5h, L=5-8h, XL=>8h

---

## 🎯 Sprint 0: Extensión de Schema (bloqueante para todo lo demás)

### TASK-P00: Extender schema de `consent_records`
**P:** P0 | **Est:** M
- [ ] Agregar campos: `legal_basis`, `consent_text_version`, `consent_text_snapshot`, `accepted`, `accepted_at`, `withdrawn_at`, `withdrawal_reason`, `ip_hash`, `user_agent` a `recordConsent()`
- [ ] Mantener retrocompatibilidad con docs existentes (`consent_status`, `purpose`, `policy_version` ya en uso por otros flujos — no romper)
- [ ] Agregar función `withdrawConsent(consentId, reason)` — actualiza `withdrawn_at`, nunca borra el doc
- **DependsOn:** Ninguna. **Bloquea:** TASK-P01, TASK-P02

### TASK-P01: Colección `privacy_policy_versions`
**P:** P0 | **Est:** M
- [ ] Crear colección + helper `gcp/collections.ts: privacyPolicyVersions()`
- [ ] Migrar contenido actual de `legal/privacy/page.tsx` como versión `"1.0.0"`, `is_current: true`
- [ ] Endpoint `GET /api/privacy/current-policy`
- **DependsOn:** Ninguna

### TASK-P02: Colección `candidate_data_sharing_events`
**P:** P0 | **Est:** M
- [ ] Crear colección + helper en `gcp/collections.ts`
- [ ] Función `logDataSharingEvent()` en `src/lib/compliance/data-sharing.ts` (nuevo archivo, sigue patrón de `audit.ts`)
- **DependsOn:** Ninguna

### TASK-P03: Colección `cv_versions`
**P:** P1 | **Est:** L
- [ ] Crear colección + helper
- [ ] Migrar de `cv_path` string suelto a registro versionado con `checksum`, `consent_record_id`, `active`
- [ ] **Nota:** requiere coordinar con flujo actual de upload de CV (`src/app/api/cv/upload/route.ts`) — revisar antes de modificar
- **DependsOn:** TASK-P00

### TASK-P04: Colección `ai_processing_events`
**P:** P2 | **Est:** M
- [ ] Crear colección + helper `logAIProcessingEvent()`
- [ ] Diferenciar claramente de `ai_cost_logs` (costo) — este es gobernanza/transparencia
- **DependsOn:** Ninguna

---

## 🔌 Sprint 1: Backend — Consentimiento de Perfil/CV (HU-1)

### TASK-P05: POST /api/privacy/consents
**P:** P0 | **Est:** M
- [ ] Valida `accepted === true` explícito (rechaza si falta o es `false`)
- [ ] Captura `consent_text_snapshot` del body (texto exacto mostrado al usuario)
- [ ] Hashea IP con `FIELD_HASH_KEY` (ya configurado en Vercel) antes de guardar — nunca IP en texto plano
- [ ] Llama a `recordConsent()` extendido (TASK-P00)
- **DependsOn:** TASK-P00

### TASK-P06: GET /api/privacy/consents
**P:** P0 | **Est:** S
- [ ] Lista historial de consentimientos del candidato autenticado, ordenado por fecha desc
- **DependsOn:** TASK-P00

### TASK-P07: POST /api/privacy/consents/{id}/withdraw
**P:** P1 | **Est:** S
- [ ] Verifica que el consentimiento pertenece al candidato autenticado
- [ ] Llama `withdrawConsent()`
- **DependsOn:** TASK-P00

### TASK-P08: Gate de bloqueo — CV/perfil no se activa sin consentimiento
**P:** P0 | **Est:** L
- [ ] Modificar `src/app/api/cv/upload/route.ts` (o donde se active el CV) para **rechazar** si no existe un `consent_record` vigente tipo `profile_processing` para ese candidato
- [ ] Este es el criterio de aceptación #1 de la spec — no negociable
- **DependsOn:** TASK-P00, TASK-P05

---

## 🔌 Sprint 2: Backend — Consentimiento de Postulación (HU-2)

### TASK-P09: Integrar consentimiento específico en POST /api/applications
**P:** P0 | **Est:** L
- [ ] Antes de crear la postulación: exigir `consent_record_id` válido tipo `job_application_sharing`, específico a esa oferta/empresa
- [ ] Al crear la postulación exitosamente: crear `candidate_data_sharing_events` (TASK-P02) atómicamente
- [ ] **Riesgo:** este endpoint YA tuvo un incidente P0 reciente (encriptación PII) — probar exhaustivamente en `dev` antes de tocar `qa`/`main`
- **DependsOn:** TASK-P00, TASK-P02

### TASK-P10: GET /api/privacy/data-sharing
**P:** P0 | **Est:** M
- [ ] Lista empleadores + postulación asociada por cada evento de cesión del candidato autenticado
- **DependsOn:** TASK-P02

---

## 🔌 Sprint 3: Backend — Derechos ARCO+ (HU-5) — mayormente ya construido

### TASK-P11: Agregar `consent_withdrawal` al enum de `request_type`
**P:** P1 | **Est:** S
- [ ] Extender `privacyRequestTypeSchema` en `src/lib/validators/privacy-request.ts`
- **DependsOn:** Ninguna

### TASK-P12: GET /api/privacy/export (portabilidad)
**P:** P1 | **Est:** L
- [ ] Recolecta: perfil, consentimientos, cesiones de datos, postulaciones, CVs (metadata) del candidato
- [ ] Retorna JSON descargable
- **DependsOn:** TASK-P00, TASK-P02, TASK-P03

### TASK-P13: DELETE /api/privacy/profile
**P:** P1 | **Est:** L
- [ ] Verifica períodos de retención antes de eliminar (bloquea si hay obligación legal de conservar)
- [ ] Crea `privacy_request` tipo `deletion` con status inicial apropiado (reutiliza `createPrivacyRequest`)
- **DependsOn:** Definición de retención por defecto (pregunta de clarificación #2, pendiente stakeholder)

### TASK-P14: POST /api/privacy/automated-decision-review
**P:** P2 | **Est:** M
- [ ] Reutiliza `createPrivacyRequest` con `request_type: "AUTOMATED_DECISION_REVIEW"` (ya soportado)
- [ ] Vincula con `ai_processing_events` relevantes (TASK-P04)
- **DependsOn:** TASK-P04

---

## 🎨 Sprint 4: Frontend — Modales de Consentimiento

### TASK-P15: PrivacyConsentModal.tsx
**P:** P0 | **Est:** L
- [ ] Reutiliza `ConsentCheckbox.tsx` existente
- [ ] Bloqueante, se muestra antes de activar CV/perfil
- [ ] Link a política vigente (consume TASK-P01)
- [ ] POST a `/api/privacy/consents` al confirmar
- **DependsOn:** TASK-P01, TASK-P05

### TASK-P16: ApplicationDataSharingModal.tsx
**P:** P0 | **Est:** L
- [ ] Texto dinámico con nombre de empresa + oferta
- [ ] Se integra en el flujo de "Postular" (`JobApplyForm.tsx` existente)
- [ ] POST a `/api/privacy/consents` (tipo `job_application_sharing`) antes de crear la postulación
- **DependsOn:** TASK-P05, TASK-P09

### TASK-P17: AIProcessingNotice.tsx
**P:** P1 | **Est:** M
- [ ] Componente informativo (no bloqueante)
- [ ] Se muestra en flujos donde se invoca IA (parsing de CV, matching)
- **DependsOn:** Ninguna

---

## 🎨 Sprint 5: Frontend — Dashboard de Privacidad (HU-4)

### TASK-P18: /candidate/dashboard/privacy — página + tabs
**P:** P0 (básico) | **Est:** XL
- [ ] Reutilizar patrón de tabs ya usado en `employer/dashboard/page.tsx` (agregado en feature de Application History)
- [ ] Tabs: Mis datos | Mis consentimientos | Empresas con las que compartí mi CV | Uso de IA | Descargar mis datos | Eliminar mis datos | Solicitudes de privacidad
- [ ] Cada tab consume su endpoint correspondiente (ya construidos en Sprints 1-3)
- **DependsOn:** TASK-P06, TASK-P10, TASK-P12, TASK-P13, privacy_requests (ya existe)

### TASK-P19: Versionar dinámicamente `/privacy` (política pública)
**P:** P1 | **Est:** M
- [ ] Reemplazar contenido estático de `legal/privacy/page.tsx` por lectura de `privacy_policy_versions` (TASK-P01)
- **DependsOn:** TASK-P01

---

## 🧪 Sprint 6: Testing & Validación

### TASK-P20: Unit tests — validación de consentimiento
**P:** P0 | **Est:** M
- [ ] Rechazo si `accepted !== true` explícito
- [ ] Rechazo si falta `consent_text_snapshot`
- [ ] Retiro no borra el doc original

### TASK-P21: Integration test — CV no se activa sin consentimiento
**P:** P0 | **Est:** M
- [ ] Test end-to-end del gate (TASK-P08) contra Firestore emulator

### TASK-P22: Security review
**P:** P0 | **Est:** M
- [ ] Verificar CV nunca accesible sin signed URL
- [ ] Verificar que `candidate_data_sharing_events` no es legible por empleadores vía API directa
- [ ] Verificar que logs no contienen texto completo de CV ni PII sin enmascarar

---

## 📊 Resumen

| Sprint | Foco | Est. | Nota |
|--------|------|------|------|
| 0 | Extensión de schema (bloqueante) | 2-3 días | |
| 1 | Consentimiento de perfil/CV | 2-3 días | |
| 2 | Consentimiento de postulación | 2 días | ⚠️ mismo endpoint del incidente P0 reciente — probar con extremo cuidado |
| 3 | Derechos ARCO+ | 2-3 días | Backend base ya existe — esfuerzo real es menor al estimado en spec original |
| 4 | Modales frontend | 2-3 días | |
| 5 | Dashboard de privacidad | 3-4 días | |
| 6 | Testing | 2 días | |
| **Total** | | **~15-20 días** | Menor al estimado inicial gracias a la base de compliance ya construida |

---

## ⚠️ Nota de Riesgo Operacional

El incidente P0 reciente (2026-09-05: `POST /api/applications` fallando en todos los entornos por falta de `FIELD_ENCRYPTION_KEY`) ocurrió precisamente en el endpoint que **TASK-P09 va a modificar de nuevo**. Antes de tocarlo:
1. Confirmar que `FIELD_ENCRYPTION_KEY`/`FIELD_HASH_KEY` siguen configuradas en los 4 entornos Vercel (Production, Development, Preview-dev, Preview-qa)
2. Validar el cambio contra Firestore real (no solo mocks) antes de cada promoción, igual que se hizo en el incidente
3. Promover dev → qa → main de a un paso, verificando CI + smoke test en cada etapa

**Próximo paso:** Aprobación del stakeholder → comenzar Sprint 0.
