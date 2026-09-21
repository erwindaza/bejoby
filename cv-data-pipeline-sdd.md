# BeJoby - SDD: CV Raw-Silver-Golden Data Pipeline

**Estado:** Aprobado para implementacion incremental  
**Version:** 0.2
**Fecha:** 2026-09-21
**Metodologia:** Spec Driven Development (SDD)

---

## 1. Objetivo

Cuando un postulante envia su CV, BeJoby debe conservar el archivo original en una zona `raw` de Google Cloud Storage, derivar una vista `silver` con datos parseados y normalizados, y publicar una capa `golden` con entidades confiables de negocio para analitica, IA tradicional e IA generativa.

El archivo original no se modifica. Toda extraccion, scoring o enriquecimiento se escribe como datos derivados y trazables.

---

## 2. Alcance

Incluido:
- Upload obligatorio de CV por postulacion.
- Almacenamiento del binario original en GCS bajo `raw/cvs/{application_id}/{filename}`.
- Cifrado en transito via HTTPS/TLS y cifrado en reposo via Google-managed encryption o CMEK si `GCS_CV_KMS_KEY_NAME` esta configurado.
- Registro en Firestore de la ruta privada `applications.cv_path`.
- Parsing asincrono del CV y generacion de datos `silver`.
- Consolidacion de datos `golden` por candidato, postulacion y match contra vacantes.
- Auditoria minima para reconstruir origen, version, consentimiento y resultado de parsing.

Fuera de alcance inmediato:
- Data warehouse fisico en BigQuery. El diseno lo permite, pero el MVP usa Firestore + GCS.
- Publicacion de URLs permanentes de CVs.
- Edicion manual del CV original.

---

## 3. Definiciones De Datos

### Raw

Zona inmutable del archivo recibido desde el postulante.

GCS:

```text
gs://bejoby-cvs/raw/cvs/{application_id}/{safe_filename}
```

Reglas:
- Objeto privado.
- Sin acceso publico.
- No se sobreescribe si la postulacion ya tiene `cv_path`.
- Validacion de MIME y magic bytes antes de guardar.
- Tamano maximo: 5 MB.
- Se conserva para trazabilidad y reprocesamiento.

### Silver

Zona derivada con datos parseados y normalizados. Silver conserva detalle tecnico y calidad del parsing, pero todavia no es la fuente final de negocio.

Firestore propuesto:

```text
candidate_cv_silver/{cv_version_id}
  candidate_id: string
  application_id: string
  raw_cv_path: string
  raw_cv_sha256: string
  parser_version: string
  parse_status: "pending" | "processing" | "completed" | "failed"
  parsed_at: timestamp | null
  source_filename: string
  source_content_type: string
  extracted_text_ref: string | null
  normalized_profile:
    full_name: string | null
    email_hash: string | null
    phone_hash: string | null
    location: string | null
    linkedin_url: string | null
    seniority: string | null
    english_level: string | null
    expected_monthly_rate: string | null
  skills: array<object>
  experience: array<object>
  education: array<object>
  certifications: array<object>
  quality:
    confidence_score: number
    missing_fields: array<string>
    warnings: array<string>
  governance:
    consent_record_id: string | null
    pii_encrypted: boolean
    human_review_required: boolean
    retention_until: timestamp | null
  created_at: timestamp
  updated_at: timestamp
```

Nota: PII directa debe quedar cifrada o hasheada segun el uso. Los endpoints de empleador deben devolver campos enmascarados salvo descarga autorizada.

### Golden

Zona curada de negocio. Golden consolida candidate, CV parseado, postulaciones, consentimiento, actividad y resultados de matching en tablas/documentos estables para consumo analitico y modelos.

Golden no debe ser una copia del CV. Debe representar entidades de negocio confiables, versionadas y con reglas de elegibilidad.

Firestore operacional propuesto:

```text
candidate_profile_golden/{candidate_id}
  candidate_id: string
  active_cv_version_id: string
  active_application_ids: array<string>
  profile_status: "new" | "qualified" | "incomplete" | "blocked" | "deleted"
  pii_policy: "masked" | "encrypted" | "restricted"
  full_name_encrypted: string | null
  email_hash: string
  phone_hash: string | null
  country: string | null
  city: string | null
  seniority_level: "junior" | "mid" | "senior" | "lead" | "principal" | "executive" | null
  primary_role_family: string | null
  english_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null
  expected_monthly_rate:
    amount: number | null
    currency: string | null
    period: "monthly"
  availability:
    status: "immediate" | "two_weeks" | "one_month" | "custom" | null
    available_from: timestamp | null
  canonical_skills: array<object>
  years_experience_total: number | null
  education_highest_level: string | null
  certifications: array<object>
  consent:
    profile_processing_active: boolean
    job_application_sharing_active: boolean
    ai_processing_active: boolean
    latest_consent_record_ids: array<string>
  quality:
    golden_score: number
    completeness_score: number
    confidence_score: number
    requires_human_review: boolean
    exclusion_reasons: array<string>
  lineage:
    raw_cv_path: string
    silver_cv_version_id: string
    parser_version: string
    ruleset_version: string
    built_at: timestamp
  created_at: timestamp
  updated_at: timestamp
```

```text
candidate_job_match_golden/{candidate_id}_{job_id}
  candidate_id: string
  job_id: string
  employer_id: string
  application_id: string | null
  match_status: "eligible" | "not_eligible" | "needs_review" | "withdrawn"
  score:
    overall: number
    skills: number
    experience: number
    language: number
    rate_fit: number
    availability: number
  explainability:
    strengths: array<string>
    gaps: array<string>
    summary: string
  governance:
    ai_processing_allowed: boolean
    automated_decision: boolean
    human_review_required: boolean
  lineage:
    candidate_profile_version: string
    job_version: string
    model_version: string
    ruleset_version: string
    built_at: timestamp
```

BigQuery/analytics recomendado para escala:

```text
bejoby_analytics.golden_candidate_profile
bejoby_analytics.golden_candidate_job_match
bejoby_analytics.golden_funnel_events
bejoby_analytics.golden_ai_feature_store
bejoby_analytics.golden_genai_context
```

Firestore sigue siendo la fuente operacional para la app. BigQuery debe ser la capa analitica y feature store cuando el volumen o los casos de BI/modelado lo requieran.

---

## 4. Reglas De Negocio Para Golden

### 4.1 Elegibilidad De Candidato

Un candidato puede pasar a `candidate_profile_golden.profile_status = "qualified"` solo si:
- Existe `candidate_cv_silver.parse_status = "completed"`.
- Existe consentimiento activo para `profile_processing`.
- El candidato no tiene solicitud activa de eliminacion, bloqueo u oposicion.
- `quality.confidence_score >= 0.70`.
- Tiene al menos email hasheado, nombre cifrado o identificador de contacto valido.
- No hay conflicto critico entre datos declarados y CV parseado.

Si falta informacion clave, queda `incomplete`. Si hay baja confianza, inconsistencia material o posible dato sensible no esperado, queda `blocked` o `requires_human_review = true`.

### 4.2 Seleccion De CV Activo

Golden usa un unico `active_cv_version_id` por candidato:
- Prioridad 1: CV de la postulacion mas reciente con parsing exitoso.
- Prioridad 2: CV marcado manualmente como activo por el candidato.
- Prioridad 3: CV con mayor `confidence_score` si hay empate temporal.

El CV raw nunca se usa directamente para analitica o matching, salvo reprocesamiento controlado.

### 4.3 Normalizacion De Skills

Las skills deben pasar por canonizacion:
- Trim, lowercase tecnico y mapping a skill canonica.
- Alias: `gcp` -> `google cloud`, `bq` -> `bigquery`.
- Nivel inferido: `unknown`, `basic`, `intermediate`, `advanced`, `expert`.
- Evidencia: `cv`, `candidate_form`, `assessment`, `manual_review`.

Golden debe guardar skills canonicas, no solo texto libre del CV.

### 4.4 Matching Contra Vacantes

`candidate_job_match_golden` se genera cuando existe una vacante activa o una postulacion:
- Candidato debe estar `qualified` o `needs_review`.
- Job debe estar activo/publicado.
- Debe existir permiso de uso para `ai_processing` si se usan modelos.
- El score debe separar componentes para auditoria: skills, experiencia, idioma, rate y disponibilidad.
- Ninguna decision de rechazo final debe ser 100% automatizada sin revision humana cuando la gobernanza lo indique.

### 4.5 Consumo Por Analitica, IA Tradicional Y GenAI

Analitica:
- Usar tablas/documentos golden agregados y sin PII directa.
- Metricas permitidas: funnel, tiempos de proceso, conversion, demanda de skills, rangos de tarifa.

IA tradicional:
- Usar `golden_ai_feature_store`.
- Features deben ser versionadas, reproducibles y sin datos sensibles innecesarios.
- Labels de entrenamiento deben excluir decisiones sesgadas o sin trazabilidad.

IA generativa:
- Usar `golden_genai_context`.
- Contexto minimo necesario, enmascarado por defecto.
- Nunca pasar CV raw completo a un LLM externo salvo consentimiento explicito, contrato aprobado y anonimizacion previa.
- Prompts deben incluir `candidate_id`, `profile_version`, `job_version`, `model_version` y politica de privacidad aplicada.

---

## 5. Requisitos Funcionales

1. Al enviar una postulacion, la API crea `applications/{application_id}` con PII cifrada y un `cv_upload_token` de un solo uso.
2. El browser sube el CV a `/api/cv/upload` usando `application_id` y `upload_token`.
3. La API valida token, tipo de archivo, firma binaria y tamano.
4. La API guarda el archivo original en GCS raw.
5. La API actualiza `applications.cv_path` con la ruta privada raw.
6. El proceso de parsing analiza el raw CV y escribe un documento `candidate_cv_silver`.
7. El proceso de curacion aplica reglas de negocio y escribe `candidate_profile_golden`.
8. El proceso de matching escribe `candidate_job_match_golden` para vacantes activas o postulaciones.
9. Analitica, IA tradicional y GenAI leen desde golden o exports gobernados, no desde raw.
10. La descarga de CV solo se realiza por endpoint backend con autorizacion y signed URL corta.

---

## 6. Requisitos No Funcionales

| Categoria | Requisito |
|-----------|-----------|
| Seguridad | TLS en transito, objetos privados, bucket sin acceso publico |
| Reposo | Cifrado GCS por defecto o CMEK mediante `GCS_CV_KMS_KEY_NAME` |
| Integridad | Validacion CRC32C en upload y checksum SHA-256 para versionado silver |
| Privacidad | PII cifrada en Firestore; emails/telefonos hasheados para lookup |
| Trazabilidad | Cada silver record referencia `raw_cv_path`, `application_id`, parser y timestamps |
| Idempotencia | Reprocesar el mismo raw no debe duplicar una version activa sin razon |
| Retencion | Raw y silver deben obedecer solicitudes de privacidad y politicas de retencion |
| Contratos Golden | Consumidores externos solo leen schemas versionados y documentados |
| Minimizacion | Golden excluye PII directa salvo campos cifrados estrictamente necesarios |

---

## 7. Diagramas Mermaid

### 7.1 Arquitectura General

```mermaid
flowchart LR
  C[Candidate Browser] -->|POST application| A[/api/applications/]
  A -->|encrypted PII + upload token hash| F[(Firestore applications)]
  A -->|one-time upload token| C
  C -->|multipart CV + token over TLS| U[/api/cv/upload/]
  U -->|validate token, MIME, magic bytes| U
  U -->|save private object| G[(GCS raw/cvs)]
  U -->|cv_path raw ref| F
  U -->|async trigger| P[CV Parser / AI Analysis]
  P -->|read private raw object| G
  P -->|write normalized data| S[(Firestore candidate_cv_silver)]
  S -->|business rules| B[Golden Builder]
  B -->|trusted profile| GP[(candidate_profile_golden)]
  B -->|match records| GM[(candidate_job_match_golden)]
  GP -->|exports| BQ[(BigQuery golden datasets)]
  GM -->|features/context| AI[Analytics / ML / GenAI]
  P -->|write score and audit| F
  E[Employer Dashboard] -->|authorized reads| F
  E -->|ranked candidates| GM
  E -->|download request| D[/api/cv/download/]
  D -->|ownership check| F
  D -->|short signed URL| G
```

### 7.2 Secuencia De Postulacion, Parsing Y Golden

```mermaid
sequenceDiagram
  participant Candidate
  participant App as Next.js App
  participant Applications as /api/applications
  participant Upload as /api/cv/upload
  participant Firestore
  participant GCS as GCS raw
  participant Parser as Parser/AI
  participant Golden as Golden Builder
  participant Consumers as BI/ML/GenAI

  Candidate->>App: Completa formulario + selecciona CV
  App->>Applications: POST datos de postulacion
  Applications->>Firestore: Crear application con PII cifrada y token hash
  Applications-->>App: application_id + upload_token
  App->>Upload: POST file, application_id, upload_token
  Upload->>Firestore: Leer application y verificar token
  Upload->>Upload: Validar MIME, magic bytes, size
  Upload->>GCS: Guardar raw/cvs/{application_id}/{filename}
  Upload->>Firestore: Actualizar cv_path y borrar token
  Upload-->>App: Upload confirmado
  Upload-->>Parser: Iniciar analisis asincrono
  Parser->>GCS: Leer CV raw privado
  Parser->>Firestore: Escribir candidate_cv_silver + ai_analysis
  Golden->>Firestore: Leer silver, candidate, consents, jobs
  Golden->>Golden: Aplicar reglas de elegibilidad y canonizacion
  Golden->>Firestore: Escribir candidate_profile_golden
  Golden->>Firestore: Escribir candidate_job_match_golden
  Consumers->>Firestore: Consumir golden operacional
  Consumers->>Consumers: BI, modelos clasicos, RAG/GenAI gobernado
```

### 7.3 Modelo Raw-Silver-Golden

```mermaid
erDiagram
  APPLICATIONS ||--o| RAW_CV_OBJECT : references
  APPLICATIONS ||--o{ CANDIDATE_CV_SILVER : derives
  CANDIDATE_CV_SILVER ||--o{ CANDIDATE_PROFILE_GOLDEN : curates
  CANDIDATE_PROFILE_GOLDEN ||--o{ CANDIDATE_JOB_MATCH_GOLDEN : scores
  CANDIDATES ||--o{ APPLICATIONS : submits
  CANDIDATES ||--o| CANDIDATE_PROFILE_GOLDEN : has
  JOBS ||--o{ APPLICATIONS : receives
  JOBS ||--o{ CANDIDATE_JOB_MATCH_GOLDEN : ranks
  CONSENT_RECORDS ||--o{ CANDIDATE_CV_SILVER : governs
  CONSENT_RECORDS ||--o{ CANDIDATE_PROFILE_GOLDEN : authorizes

  APPLICATIONS {
    string id
    string candidate_id
    string job_id
    string cv_path
    boolean application_pii_encrypted
    string status
    timestamp created_at
  }

  RAW_CV_OBJECT {
    string gcs_path
    string content_type
    number size_bytes
    string sha256
    string encryption
  }

  CANDIDATE_CV_SILVER {
    string cv_version_id
    string candidate_id
    string application_id
    string raw_cv_path
    string parser_version
    string parse_status
    timestamp parsed_at
  }

  CANDIDATE_PROFILE_GOLDEN {
    string candidate_id
    string active_cv_version_id
    string profile_status
    string seniority_level
    string primary_role_family
    number golden_score
    timestamp built_at
  }

  CANDIDATE_JOB_MATCH_GOLDEN {
    string candidate_id
    string job_id
    string match_status
    number overall_score
    boolean human_review_required
    timestamp built_at
  }

  CANDIDATES {
    string id
    string email_hash
    string profile_status
  }

  JOBS {
    string id
    string employer_id
    string title
  }

  CONSENT_RECORDS {
    string id
    string candidate_id
    string consent_type
    timestamp accepted_at
    timestamp withdrawn_at
  }
```

### 7.4 Estados Del Parsing

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> processing: batch picks application with cv_path
  processing --> completed: silver record written
  processing --> retry: transient parser or AI error
  retry --> processing: retry_count < 3
  retry --> failed: retry_count >= 3
  failed --> pending: manual reset
  completed --> pending: parser_version upgrade or reprocess request
```

### 7.5 Estados De Golden Profile

```mermaid
stateDiagram-v2
  [*] --> new
  new --> incomplete: missing required fields
  new --> qualified: rules pass
  incomplete --> qualified: candidate completes data
  qualified --> needs_review: low confidence or policy flag
  needs_review --> qualified: reviewer approves
  qualified --> blocked: consent withdrawn or privacy request
  needs_review --> blocked: reviewer rejects
  blocked --> qualified: issue resolved and consent active
  qualified --> deleted: deletion request completed
  blocked --> deleted: deletion request completed
```

### 7.6 Consumo Golden

```mermaid
flowchart LR
  GP[(candidate_profile_golden)] --> BI[BI dashboards]
  GM[(candidate_job_match_golden)] --> BI
  GP --> FS[Feature Store]
  GM --> FS
  FS --> ML[Traditional ML models]
  GP --> RAG[GenAI/RAG Context Builder]
  GM --> RAG
  RAG --> LLM[LLM with masked context]
  GP --> API[Operational APIs]
  GM --> API
```

### 7.7 Limites De Confianza

```mermaid
flowchart TB
  subgraph PublicClient[Public Client Boundary]
    Browser[Candidate Browser]
  end

  subgraph Backend[Trusted Backend Boundary]
    AppAPI[Next.js API Routes]
    Token[Upload Token Verifier]
    Auth[Session/AuthZ Checks]
    Parser[Parser and AI Workers]
  end

  subgraph Data[Private Data Boundary]
    Firestore[(Firestore)]
    Raw[(GCS Raw CVs)]
    Silver[(Silver Candidate Data)]
    Golden[(Golden Business Data)]
  end

  subgraph Consumption[Governed Consumption Boundary]
    Analytics[Analytics]
    ML[Traditional AI]
    GenAI[Generative AI]
  end

  Browser -->|TLS only| AppAPI
  AppAPI --> Token
  AppAPI --> Auth
  AppAPI --> Firestore
  AppAPI --> Raw
  Parser --> Raw
  Parser --> Silver
  Silver --> Firestore
  Silver --> Golden
  Golden --> Analytics
  Golden --> ML
  Golden --> GenAI
```

---

## 8. Criterios De Aceptacion

- [x] Los nuevos uploads se guardan con prefijo `raw/cvs/`.
- [x] El endpoint de descarga acepta `raw/cvs/` y mantiene compatibilidad con `cvs/` historico.
- [x] El CV original no queda publico.
- [x] El token de upload se borra despues de un upload exitoso.
- [ ] Crear `candidate_cv_silver` en el parser batch.
- [ ] Crear `candidate_profile_golden` con reglas de elegibilidad y canonizacion.
- [ ] Crear `candidate_job_match_golden` para vacantes activas/postulaciones.
- [ ] Guardar `raw_cv_sha256` al subir o parsear.
- [ ] Definir export BigQuery para datasets golden.
- [ ] Agregar pruebas para path raw y compatibilidad legacy.
- [ ] Definir job programado para reprocesar `pending/retry`.

---

## 9. Tareas Tecnicas

1. Cambiar uploads nuevos a `raw/cvs/{application_id}/{filename}`.
2. Mantener compatibilidad de descarga para `cvs/` legado.
3. Extender `uploadCV()` para devolver `sha256`.
4. Crear helper `upsertCandidateCvSilver()`.
5. Actualizar `processPendingApplications()` para escribir estado silver.
6. Crear helper `buildCandidateProfileGolden()` con reglas versionadas.
7. Crear helper `buildCandidateJobMatchGolden()` con score explicable.
8. Agregar tests unitarios de path raw, validacion de archivo, token y reglas golden.
9. Agregar indices Firestore necesarios para `candidate_cv_silver` por `candidate_id`, `application_id`, `parse_status` y `created_at`.
10. Agregar indices Firestore para `candidate_profile_golden.profile_status`, `candidate_job_match_golden.job_id + score.overall` y `candidate_job_match_golden.match_status`.
11. Definir export programado a BigQuery para datasets golden.
12. Documentar politica de retencion raw/silver/golden en la spec de privacidad.
