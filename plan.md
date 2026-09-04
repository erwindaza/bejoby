# BeJoby — Plan Técnico: Application & Publication History

**Versión:** 0.1
**Dependencia:** spec.md (aprobada)
**Fecha:** 2026-09-04

---

## 🏗️ Decisiones Arquitectónicas

### 0. CI/CD y Quality Gate
- Pipeline existente (`.github/workflows/`): `ci.yml` (lint+tsc+build+tests) corre en push a `dev/qa/main` y PR a `qa/main`; `qa-checks.yml` agrega QA Agent automatizado antes de `qa`; `production-health.yml` valida post-deploy en `main`.
- **Nuevo:** job `sonarqube` agregado a `ci.yml` — corre en los mismos triggers (dev push, PR a qa, PR a main), gateado por `vars.SONAR_ENABLED` hasta tener credenciales.
- `sonar-project.properties` en la raíz define `sonar.sources=src`, exclusiones de `node_modules`/`.next`, y reporte de cobertura vía `@vitest/coverage-v8` (agregado como devDependency).
- Vercel despliega automáticamente: push a `dev` → `bejoby.vercel.app`; merge a `main` → `www.bejoby.com`. No hay despliegue automático a `qa` (es un ambiente de staging pre-main, gateado por PR + QA Agent + Sonar).

### 1. Stack Confirmado
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Backend**: Next.js API Routes (serverless)
- **BD**: Firestore (NoSQL, tiempo real)
- **Storage**: Google Cloud Storage (CVs, documentos)
- **Auth**: Email/contraseña (existente) + Firestore custom claims
- **i18n**: next-intl (existente)
- **UI**: Tailwind + Lucide icons + Framer Motion (animaciones)
- **Pagos (future)**: VTEX API → Firestore transacciones

### 2. Datos: Schema Firestore Nuevo

#### Collection: `applications`
```
applications/{applicationId}
  ├── candidateId (string) — ref a candidate
  ├── jobPostingId (string) — ref a job_postings
  ├── employerId (string) — ref a employer (desnormalizado para queries)
  ├── status (enum) — enviada | revisada | entrevista | rechazo | oferta | aceptada | expirada
  ├── cvVersion (object) — snapshot del CV al momento de postular
  │   ├── text (string) — CV parseado en texto
  │   ├── data (object) — campos estructurados (nombre, email, skills, etc.)
  │   └── uploadedAt (timestamp)
  ├── submittedAt (timestamp)
  ├── lastUpdatedAt (timestamp)
  ├── statusHistory (array of objects) — timeline
  │   └── {status, timestamp, note}
  ├── interactionHistory (array of refs) — emails/chats enviados
  └── feedback (string, optional) — nota privada del empleador
```

#### Collection: `job_postings` (actualizar)
Agregar campos:
```
  ├── status (enum) — activa | cerrada | archivada
  ├── applicationCount (int) — desnormalizado para perf
  ├── publishedAt (timestamp)
  ├── closedAt (timestamp, optional)
```

#### Collection: `transactions`
```
transactions/{transactionId}
  ├── employerId (string) — ref a employer
  ├── type (enum) — publish_job | featured_upgrade | homepage | profile_upgrade | featured_renewal
  ├── relatedEntityId (string, optional) — ref a job_posting
  ├── amount (number) — en currency (USD, CLP, etc.)
  ├── currency (string)
  ├── status (enum) — pending | completed | failed | refunded
  ├── createdAt (timestamp)
  ├── completedAt (timestamp, optional)
  ├── paymentMethod (string) — credit_card | paypal | vtex_checkout
  ├── vtexOrderId (string, optional) — si viene de VTEX
  └── description (string)
```

#### Collection: `interactions` (new)
```
interactions/{interactionId}
  ├── applicationId (string) — ref a application
  ├── fromUserId (string) — candidato o employer
  ├── type (enum) — email | internal_note | status_change
  ├── subject (string, optional)
  ├── body (string)
  ├── createdAt (timestamp)
  └── isPublic (boolean) — candidato puede ver o no
```

---

## 🔐 Seguridad & Privacidad

| Requisito | Implementación |
|-----------|-----------------|
| **Candidato solo ve sus postulaciones** | Firestore rule: `candidateId == auth.uid` |
| **Empleador solo ve sus transacciones** | Firestore rule: `employerId == auth.uid || isAdmin` |
| **Email del empleador no expuesto** | No devolver email en listados públicos |
| **CV en snapshot** | Guardar versión al momento de postular en `cvVersion` |
| **Auditoría de transacciones** | Tabla `transactions` es inmutable (append-only) |
| **Cloud Storage: presigned URLs** | URLs expirat después de 1 hora |
| **Cumplimiento RGPD** | Capacidad de exportar / eliminar datos en futuro |

---

## 📡 API Routes Nuevas

### Candidato
```
GET /api/applications
  Query params: status, startDate, endDate, limit, offset
  Response: {applications: Application[], total: int}
  Auth: requireAuth (candidateId en token)

GET /api/applications/{applicationId}
  Response: {application: Application, interactions: Interaction[]}
  Auth: requireAuth (candidateId == app.candidateId)

POST /api/applications/{applicationId}/contact
  Body: {message: string}
  Response: {success: bool, interactionId: string}
  Auth: requireAuth (candidateId == app.candidateId)
```

### Empleador
```
GET /api/employer/job-postings
  Query params: status, startDate, endDate, limit, offset
  Response: {postings: JobPosting[], total: int}
  Auth: requireAuth (employerId en token)

GET /api/employer/job-postings/{jobPostingId}/applications
  Query params: status, limit, offset
  Response: {applications: Application[], total: int}
  Auth: requireAuth

GET /api/employer/transactions
  Query params: type, status, startDate, endDate, limit, offset
  Response: {transactions: Transaction[], total: int}
  Auth: requireAuth

GET /api/employer/applications/{applicationId}
  Response: {application: Application, candidateProfile: Candidate, interactions: Interaction[]}
  Auth: requireAuth

POST /api/employer/applications/{applicationId}/feedback
  Body: {feedback: string, status?: string}
  Response: {success: bool}
  Auth: requireAuth

POST /api/employer/applications/{applicationId}/make-offer
  Body: {offerDetails: object}
  Response: {success: bool, transactionId?: string}
  Auth: requireAuth

GET /api/employer/export
  Query params: type (applications|transactions), format (csv|json), jobPostingId?
  Response: File download
  Auth: requireAuth
```

---

## 🎨 Componentes React Nuevos

```
src/components/
├── CandidateDashboard/
│   ├── ApplicationsHistory.tsx — tabla + filtros
│   ├── ApplicationDetailModal.tsx — modal con timeline
│   └── ApplicationStatusBadge.tsx — visual por estado
├── EmployerDashboard/
│   ├── JobPostingsSection.tsx — tabla de publicaciones
│   ├── ApplicationsSection.tsx — tabla de postulaciones
│   ├── TransactionsSection.tsx — tabla de transacciones
│   ├── JobPostingDetailModal.tsx — detalles + postulantes
│   ├── CandidateProfileModal.tsx — perfil + interacciones
│   ├── InteractionTimeline.tsx — timeline de emails/notas
│   └── ExportButton.tsx — descarga CSV
└── Common/
    ├── FilterBar.tsx — filtros reutilizables
    ├── PaginationControls.tsx
    └── StatusTimeline.tsx
```

---

## 🔄 Flujo de Datos

### Postulación (existente, sin cambios)
```
Candidato ──POST /api/submit-application──> API
    ↓
    └──> Firestore: applications/{appId}
    └──> Cloud Storage: cv.pdf
    └──> Email: notificación empleador
```

### Ver Historial (new)
```
Candidato ──GET /api/applications──> API (Firestore query)
    ↓
    ├─> Filter by candidateId
    ├─> Load interactions (lazy)
    └─> Render ApplicationsHistory.tsx
```

### Empleador: Hacer Oferta (new)
```
Empleador ──POST /api/employer/applications/{appId}/make-offer──> API
    ↓
    ├─> Create transaction (pending)
    ├─> Trigger VTEX checkout (async)
    ├─> Update application status → oferta
    ├─> Log interaction
    └─> Email: notificación candidato + enlace oferta
```

---

## 📊 Índices Firestore (Performance)

| Collection | Índice | Razón |
|-----------|--------|-------|
| `applications` | `candidateId + submittedAt DESC` | Queries de candidato |
| `applications` | `employerId + status + lastUpdatedAt DESC` | Dashboard empleador |
| `job_postings` | `employerId + status + publishedAt DESC` | Publicaciones por empleador |
| `transactions` | `employerId + createdAt DESC` | Transacciones históricas |
| `interactions` | `applicationId + createdAt ASC` | Timeline |

---

## 🧪 Testing Strategy

| Level | Scope | Herramienta |
|-------|-------|------------|
| **Unit** | Helpers (format date, status badge color) | Vitest |
| **Integration** | API routes + Firestore queries | Vitest + Firestore emulator |
| **E2E** | Candidato ve historial, empleador hace oferta | Manual o Playwright (future) |

---

## 🚀 Orquestación: VTEX (Future Phase 2)

### Integración de Pagos
1. Empleador hace oferta → sistema crea `transaction {status: pending}`
2. API calla a VTEX Checkout API → obtiene `checkoutUrl`
3. Empleador redirigido a checkout VTEX
4. Webhook VTEX → `POST /api/webhooks/vtex-payment` 
5. API valida signature, actualiza `transaction {status: completed}` + `application {status: oferta}`

### Endpoints VTEX
- `POST https://VTEX-ACCOUNT.myvtex.com/api/checkout/pub/checkout` — crear orden
- Webhook: `POST /api/webhooks/vtex-payment` — confirmar pago

(Detalles de credenciales y sandbox VTEX pending)

---

## 📋 Tareas Desglosadas

Ver **tasks.md** para lista completa con dependencias.

---

## ✅ Validación del Plan

- [ ] Stakeholder aprueba schema Firestore
- [ ] Decide scope VTEX (MVP sin pagos, o con pagos desde día 1)
- [ ] Data privada: definir explícitamente qué campos no se devuelven en endpoints públicos
- [ ] Confirmado: índices de Firestore creados (no hacerlo durante feature, bloqueante)

**Próximo paso:** Aprobación → Redactar tasks.md con tareas concretas.
