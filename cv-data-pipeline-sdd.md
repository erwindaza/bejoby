# BeJoby - SDD: CV Raw-to-Silver Data Pipeline

**Estado:** Aprobado para implementacion incremental  
**Version:** 0.1  
**Fecha:** 2026-09-21  
**Metodologia:** Spec Driven Development (SDD)  

---

## 1. Objetivo

Cuando un postulante envia su CV, BeJoby debe conservar el archivo original en una zona `raw` de Google Cloud Storage y derivar una vista `silver` con datos parseados, normalizados y gobernados para la base de datos de candidatos.

El archivo original no se modifica. Toda extraccion, scoring o enriquecimiento se escribe como datos derivados y trazables.

---

## 2. Alcance

Incluido:
- Upload obligatorio de CV por postulacion.
- Almacenamiento del binario original en GCS bajo `raw/cvs/{application_id}/{filename}`.
- Cifrado en transito via HTTPS/TLS y cifrado en reposo via Google-managed encryption o CMEK si `GCS_CV_KMS_KEY_NAME` esta configurado.
- Registro en Firestore de la ruta privada `applications.cv_path`.
- Parsing asincrono del CV y generacion de datos `silver`.
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

Zona derivada con datos parseados, normalizados y listos para busqueda, matching, analitica y operaciones de candidatos.

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

---

## 4. Requisitos Funcionales

1. Al enviar una postulacion, la API crea `applications/{application_id}` con PII cifrada y un `cv_upload_token` de un solo uso.
2. El browser sube el CV a `/api/cv/upload` usando `application_id` y `upload_token`.
3. La API valida token, tipo de archivo, firma binaria y tamano.
4. La API guarda el archivo original en GCS raw.
5. La API actualiza `applications.cv_path` con la ruta privada raw.
6. El proceso de parsing analiza el raw CV y escribe un documento `candidate_cv_silver`.
7. El matching de IA, dashboards y busquedas leen desde `candidate_cv_silver` o desde `applications.ai_analysis`, no desde el archivo raw directamente.
8. La descarga de CV solo se realiza por endpoint backend con autorizacion y signed URL corta.

---

## 5. Requisitos No Funcionales

| Categoria | Requisito |
|-----------|-----------|
| Seguridad | TLS en transito, objetos privados, bucket sin acceso publico |
| Reposo | Cifrado GCS por defecto o CMEK mediante `GCS_CV_KMS_KEY_NAME` |
| Integridad | Validacion CRC32C en upload y checksum SHA-256 para versionado silver |
| Privacidad | PII cifrada en Firestore; emails/telefonos hasheados para lookup |
| Trazabilidad | Cada silver record referencia `raw_cv_path`, `application_id`, parser y timestamps |
| Idempotencia | Reprocesar el mismo raw no debe duplicar una version activa sin razon |
| Retencion | Raw y silver deben obedecer solicitudes de privacidad y politicas de retencion |

---

## 6. Diagramas Mermaid

### 6.1 Arquitectura General

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
  P -->|write score and audit| F
  E[Employer Dashboard] -->|authorized reads| F
  E -->|download request| D[/api/cv/download/]
  D -->|ownership check| F
  D -->|short signed URL| G
```

### 6.2 Secuencia De Postulacion Y Upload

```mermaid
sequenceDiagram
  participant Candidate
  participant App as Next.js App
  participant Applications as /api/applications
  participant Upload as /api/cv/upload
  participant Firestore
  participant GCS as GCS raw
  participant Parser as Parser/AI

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
```

### 6.3 Modelo Raw-Silver

```mermaid
erDiagram
  APPLICATIONS ||--o| RAW_CV_OBJECT : references
  APPLICATIONS ||--o{ CANDIDATE_CV_SILVER : derives
  CANDIDATES ||--o{ APPLICATIONS : submits
  JOBS ||--o{ APPLICATIONS : receives
  CONSENT_RECORDS ||--o{ CANDIDATE_CV_SILVER : governs

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

### 6.4 Estados Del Parsing

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

### 6.5 Limites De Confianza

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
  end

  Browser -->|TLS only| AppAPI
  AppAPI --> Token
  AppAPI --> Auth
  AppAPI --> Firestore
  AppAPI --> Raw
  Parser --> Raw
  Parser --> Silver
  Silver --> Firestore
```

---

## 7. Criterios De Aceptacion

- [x] Los nuevos uploads se guardan con prefijo `raw/cvs/`.
- [x] El endpoint de descarga acepta `raw/cvs/` y mantiene compatibilidad con `cvs/` historico.
- [x] El CV original no queda publico.
- [x] El token de upload se borra despues de un upload exitoso.
- [ ] Crear `candidate_cv_silver` en el parser batch.
- [ ] Guardar `raw_cv_sha256` al subir o parsear.
- [ ] Agregar pruebas para path raw y compatibilidad legacy.
- [ ] Definir job programado para reprocesar `pending/retry`.

---

## 8. Tareas Tecnicas

1. Cambiar uploads nuevos a `raw/cvs/{application_id}/{filename}`.
2. Mantener compatibilidad de descarga para `cvs/` legado.
3. Extender `uploadCV()` para devolver `sha256`.
4. Crear helper `upsertCandidateCvSilver()`.
5. Actualizar `processPendingApplications()` para escribir estado silver.
6. Agregar tests unitarios de path raw, validacion de archivo y token.
7. Agregar indices Firestore necesarios para `candidate_cv_silver` por `candidate_id`, `application_id`, `parse_status` y `created_at`.
8. Documentar politica de retencion raw/silver en la spec de privacidad.

