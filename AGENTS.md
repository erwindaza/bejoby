# AGENTS.md — BeJoby Coach Laboral con IA

**Última actualización:** 2026-09-30  
**Versión:** 1.0  
**Propósito:** Guía operativa para agentes de código que trabajan en BeJoby.

---

## 1. Visión del producto

BeJoby es un **coach laboral asistido por IA** para Latinoamérica. Su propuesta es simple:

- Ayudar a personas en búsqueda de empleo o en riesgo laboral a mejorar sus skills.
- Usar contenido verificado de `aif369.com` como fuente de verdad (RAG).
- Recomendar **material gratuito** para que el usuario avance sin gastar dinero.
- No ser un portal frío de postulaciones, sino un espacio de orientación práctica.

### Principios de producto

1. **Ayuda primero, monetización después.** Las donaciones son voluntarias y nunca una barrera.
2. **La IA contiene, orienta y ordena.** No promete empleo ni toma decisiones automatizadas vinculantes.
3. **Privacidad por diseño.** El chat del coach no se almacena. Solo guardamos lo mínimo: email, nombre opcional y preferencias de mejora.
4. **Costos bajos y viables.** Funciona con recursos limitados y escala progresivamente.
5. **Toda pieza local tiene ruta a cloud.** La arquitectura no se rehace al migrar.
6. **Transparencia y consentimiento.** El usuario entiende qué datos se usan y para qué.

---

## 2. Stack técnico real

### Actual (producción / MVP)

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, next-intl |
| Deploy | Vercel |
| Base de datos | Firestore (GCP) |
| Storage | Cloud Storage (solo si se habilitan CVs en el futuro) |
| IA | Google Generative AI (Gemini), con abstracción para Ollama/Mistral local |
| Auth | Sesiones propias con magic link por email |
| Email | Nodemailer |
| Tests | Vitest |
| Seguridad | Encriptación AES-256-GCM de PII, Firestore rules, origin-guard |

### Futuro (GCP / local)

- **Frontend:** Vercel / Firebase Hosting / Cloud Run.
- **Backend API:** Cloud Run o API routes de Next.js.
- **Base de datos:** Cloud SQL PostgreSQL o Firestore.
- **Vector store:** pgvector o ChromaDB.
- **LLM:** Vertex AI / Gemini u Ollama local.
- **Secretos:** Secret Manager.
- **Observabilidad:** Cloud Logging + Error Reporting.

---

## 3. Estructura del proyecto

```
/Users/macbookpro/Documents/New project/bejoby
├── src/
│   ├── app/                    # Rutas y API routes de Next.js
│   │   ├── [locale]/          # i18n (es/en)
│   │   └── api/               # Endpoints serverless
│   ├── components/            # Componentes React reutilizables
│   ├── lib/                   # Lógica de negocio, helpers, compliance
│   │   ├── agent-fabric/     # Plataforma de agentes reusable
│   │   ├── ai/               # Clientes IA, gobernanza, anonimización
│   │   ├── compliance/       # Consentimiento, linaje, ARCO, retención
│   │   ├── gcp/              # Firestore, Cloud Storage
│   │   ├── security/         # PII, tokens, origin-guard
│   │   ├── schema/           # Esquemas y migraciones
│   │   └── validators/       # Validaciones Zod
│   └── types/                 # Tipos TypeScript
├── docs/
│   ├── sdds/                  # Especificaciones SDD
│   ├── planning/              # Historias, plan y tareas
│   ├── operations/            # Incidentes y runbooks
│   ├── infrastructure/        # ADRs, runbooks de infraestructura
│   ├── assets/                # PDFs, diagramas
│   ├── SPEC-001-bejoby-local-poc-gcp.md
│   ├── API_REFERENCE.md
│   └── IMPLEMENTATION_STATUS.md
├── scripts/                   # Scripts de utilidad (QA, migraciones)
├── public/                    # Assets estáticos
├── media/                     # Recursos multimedia
├── tests/                     # Tests (Vitest)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.js
├── firestore.rules
└── README.md
```

### Reglas de ubicación

- **Nunca** pongas lógica de negocio en componentes de UI.
- **Siempre** usa `src/lib/` para funciones reutilizables.
- **Los endpoints** van en `src/app/api/` y deben ser delgados: validan, llaman a `src/lib/`, responden.
- **Los tests** de `src/lib/` van en `src/lib/__tests__/`.
- **La documentación SDD** va en `docs/sdds/`.
- **Los runbooks** van en `docs/operations/runbooks/`.

---

## 4. Metodología de trabajo

### Spec Driven Development (SDD)

Toda iniciativa significativa debe documentarse antes o junto con la implementación:

1. `docs/sdds/nombre-iniciativa-sdd.md` — arquitectura, alcance, riesgos.
2. `docs/planning/spec.md` — historias de usuario y criterios de aceptación.
3. `docs/planning/plan.md` — decisiones técnicas (schema, APIs, componentes).
4. `docs/planning/tasks.md` — desglose en tareas con dependencias.

### Ciclo de trabajo del agente

Antes de modificar código:

1. Leer este archivo (`AGENTS.md`).
2. Leer el SDD relevante en `docs/sdds/`.
3. Leer `docs/SPEC-001-bejoby-local-poc-gcp.md` si aplica.
4. Revisar la estructura existente y respetar el stack presente.
5. Proponer cambios pequeños y ejecutables.

Durante la implementación:

- Prioriza **vertical slices funcionales** (un flujo completo de punta a punta).
- No construyas una plataforma gigante antes de validar el flujo.
- Mantén costos bajos.
- Documenta decisiones relevantes en el SDD correspondiente.
- Separa claramente PoC local de adaptadores cloud.

Al terminar cada fase:

1. Ejecutar `npm run lint`.
2. Ejecutar `npm test`.
3. Ejecutar `npm run build`.
4. Actualizar `README.md` o docs si cambia la ejecución.
5. Registrar pendientes y riesgos.

---

## 5. Reglas de implementación

### Código

- Usa **TypeScript** estricto. Evita `any`.
- Usa **Zod** para validar inputs de API.
- Escribe funciones pequeñas y testeables.
- Prefiere composición sobre herencia.
- No dupliques lógica: si existe un helper en `src/lib/`, úsalo.

### IA y proveedores

- No acoples la lógica de negocio al proveedor de IA.
- Las clases/proveedores de LLM deben implementar una interfaz común.
- Toda respuesta IA debe tener **tono de apoyo** y evitar promesas laborales absolutas.
- Si se envía texto del usuario a un LLM cloud, usa `anonymizeForLLM()`.
- **Evita modelos chinos** por la restricción de privacidad definida para BeJoby.
- El flujo de IA debe poder degradar si el modelo local está ocupado.

### Datos y privacidad

- **No guardes datos sensibles sin consentimiento explícito.**
- Email y nombre se encriptan con AES-256-GCM (`src/lib/security/pii.ts`).
- El **chat del coach no se almacena** en el MVP.
- Todo evento de consentimiento, acceso, exportación y eliminación se audita.
- Respeta los derechos ARCO: acceso, rectificación, cancelación, oposición, bloqueo, portabilidad.
- Consulta `docs/sdds/data-governance-arco-sdd.md` antes de tocar PII o compliance.

### Seguridad

- Nunca expongas secrets, API keys ni claves de encriptación en el frontend.
- Nunca commitees `.env.local` ni credenciales.
- Las Firestore rules deben aislar datos por `user_id`.
- Los CVs (si se habilitan) solo se sirven por signed URLs de corta duración.
- Los logs nunca deben contener PII completo, tokens ni claves.

---

## 6. Variables de entorno obligatorias

| Variable | Descripción | Entorno |
|----------|-------------|---------|
| `FIELD_ENCRYPTION_KEY` | Clave AES-256 para encriptar PII | Todos |
| `FIELD_HASH_KEY` | Clave HMAC para búsqueda por email | Todos |
| `GEMINI_API_KEY` | API key de Gemini (cloud) | Prod/Dev |
| `GOOGLE_CLOUD_PROJECT_ID` | Proyecto GCP | Prod/Dev |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta a service account (solo local ADC) | Local |
| `GCS_CV_BUCKET` | Bucket de CVs (futuro) | Prod/Dev |
| `NODEMAILER_HOST` | Servidor SMTP | Prod/Dev |
| `NODEMAILER_USER` | Usuario SMTP | Prod/Dev |
| `NODEMAILER_PASS` | Contraseña SMTP | Prod/Dev |
| `META_WHATSAPP_TOKEN` | Token de WhatsApp Cloud API (Meta) | Prod/Dev |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono de WhatsApp Business | Prod/Dev |
| `WHATSAPP_VERIFY_TOKEN` | Token para verificar el webhook de WhatsApp | Prod/Dev |
| `ADMIN_SECRET_TOKEN` | Token para acceder al panel admin de aprobación de empleadores/ofertas | Prod/Dev |

> Ver `docs/sdds/secrets-and-kms-sdd.md` para políticas de manejo de secretos.
> Ver `docs/operations/runbooks/whatsapp-setup.md` para configurar el webhook con Meta.

---

## 7. Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Tests
npm test

# Lint
npm run lint

# Build de producción
npm run build
```

### Desarrollo local con Firestore

Puedes usar el emulador de Firebase o una instancia de Firestore de desarrollo:

```bash
firebase emulators:start --project bejoby-dev
```

---

## 8. Criterios de calidad (Definition of Done)

Una feature o tarea se considera lista cuando:

- [ ] El código pasa `npm run lint` sin errores.
- [ ] Todos los tests pasan (`npm test`).
- [ ] El build es exitoso (`npm run build`).
- [ ] La funcionalidad tiene cobertura de tests unitarios o de integración.
- [ ] Los endpoints validan inputs con Zod.
- [ ] No hay PII en logs ni respuestas innecesarias.
- [ ] Se actualizó la documentación relevante (SDD, README, CLAUDE.md).
- [ ] Se registraron riesgos y pendientes.
- [ ] Se revisó que no se expongan secrets ni credenciales.

---

## 9. Decisiones arquitectónicas clave

### BeJoby no almacena historial de chat

- Reduce drásticamente riesgo de privacidad y costos.
- El usuario conversa con el coach; la IA responde con RAG sobre `aif369.com`.
- Se audita solo metadata mínima (sin texto del usuario).

### Encriptación de PII

- Campos sensibles (email, nombre) se almacenan encriptados con AES-256-GCM.
- Se usa HMAC-SHA256 para búsquedas por email sin exponer el valor.
- Las claves nunca viajan al cliente ni se loguean.

### Arquitectura local/cloud desacoplada

- `src/lib/ai/` abstrae el proveedor de LLM.
- `src/lib/compliance/` es independiente del storage.
- `src/lib/gcp/` concentra los adaptadores a GCP; puede reemplazarse por adaptadores locales.

---

## 10. Recursos clave para agentes

| Documento | Para qué sirve |
|-----------|----------------|
| `docs/SPEC-001-bejoby-local-poc-gcp.md` | Especificación de la PoC local exportable a GCP |
| `docs/sdds/data-governance-arco-sdd.md` | Gobernanza de datos, encriptación, ARCO |
| `docs/sdds/secrets-and-kms-sdd.md` | Manejo de secretos y credenciales |
| `docs/operations/runbooks/arco-response.md` | Cómo responder solicitudes ARCO |
| `CLAUDE.md` | Estado actual del proyecto y convenciones SDD |
| `README.md` | Instalación, estructura y próximos pasos |

---

## 11. Comportamiento esperado del agente

- **Sé conservador con los cambios:** modifica solo lo necesario.
- **Sé explícito con las dependencias:** si una tarea bloquea otra, documéntalo.
- **No rompas la build:** siempre valida con lint, tests y build antes de reportar listo.
- **No ignores la privacidad:** cualquier dato nuevo debe pasar por clasificación de sensibilidad.
- **Mantén la simplicidad:** si hay dos formas de hacer algo, elige la más simple que cumpla.
- **Comunica riesgos:** si algo no se puede hacer bien con los recursos actuales, dilo.

---

**Nota final:** Este archivo vive en la raíz porque es el primer punto de entrada para cualquier agente que trabaje en BeJoby. Si cambias algo aquí, asegúrate de que siga siendo útil, conciso y alineado con el estado real del proyecto.
