# BeJoby — Tasks: Application & Publication History

**Versión:** 0.2
**Dependencia:** plan.md (aprobado)
**Estado:** ✅ Aprobado — MVP en construcción (Sprints 1-5 completos)
**Fecha:** 2026-09-04

## ✅ Progreso Real (actualizado)

- ✅ TASK-001 a 010 (Backend completo: schema, tipos, firestore.rules, 8 API routes)
- ✅ TASK-011/013 (Frontend candidato: `/candidate/dashboard` con timeline + contacto)
- ✅ TASK-014/017/018 (Frontend empleador: tab Transacciones agregado al dashboard existente, reutilizando su UI)
- ✅ TASK-019 (Unit tests: 21 tests cubriendo aislamiento candidato/empleador, guards de estado, CSV)
- ⏳ TASK-020/021 (E2E manual — pendiente de probar en `npm run dev`)
- ⏳ TASK-022 (Security review — firestore.rules ya escrito, falta deploy + validación real)
- ⏳ TASK-023 (Firestore indexes — requiere credenciales/consola GCP)
- ✅ TASK-024: push a `dev` completo (commit final `e71117f`). **CI en verde**: install, lint, type-check, build y test coverage — todos exitosos (run 33932639574). Vercel debería auto-desplegar a `bejoby.vercel.app`.
- ⏸️ Promoción a `qa`/`main`: **no ejecutada** — requiere PR + QA Agent + Sonar (cuando esté habilitado) + aprobación explícita, según política "no cambios directos en producción".

**Nota de pipeline:** se agregó gate de SonarQube a `.github/workflows/ci.yml` (dev/qa/main), detrás de `vars.SONAR_ENABLED` hasta configurar `SONAR_TOKEN`/`SONAR_HOST_URL`.

**Incidente de lockfile (resuelto):** el `package-lock.json` generado localmente en macOS (ARM) no incluía las resoluciones de dependencias opcionales específicas de la plataforma Linux x64 (`@parcel/watcher-linux-x64-glibc`, `@swc/helpers@0.5.23` anidado para satisfacer el peerDependency de `@swc/core` que trae `next-intl`), causando fallos repetidos de `npm ci` en CI (Ubuntu). Causa raíz: `npm install` (v11 local) "optimiza" y descarta esas entradas multiplataforma al regenerar el lock. Fix: regenerar el lockfile dentro de un contenedor `docker run --platform linux/amd64 node:20`, y usar `npm ci` (no `npm install`) para instalar localmente después, ya que `npm ci` nunca reescribe el lockfile. Verificado corriendo la cadena completa (`npm ci && lint && tsc && build && vitest --coverage`) dentro del mismo contenedor que usa CI antes de cada push.

**Nota de implementación:** No se construyeron los componentes modales separados descritos originalmente en plan.md (JobPostingDetailModal, CandidateProfileModal, etc.) — se reutilizó el patrón de expansión inline ya existente en el dashboard de empleador (ponytail: rung 2, ya está en el codebase). Los tipos `Transaction`/`Interaction` se mantuvieron; los helpers especulativos `lib/applications.ts`/`lib/transactions.ts` que inventaban un schema distinto al real fueron eliminados.

---

## 📋 Legend

- **P**: Prioridad (P0=bloqueante, P1=MVP, P2=nice-to-have)
- **Est**: Estimación (S=pequeño 1-2h, M=medio 3-5h, L=grande 5-8h, XL=muy grande >8h)
- **DependsOn**: Tarea(s) que debe completarse primero
- **Owner**: Rol (BE=Backend, FE=Frontend, DevOps, etc.)

---

## 🎯 Sprint 1: Setup + Data Model

### TASK-001: Firestore Schema Migration
**P:** P0 | **Est:** L | **Owner:** Backend
**Description:** Crear collections + índices en Firestore
- [ ] Crear schema `applications`
- [ ] Crear schema `job_postings` (actualizar campos)
- [ ] Crear schema `transactions`
- [ ] Crear schema `interactions`
- [ ] Definir Firestore security rules (candidato/empleador isolation)
- [ ] Crear índices composites en Firestore console
- [ ] Escribir migration script (crear en .sql/migrations o seeds/)
- [ ] Validar esquema en Firestore emulator local

**Acceptance Criteria:**
- [ ] 4 collections creadas sin errores
- [ ] Security rules validadas (no cross-contamination)
- [ ] Índices creados (perf queries)
- [ ] Local emulator funciona

**DependsOn:** Ninguno
**Notes:** Bloqueante para todas las tareas de datos

---

### TASK-002: TypeScript Types para nuevas collections
**P:** P0 | **Est:** M | **Owner:** Backend
**Description:** Definir tipos TS para aplicaciones, transacciones, interacciones
- [ ] Crear `src/types/application.ts` (actualizar si existe)
- [ ] Crear `src/types/transaction.ts`
- [ ] Crear `src/types/interaction.ts`
- [ ] Crear enums para estados (StatusType, TransactionType, InteractionType)
- [ ] Validar con Zod si aplica (runtime validation en API)

**Acceptance Criteria:**
- [ ] Todos los tipos compilables en TypeScript
- [ ] Enums sync con spec.md
- [ ] Runtime validation con Zod (POST endpoints)

**DependsOn:** TASK-001
**Notes:** Necesario antes de escribir componentes y API routes

---

## 🔌 Sprint 2: Backend API Routes

### TASK-003: GET /api/applications (Candidato)
**P:** P1 | **Est:** M | **Owner:** Backend
**Description:** API para listar postulaciones del candidato autenticado
- [ ] Route: `src/app/api/applications/route.ts`
- [ ] Query params: `status`, `startDate`, `endDate`, `limit`, `offset`
- [ ] Firestore query: filtrar por candidateId + status (si aplica)
- [ ] Pagination: max 100 por página
- [ ] Return: `{applications: Application[], total: int}`
- [ ] Auth check: candidateId del token == candidateId en query
- [ ] Unit tests (Vitest): query params, pagination, auth

**Acceptance Criteria:**
- [ ] GET /api/applications?status=enviada&limit=10 retorna JSON
- [ ] Solo candidato ve sus propias postulaciones
- [ ] Pagination funciona (offset + limit)
- [ ] Tests pasan

**DependsOn:** TASK-001, TASK-002

---

### TASK-004: GET /api/applications/{applicationId} (Candidato Detail)
**P:** P1 | **Est:** M | **Owner:** Backend
**Description:** API para ver detalle de una postulación + interacciones
- [ ] Route: `src/app/api/applications/[applicationId]/route.ts`
- [ ] Load: application + statusHistory + interactions (lazy)
- [ ] Auth: candidateId == app.candidateId
- [ ] Return: `{application, interactions: [...]}`
- [ ] Unit tests: auth, lazy loading

**Acceptance Criteria:**
- [ ] GET /api/applications/{appId} retorna aplicación + timeline completa
- [ ] Seguridad: candidato X no puede ver app de candidato Y
- [ ] Timeline ordenada cronológicamente

**DependsOn:** TASK-001, TASK-002

---

### TASK-005: GET /api/employer/job-postings (Empleador)
**P:** P1 | **Est:** M | **Owner:** Backend
**Description:** API para listar publicaciones del empleador
- [ ] Route: `src/app/api/employer/job-postings/route.ts`
- [ ] Query params: `status`, `startDate`, `endDate`, `limit`, `offset`
- [ ] Firestore query: filtrar por employerId + status
- [ ] Desnormalizar: incluir `applicationCount` por publicación
- [ ] Return: `{postings: JobPosting[], total: int}`
- [ ] Auth check: employerId del token

**Acceptance Criteria:**
- [ ] GET /api/employer/job-postings retorna publicaciones del empleador
- [ ] Incluye conteo de postulantes
- [ ] Solo empleador ve sus publicaciones

**DependsOn:** TASK-001, TASK-002

---

### TASK-006: GET /api/employer/job-postings/{jobPostingId}/applications
**P:** P1 | **Est:** M | **Owner:** Backend
**Description:** API para ver postulaciones a una publicación específica
- [ ] Route: `src/app/api/employer/job-postings/[jobPostingId]/applications/route.ts`
- [ ] Firestore query: jobPostingId + status (filtrable)
- [ ] Incluir candidato info (nombre, email, cv preview)
- [ ] Return: `{applications: Application[], total: int}`

**Acceptance Criteria:**
- [ ] Empleador ve todas las postulaciones a su publicación
- [ ] Filtrable por estado
- [ ] Incluye info básica del candidato

**DependsOn:** TASK-001, TASK-002

---

### TASK-007: GET /api/employer/transactions
**P:** P1 | **Est:** M | **Owner:** Backend
**Description:** API para historial de transacciones del empleador
- [ ] Route: `src/app/api/employer/transactions/route.ts`
- [ ] Query params: `type`, `status`, `startDate`, `endDate`, `limit`, `offset`
- [ ] Firestore query: filtrar por employerId + type/status
- [ ] Return: `{transactions: Transaction[], total: int, balance: number}`

**Acceptance Criteria:**
- [ ] Empleador ve todas sus transacciones
- [ ] Filtrable por tipo y estado
- [ ] Calcula balance total (pending + completed)

**DependsOn:** TASK-001, TASK-002

---

### TASK-008: POST /api/applications/{applicationId}/contact
**P:** P1 | **Est:** M | **Owner:** Backend
**Description:** API para candidato contactar empleador (enviar mensaje)
- [ ] Route: `src/app/api/applications/[applicationId]/contact/route.ts`
- [ ] Body: `{message: string}`
- [ ] Auth: candidateId == app.candidateId
- [ ] Create interaction (type: email, isPublic: true)
- [ ] Send email to employer
- [ ] Return: `{success: bool, interactionId: string}`

**Acceptance Criteria:**
- [ ] POST envía mensaje y crea interaction
- [ ] Email enviado a empleador
- [ ] Candidato solo puede contactar si postulación está activa

**DependsOn:** TASK-001, TASK-002, lib/email.ts (ya existe)

---

### TASK-009: POST /api/employer/applications/{applicationId}/feedback
**P:** P2 | **Est:** M | **Owner:** Backend
**Description:** API para empleador agregar feedback privado a candidato
- [ ] Route: `src/app/api/employer/applications/[applicationId]/feedback/route.ts`
- [ ] Body: `{feedback: string, status?: string}`
- [ ] Auth: employerId == app.employerId
- [ ] Update: application.feedback + create interaction (isPublic: false)
- [ ] If status provided: update application.status + statusHistory

**Acceptance Criteria:**
- [ ] Feedback se guarda privado (candidato no lo ve)
- [ ] Status history se actualiza si hay cambio de estado
- [ ] Empleador solo puede comentar en sus aplicaciones

**DependsOn:** TASK-001, TASK-002

---

### TASK-010: GET /api/employer/export
**P:** P2 | **Est:** L | **Owner:** Backend
**Description:** API para exportar postulaciones/transacciones a CSV
- [ ] Route: `src/app/api/employer/export/route.ts`
- [ ] Query params: `type` (applications|transactions), `format` (csv|json), `jobPostingId?`
- [ ] Generate CSV headers based on type
- [ ] Stream response as file download
- [ ] Auth: employerId

**Acceptance Criteria:**
- [ ] GET /api/employer/export?type=applications&format=csv genera CSV válido
- [ ] Incluye todos los campos relevantes
- [ ] Descargable directamente

**DependsOn:** TASK-005, TASK-006, TASK-007

---

## 🎨 Sprint 3: Frontend Candidato

### TASK-011: ApplicationsHistory Component (Candidato)
**P:** P1 | **Est:** L | **Owner:** Frontend
**Description:** Tabla filtrable de postulaciones del candidato
- [ ] Component: `src/components/CandidateDashboard/ApplicationsHistory.tsx`
- [ ] Fetch: GET /api/applications
- [ ] Display: tabla con columnas (Puesto, Empresa, Estado, Fecha, Acción)
- [ ] Estado visual: color + ícono por status
- [ ] Filtros: por estado, rango de fechas
- [ ] Pagination: botón "Cargar más" o numerado
- [ ] Click → abre ApplicationDetailModal
- [ ] Mobile responsive

**Acceptance Criteria:**
- [ ] Tabla renderiza con datos reales
- [ ] Filtros funcionales
- [ ] Click en fila abre modal
- [ ] Mobile: responsive (stack en mobile)
- [ ] Loading states

**DependsOn:** TASK-003, TASK-004

---

### TASK-012: ApplicationDetailModal Component
**P:** P1 | **Est:** L | **Owner:** Frontend
**Description:** Modal con detalles de postulación + timeline
- [ ] Component: `src/components/CandidateDashboard/ApplicationDetailModal.tsx`
- [ ] Fetch: GET /api/applications/{applicationId}
- [ ] Display: puesto, empresa, timeline (enviada → revisada → entrevista → decisión)
- [ ] Timeline: cada evento con fecha, estado, nota (si aplica)
- [ ] Botones: "Contactar Empresa", "Descargar CV" (si existe), cerrar
- [ ] POST /api/applications/{applicationId}/contact cuando envía mensaje
- [ ] Modal dismiss

**Acceptance Criteria:**
- [ ] Modal abre con datos
- [ ] Timeline renderiza correctamente
- [ ] "Contactar Empresa" funciona
- [ ] Mensaje se envía sin recargar
- [ ] Closed correctamente

**DependsOn:** TASK-003, TASK-004

---

### TASK-013: Integración ApplicationsHistory en Candidato Dashboard
**P:** P1 | **Est:** M | **Owner:** Frontend
**Description:** Agregar sección "Mis Postulaciones" al dashboard candidato
- [ ] Route: `src/app/[locale]/candidate/dashboard/page.tsx` (actualizar si existe)
- [ ] Importar ApplicationsHistory + ApplicationDetailModal
- [ ] Layout: sidebar + main content area
- [ ] Sección: "Mis Postulaciones" tabs (o sidebar nav)
- [ ] Error handling + loading states
- [ ] i18n: textos en es/en (next-intl)

**Acceptance Criteria:**
- [ ] Candidato ve su sección de postulaciones
- [ ] Layout es consistente con el resto del sitio
- [ ] Textos traducidos
- [ ] Funciona en mobile

**DependsOn:** TASK-011, TASK-012

---

## 🎨 Sprint 4: Frontend Empleador

### TASK-014: JobPostingsSection Component
**P:** P1 | **Est:** L | **Owner:** Frontend
**Description:** Tabla de publicaciones del empleador
- [ ] Component: `src/components/EmployerDashboard/JobPostingsSection.tsx`
- [ ] Fetch: GET /api/employer/job-postings
- [ ] Display: tabla con (Puesto, Empresa, Estado, Postulantes, Acciones)
- [ ] Filtros: por estado, fecha
- [ ] Click → abre JobPostingDetailModal (postulantes)
- [ ] Botón: "Archivar", "Editar", "Ver Postulantes"

**Acceptance Criteria:**
- [ ] Tabla renderiza
- [ ] Filtros funcionales
- [ ] Click abre modal con postulantes
- [ ] Botones funcionan

**DependsOn:** TASK-005

---

### TASK-015: JobPostingDetailModal Component
**P:** P1 | **Est:** L | **Owner:** Frontend
**Description:** Modal con detalles de publicación + listado de candidatos
- [ ] Component: `src/components/EmployerDashboard/JobPostingDetailModal.tsx`
- [ ] Fetch: GET /api/employer/job-postings/{jobPostingId}/applications
- [ ] Display: detalles de publicación + tabla de candidatos (nombre, estado, fecha)
- [ ] Click en candidato → abre CandidateProfileModal
- [ ] Botones en candidato: "Ver Perfil", "Hacer Oferta", "Feedback"

**Acceptance Criteria:**
- [ ] Modal abre con postulantes
- [ ] Click en candidato abre perfil
- [ ] Botones disponibles

**DependsOn:** TASK-006

---

### TASK-016: CandidateProfileModal Component
**P:** P1 | **Est:** M | **Owner:** Frontend
**Description:** Perfil del candidato + historial de interacciones
- [ ] Component: `src/components/EmployerDashboard/CandidateProfileModal.tsx`
- [ ] Fetch: GET /api/employer/applications/{applicationId}
- [ ] Display: nombre, email, CV preview, skills, experiencia
- [ ] Timeline: interacciones (emails, cambios de estado)
- [ ] Botones: "Hacer Oferta", "Enviar Feedback", cerrar
- [ ] CV preview: link to Cloud Storage

**Acceptance Criteria:**
- [ ] Perfil carga correctamente
- [ ] Timeline visible
- [ ] Acceso a CV
- [ ] Botones funcionan

**DependsOn:** TASK-004

---

### TASK-017: TransactionsSection Component
**P:** P1 | **Est:** M | **Owner:** Frontend
**Description:** Tabla de transacciones del empleador
- [ ] Component: `src/components/EmployerDashboard/TransactionsSection.tsx`
- [ ] Fetch: GET /api/employer/transactions
- [ ] Display: tabla con (Fecha, Tipo, Monto, Estado, Detalles)
- [ ] Filtros: por tipo, estado, fecha
- [ ] Botón: "Exportar a CSV"

**Acceptance Criteria:**
- [ ] Tabla renderiza
- [ ] Filtros funcionales
- [ ] Exporta CSV
- [ ] Totales calculados

**DependsOn:** TASK-007, TASK-010

---

### TASK-018: Integración EmployerDashboard
**P:** P1 | **Est:** L | **Owner:** Frontend
**Description:** Crear dashboard empleador con 3 secciones
- [ ] Route: `src/app/[locale]/employer/dashboard/page.tsx` (la que estaba abierta!)
- [ ] Layout: 3 tabs → Publicaciones | Postulaciones | Transacciones
- [ ] Importar JobPostingsSection, CandidateProfileModal, TransactionsSection
- [ ] Resumen arriba: publicaciones activas, postulantes nuevos, saldo pendiente
- [ ] i18n: textos traducidos
- [ ] Mobile responsive

**Acceptance Criteria:**
- [ ] Dashboard carga sin errores
- [ ] 3 secciones funcionales
- [ ] Navegación entre tabs
- [ ] Mobile responsive
- [ ] Textos traducidos

**DependsOn:** TASK-014, TASK-015, TASK-017

---

## 🧪 Sprint 5: Testing & QA

### TASK-019: Unit Tests - API Routes
**P:** P1 | **Est:** M | **Owner:** Backend/QA
**Description:** Vitest unit tests para API routes
- [ ] Test GET /api/applications (auth, pagination, filters)
- [ ] Test GET /api/applications/{applicationId} (auth, data)
- [ ] Test GET /api/employer/job-postings (auth)
- [ ] Test GET /api/employer/job-postings/{jobId}/applications
- [ ] Test GET /api/employer/transactions
- [ ] Test POST /api/applications/{appId}/contact (auth, email)
- [ ] Coverage: >80%

**Acceptance Criteria:**
- [ ] Todos los tests pasan
- [ ] Coverage >80%
- [ ] Tests verifican auth, edge cases

**DependsOn:** TASK-003 a TASK-009

---

### TASK-020: E2E Manual Testing - Candidato Flow
**P:** P1 | **Est:** M | **Owner:** QA
**Description:** Test manual flujo completo candidato
**Scenario:**
1. Login candidato
2. Navegar a "Mis Postulaciones"
3. Ver listado de postulaciones (filtrar, paginar)
4. Click en una postulación → modal abre
5. Ver timeline completa
6. Contactar empleador → email enviado
7. Cerrar modal

**Acceptance Criteria:**
- [ ] Todos los pasos funcionan sin errores
- [ ] Timeline correcta
- [ ] Email enviado
- [ ] UI responsive

**DependsOn:** TASK-011, TASK-012, TASK-013

---

### TASK-021: E2E Manual Testing - Empleador Flow
**P:** P1 | **Est:** M | **Owner:** QA
**Description:** Test manual flujo completo empleador
**Scenario:**
1. Login empleador
2. Navegar a "Analytics & Historial"
3. Ver publicaciones activas (filtrar, paginar)
4. Click en publicación → modal con postulantes
5. Click en candidato → perfil + timeline
6. Hacer oferta (o agregar feedback)
7. Ver transacciones (exportar CSV)

**Acceptance Criteria:**
- [ ] Todos los pasos funcionan
- [ ] CSV válido
- [ ] UI responsiva
- [ ] No hay XSS/SQL injection

**DependsOn:** TASK-014, TASK-015, TASK-016, TASK-017, TASK-018

---

### TASK-022: Security Review
**P:** P1 | **Est:** M | **Owner:** Backend/DevOps
**Description:** Revisar security de spec implementado
- [ ] Firestore security rules validadas (candidatos aislados, etc.)
- [ ] SQL injection: N/A (NoSQL), pero validar Zod en POST
- [ ] XSS: sanitize inputs en componentes React
- [ ] CSRF: Next.js maneja automáticamente
- [ ] Auth: candidateId/employerId del token vs requests
- [ ] Cloud Storage: presigned URLs expirat después de 1h
- [ ] Audit log: todas las transacciones guardadas

**Acceptance Criteria:**
- [ ] No vulnerabilidades críticas
- [ ] Aislamiento de datos verificado
- [ ] Inputs validados

**DependsOn:** Todos

---

## 📦 Sprint 6: Deploy & Monitoring

### TASK-023: Firestore Indexes Production Deployment
**P:** P0 | **Est:** S | **Owner:** DevOps
**Description:** Crear índices en Firestore producción
- [ ] Export índices desde dev
- [ ] Aplicar en staging
- [ ] Validar perf (latency de queries)
- [ ] Aplicar en production

**Acceptance Criteria:**
- [ ] Índices creados
- [ ] Query latency <500ms (goal)

**DependsOn:** TASK-001

---

### TASK-024: Deploy a Vercel (Dev/Staging)
**P:** P1 | **Est:** S | **Owner:** DevOps
**Description:** Desplegar a dev y staging
- [ ] Push a rama `dev`
- [ ] Vercel auto-deploy
- [ ] Test en https://bejoby.vercel.app
- [ ] Smoke test: login, ver postulaciones
- [ ] Check Vercel Analytics para perf

**Acceptance Criteria:**
- [ ] Deploy sin errores
- [ ] Smoke test pasa
- [ ] Perf OK

**DependsOn:** TASK-018

---

### TASK-025: Deploy a Producción
**P:** P1 | **Est:** S | **Owner:** DevOps
**Description:** Merge dev → main → production
- [ ] Merge dev to main (con PR review)
- [ ] Vercel auto-deploy a production
- [ ] Smoke test en https://www.bejoby.com
- [ ] Monitor Sentry/Vercel para errores
- [ ] Verificar Firestore metrics

**Acceptance Criteria:**
- [ ] Deploy sin downtime
- [ ] Smoke test pasa
- [ ] No errores críticos en Sentry

**DependsOn:** TASK-024

---

## 🔮 Phase 2 (Future): VTEX Integration

### TASK-026: VTEX Webhook Receiver
**Est:** L | **Owner:** Backend
**Description:** Implementar webhook para confirmar pagos VTEX
- [ ] Route: `src/app/api/webhooks/vtex-payment/route.ts`
- [ ] Verify VTEX signature
- [ ] Update transaction status → completed
- [ ] Update application status → oferta confirmed
- [ ] Send email: candidato + empleador

### TASK-027: VTEX Checkout Integration
**Est:** L | **Owner:** Backend
**Description:** Conectar con VTEX para crear órdenes
- [ ] API call a VTEX: POST /checkout
- [ ] Obtener checkoutUrl
- [ ] Redirect empleador a checkout

---

## 📊 Resumen

| Sprint | Tasks | Est Total | Owner |
|--------|-------|-----------|-------|
| 1: Setup | 001-002 | 1-2 días | Backend |
| 2: API | 003-010 | 3-4 días | Backend |
| 3: FE Candidato | 011-013 | 2-3 días | Frontend |
| 4: FE Empleador | 014-018 | 3-4 días | Frontend |
| 5: Testing | 019-022 | 2 días | Backend + QA |
| 6: Deploy | 023-025 | 1 día | DevOps |
| **Total** | **25** | **~14-18 días** | Cross |

---

## ✅ Definitión de "Listo"

- [ ] Spec aprobada por stakeholder
- [ ] Plan técnico revisado por tech lead
- [ ] Todos los tests en Sprint 5 pasan
- [ ] Security review completado
- [ ] Documentación en Firestore actualizada
- [ ] Deploy en dev y staging validado
- [ ] Deploy en production exitoso
- [ ] Monitoreo (Sentry, Analytics) configurado

---

**Próximo paso:** Stakeholder aprueba spec + plan → empezamos TASK-001.
