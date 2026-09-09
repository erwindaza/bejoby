# BeJoby — Plan Técnico: Privacy & Consent Module

**Versión:** 0.1
**Dependencia:** privacy-consent-spec.md (pendiente de aprobación)
**Fecha:** 2026-09-06

---

## 🏗️ Decisión Arquitectónica Clave: Adaptación Postgres → Firestore

La especificación fuente (JSON) fue escrita en convención **relacional/Postgres** (`uuid`, `jsonb`, tablas). El stack real de BeJoby es **Firestore** (NoSQL, documentos). Se adapta así:

| Concepto Postgres (spec fuente) | Equivalente Firestore (este plan) |
|----------------------------------|-------------------------------------|
| `uuid` (PK) | Document ID autogenerado (`collection().doc().id`) |
| `jsonb` | Campo `object`/`map` nativo del documento |
| Tabla | Colección |
| Foreign key | Campo `*_id` (string) referenciando otro doc, sin FK real (validar en app layer) |
| `timestamp` | `Firestore.Timestamp` / `FieldValue.serverTimestamp()` |
| Append-only history | Un doc por evento en una colección (nunca `update`, siempre `add`) — igual patrón que `interactions` (feature de Application History) |

**Reutilización de patrones existentes:** este módulo reutiliza exactamente el patrón ya establecido en `src/lib/gcp/collections.ts`, `src/lib/security/pii.ts` (cifrado de campos vía `FIELD_ENCRYPTION_KEY`/`FIELD_HASH_KEY`, ya configurados en Vercel) y `src/lib/utils/api-response.ts`.

---

## 📦 Colecciones Firestore Nuevas

### `consent_records` (append-only — nunca se actualiza, solo se crean nuevos docs)
```
consent_records/{id}
  ├── candidate_id: string
  ├── consent_type: "profile_processing" | "job_application_sharing" | "ai_processing" | "marketing_optional" | "other"
  ├── purpose_code: string
  ├── purpose_text: string
  ├── legal_basis: "consent" | "contract" | "legal_obligation" | "legitimate_interest" | "other"
  ├── privacy_policy_version: string
  ├── consent_text_version: string
  ├── consent_text_snapshot: string        # texto EXACTO mostrado al candidato al aceptar
  ├── accepted: boolean
  ├── accepted_at: Timestamp | null
  ├── withdrawn_at: Timestamp | null
  ├── withdrawal_reason: string | null
  ├── source: "web" | "mobile" | "api" | "admin"
  ├── ip_hash: string | null               # nunca IP en texto plano — hash con FIELD_HASH_KEY
  ├── user_agent: string | null
  ├── created_at: Timestamp
  └── updated_at: Timestamp                # solo se usa para marcar withdrawn_at, nunca para mutar el consentimiento original
```
**Regla crítica:** un retiro de consentimiento se modela como **actualizar `withdrawn_at`** en el MISMO doc (no crear uno nuevo) para preservar el vínculo 1:1 con el evento original, pero el snapshot de texto aceptado (`consent_text_snapshot`) **nunca se modifica**.

### `candidate_data_sharing_events` (append-only)
```
candidate_data_sharing_events/{id}
  ├── candidate_id: string
  ├── application_id: string
  ├── job_id: string
  ├── company_id: string                   # = employer_id (naming existente en el proyecto)
  ├── consent_record_id: string
  ├── data_categories_shared: object        # ej: { name: true, email: true, cv: true, phone: false }
  ├── cv_version_id: string
  ├── shared_at: Timestamp
  ├── sharing_method: "platform_view" | "email" | "api" | "export" | "recruiter_portal"
  └── created_at: Timestamp
```

### `cv_versions`
```
cv_versions/{id}
  ├── candidate_id: string
  ├── storage_object_key: string           # path en Cloud Storage
  ├── original_filename: string
  ├── mime_type: string
  ├── file_size: number
  ├── checksum: string                     # sha256 del archivo
  ├── uploaded_at: Timestamp
  ├── active: boolean
  ├── deleted_at: Timestamp | null
  ├── consent_record_id: string            # FK al consentimiento vigente al momento de subir
  ├── ai_processed: boolean
  ├── ai_processed_at: Timestamp | null
  └── parser_version: string | null
```

### `ai_processing_events` (append-only)
```
ai_processing_events/{id}
  ├── candidate_id: string
  ├── cv_version_id: string | null
  ├── application_id: string | null
  ├── processing_type: "cv_parsing" | "extraction" | "embeddings" | "matching" | "scoring" | "ranking" | "summarization" | "recommendation"
  ├── model_provider: string               # ej: "google"
  ├── model_name: string                   # ej: "gemini-2.5-flash"
  ├── model_version: string | null
  ├── purpose: string
  ├── input_data_categories: object
  ├── output_type: string
  ├── decision_impact: "none" | "advisory" | "significant"
  ├── human_review_required: boolean
  └── created_at: Timestamp
```
**Nota:** el proyecto YA tiene `ai_cost_logs` dentro de `applications` (ver `src/lib/schema/firestore-schema.ts`). `ai_processing_events` es complementario: `ai_cost_logs` trackea costo, esta colección trackea **gobernanza/transparencia** (propósito, impacto en decisión, si requiere revisión humana). No se fusionan para no mezclar responsabilidades.

### `privacy_requests`
```
privacy_requests/{id}
  ├── candidate_id: string
  ├── request_type: "access" | "rectification" | "deletion" | "opposition" | "blocking" | "portability" | "consent_withdrawal" | "automated_decision_review"
  ├── status: "received" | "identity_verification" | "processing" | "completed" | "rejected"
  ├── request_payload: object
  ├── response_payload: object | null
  ├── created_at: Timestamp
  ├── resolved_at: Timestamp | null
  └── assigned_to: string | null
```
**Nota:** el proyecto ya tiene un endpoint `src/app/api/privacy/requests/route.ts` y `src/lib/validators/privacy-request.ts` (mergeados desde la rama tech-debt previa) — **revisar y extender**, no reescribir desde cero.

### `privacy_policy_versions` (nueva — falta en el JSON fuente, necesaria para versionado real)
```
privacy_policy_versions/{version}          # doc ID = número de versión, ej "1.0.0"
  ├── version: string
  ├── effective_date: Timestamp
  ├── content_markdown: string             # o content_html
  ├── is_current: boolean                  # solo una versión con true a la vez
  └── created_at: Timestamp
```

---

## 🔐 Seguridad (Firestore Rules)

Extender `firestore.rules` (ya existe en el repo, patrón de aislamiento por `candidate_id == auth.uid`):

| Colección | Regla |
|-----------|-------|
| `consent_records` | Candidato lee solo los suyos. Creación vía backend únicamente (no writes directos desde cliente) |
| `candidate_data_sharing_events` | Candidato lee solo los suyos. Empleador NO tiene acceso de lectura directa (solo vía API que enmascara) |
| `cv_versions` | Candidato lee/gestiona solo los suyos. Nunca URLs públicas — servir vía endpoint con signed URL de Cloud Storage (expiración corta, ya es el patrón en `plan.md` de Application History) |
| `ai_processing_events` | Candidato lee solo los suyos (transparencia). Backend-only para creación |
| `privacy_requests` | Candidato lee/crea solo los suyos. Solo backend puede actualizar `status`/`response_payload` |
| `privacy_policy_versions` | Lectura pública (política es pública por ley). Escritura solo admin |

---

## 📡 API Routes

| Método | Ruta | Descripción | Reutiliza |
|--------|------|-------------|-----------|
| GET | `/api/privacy/current-policy` | Retorna versión vigente de la política | Nueva |
| POST | `/api/privacy/consents` | Registra un consentimiento (perfil, postulación, IA, marketing) | Nueva |
| GET | `/api/privacy/consents` | Historial de consentimientos del candidato autenticado | Nueva |
| POST | `/api/privacy/consents/{id}/withdraw` | Retira un consentimiento (marca `withdrawn_at`) | Nueva |
| GET | `/api/privacy/data-sharing` | Lista empleadores/postulaciones con los que se compartieron datos | Nueva |
| POST | `/api/privacy/requests` | Crea solicitud ARCO+ | **Extender** `src/app/api/privacy/requests/route.ts` existente |
| GET | `/api/privacy/requests` | Lista solicitudes del candidato | **Extender** existente |
| GET | `/api/privacy/export` | Genera copia portable de datos del candidato (JSON/ZIP) | Nueva |
| DELETE | `/api/privacy/profile` | Inicia proceso de eliminación (sujeto a retención legal) | Nueva |
| POST | `/api/privacy/automated-decision-review` | Solicita explicación/revisión humana de decisión de IA | Nueva |

**Todas** las rutas usan `getSessionUser()` (patrón existente en `src/lib/auth.ts`) y responden con los helpers `success`/`error`/`serverError` de `src/lib/utils/api-response.ts`.

---

## 🎨 Componentes Frontend

```
src/components/Privacy/
  ├── PrivacyConsentModal.tsx          # Bloqueante, antes de activar CV/perfil
  ├── ApplicationDataSharingModal.tsx  # Bloqueante, específico por postulación (empresa + oferta)
  ├── AIProcessingNotice.tsx           # Informativo, se muestra donde se invoque IA
  └── ConsentCheckbox.tsx              # Ya existe (src/components/ConsentCheckbox.tsx) — REUTILIZAR, no duplicar

src/app/[locale]/candidate/privacy/page.tsx   # Dashboard "Privacidad y datos"
  Secciones (tabs, mismo patrón que employer/dashboard):
  ├── Mis datos
  ├── Mis consentimientos
  ├── Empresas con las que compartí mi CV
  ├── Uso de IA
  ├── Descargar mis datos
  ├── Eliminar mis datos
  └── Solicitudes de privacidad

src/app/[locale]/privacy/page.tsx              # Ya existe (src/app/[locale]/legal/privacy/page.tsx)
  → Verificar si ya soporta versionado; si no, extender para leer de `privacy_policy_versions`
```

**Ponytail check:** `ConsentCheckbox.tsx` y una ruta `legal/privacy` **ya existen** en el codebase — antes de construir nuevos, se debe auditar qué cubren hoy y extender en vez de duplicar (Sprint 0 de tasks.md).

---

## 🚫 Reglas de Negocio (Backend, no negociables)

1. **Consentimiento:**
   - Debe ser explícito cuando es la base legal
   - Debe registrarse ANTES de que el tratamiento inicie
   - Nunca inferir por inactividad
   - Checkbox nunca premarcado (validar en frontend Y backend — rechazar si `accepted !== true` explícito)
   - Retiro tan fácil como otorgar (mismo lugar, un click)
   - Retiro no invalida tratamiento previo lícito

2. **Minimización de datos:**
   - Solo almacenar lo necesario para reclutamiento
   - No exponer CV completo a empleador antes de que el candidato postule (salvo otra base legal)

3. **Limitación de finalidad:**
   - Datos de reclutamiento no se reusan automáticamente para marketing
   - Datos de reclutamiento no se reusan automáticamente para entrenar modelos de IA
   - Nueva finalidad incompatible = nuevo análisis legal + posible nuevo consentimiento

4. **Retención:**
   - Política de retención configurable para candidatos inactivos y postulaciones no exitosas (pendiente definir default — ver pregunta de clarificación #2 en spec)
   - Soporte de eliminación o anonimización al expirar el plazo

---

## 🤖 Gobernanza de IA

- CVs/datos personales **no se usan para entrenar modelos de terceros** salvo autorización expresa y justificación legal
- Requisitos de proveedor: términos de negocio aptos para datos confidenciales, sin entrenamiento con prompts/datos cuando sea posible, DPA cuando aplique, retención documentada, región de procesamiento documentada, subprocesadores documentados, revisión de seguridad antes de habilitar
- **Prohibido:** enviar CVs a interfaces de IA de consumo/gratuitas, usar CVs como dataset público de evaluación, crear scores ocultos sin transparencia, rechazo automático solo por score opaco sin salvaguardas
- Decisiones automatizadas: el candidato puede saber que hay automatización, obtener explicación significativa de la lógica, entender consecuencias esperadas, solicitar explicación, solicitar intervención humana, expresar su punto de vista, solicitar revisión

---

## 🔒 Seguridad (Storage, Logging, Secrets)

| Aspecto | Regla |
|---------|-------|
| Storage | Privado únicamente, sin URLs públicas, signed URLs de expiración corta, cifrado en tránsito y reposo |
| Autorización | Candidato solo ve sus documentos; reclutador solo ve candidatos autorizados en su proceso; scope por company/tenant; admin logueado |
| Logging | Log de: acceso a CV por reclutador, descarga, exports, creación/retiro de consentimiento, procesamiento IA, eventos de cesión. **Nunca** loguear texto completo de CV o datos sensibles en logs estándar |
| Secrets | Secret store gestionado (ya usan Vercel env vars); nunca exponer API keys de proveedores en frontend |
| Base de datos | Reglas de autorización a nivel de documento (Firestore rules), separación por tenant, mínimo privilegio |

---

## 🧪 Testing Strategy

| Nivel | Alcance |
|-------|---------|
| Unit | Validación de consentimiento (checkbox nunca premarcado, rechazo si falta snapshot de texto), lógica de retención |
| Integration | Endpoints de privacy con Firestore emulator: crear consentimiento → activar CV; postular → crear evento de cesión |
| Security | Verificar que CV nunca es accesible sin signed URL válida; verificar aislamiento candidato/candidato y candidato/empleador |

---

## 📋 Validación del Plan

- [ ] Legal/Compliance de Falabella aprueba el modelo de datos y textos de consentimiento
- [ ] Confirmar plazos de retención por defecto (pregunta #2 de spec)
- [ ] Confirmar si Gemini/Vertex AI tiene DPA vigente (pregunta #4 de spec)
- [ ] Confirmar SLA de resolución de solicitudes ARCO+ (pregunta #10 de spec)

**Próximo paso:** Aprobación → redactar `privacy-consent-tasks.md` con desglose Sprint por Sprint (P0/P1/P2 según spec).
