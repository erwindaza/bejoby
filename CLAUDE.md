# BeJoby — Codebase Documentation

**Última actualización:** 2026-09-04
**Metodología:** Spec Driven Development (SDD)

---

## 📋 Proyecto

**BeJoby** es un **job matching portal con IA** para América Latina (Next.js 15 + Gemini).

- **Producción:** https://www.bejoby.com
- **Dev:** https://bejoby.vercel.app (rama `dev`)
- **Stack:** Next.js 15, React 18, TypeScript, Firestore, Cloud Storage, Tailwind, next-intl
- **Team:** 1 developer (ext_edazac)

---

## 🎯 Iniciativa Actual: Application & Publication History (SDD Pilot)

**Estado:** Awaiting Stakeholder Approval

### Dos Historias de Usuario
1. **HU-1 (Candidato):** Ver historial de mis postulaciones
2. **HU-2 (Empleador):** Ver historial de publicaciones, postulaciones y transacciones

### Documentos SDD
- **spec.md** → Historias, criterios de éxito, restricciones, preguntas de clarificación
- **plan.md** → Decisiones técnicas (Firestore schema, API routes, componentes React)
- **tasks.md** → Desglose en 25 tareas con dependencias (6 sprints)

### Estimación
- **Total:** ~14-18 días
- **Sprint 1 (Setup):** 1-2 días (Firestore schema)
- **Sprint 2 (API):** 3-4 días (Backend routes)
- **Sprint 3-4 (Frontend):** 5-7 días (Candidato + Empleador)
- **Sprint 5 (Testing):** 2 días
- **Sprint 6 (Deploy):** 1 día

---

## 🏗️ Arquitectura Actual

### Estructura de Carpetas
```
src/
├── app/
│   ├── api/                    # API routes
│   ├── [locale]/              # i18n routing (next-intl)
│   │   ├── page.tsx           # Landing
│   │   ├── candidate/         # Candidato (future: dashboard)
│   │   └── employer/          # Empleador → dashboard/page.tsx (NEW)
│   └── layout.tsx
├── components/
│   ├── JobCard.tsx
│   ├── JobApplyForm.tsx
│   ├── CandidateDashboard/    # NEW
│   └── EmployerDashboard/     # NEW
├── lib/
│   ├── auth.ts                # Auth helpers
│   ├── email.ts               # Email (nodemailer)
│   ├── security/              # origin-guard, pii masking
│   └── utils/                 # API response helpers
├── types/
│   ├── candidate.ts
│   ├── employer.ts
│   ├── job.ts
│   ├── application.ts         # NEW
│   ├── transaction.ts         # NEW
│   └── interaction.ts         # NEW
└── i18n/
    ├── routing.ts
    └── request.ts
```

### Colecciones Firestore (Actuales)
- `candidates` — candidatos registrados
- `employers` — empleadores registrados
- `job_postings` — publicaciones de empleo
- `applications` — postulaciones (ACTUALIZAR)

### Colecciones Firestore (NEW)
- `transactions` — historial de pagos/publicaciones
- `interactions` — emails, notas, cambios de estado
- Índices composites para perf

---

## 🔐 Seguridad (Ponytail Modo)

| Aspecto | Decisión |
|--------|----------|
| **Aislamiento de datos** | Firestore security rules: candidateId/employerId == auth.uid |
| **Privacidad** | Email de empleador no en listados; CV en snapshot al momento de postular |
| **Auditoría** | Transacciones append-only; interactions guardan quién y cuándo |
| **RGPD** | Futuro: export/delete data flow |
| **Cloud Storage** | Presigned URLs expiran en 1 hora |
| **VTEX (future)** | Webhook signature validation + state mutation safety |

---

## 🧪 Testing Strategy

- **Unit:** Vitest para API routes, helpers (auth, parsing)
- **E2E:** Manual smoke tests (login → ver historial → interactuar)
- **Security:** Review de Firestore rules, validation con Zod

---

## 🚀 Próximos Pasos

### Inmediato (TODAY)
- [ ] **Stakeholder aprueba spec.md** (2 HU, criterios, restricciones)
- [ ] **Responder 12 preguntas de clarificación** en spec.md
- [ ] **Tech lead revisa plan.md** (schema, APIs, componentes)

### Luego (APPROVAL)
- [ ] Empezar TASK-001: Firestore schema migration
- [ ] Luego TASK-002: TypeScript types
- [ ] Pipeline: Sprint 1 → 2 → 3 → 4 → 5 → 6 (deploy)

---

## 👤 Responsabilidad

**Developer:** ext_edazac@falabella.cl
- Backend: TASK-001 a TASK-010, TASK-019
- Frontend: TASK-011 a TASK-018
- DevOps: TASK-023 a TASK-025

**QA:** TBD (TASK-020, TASK-021)
**Tech Lead:** Review de plan.md (schema, decisiones técnicas)

---

## 📚 References

- **Spec Kit (Framework SDD):** https://github.com/github/spec-kit
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/rules-structure
- **Next.js 15 API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **next-intl (i18n):** https://next-intl-docs.vercel.app/
- **VTEX API (Phase 2):** https://developers.vtex.com/docs

---

## ⚙️ Configuration

### Env Vars Required
```
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=...
GEMINI_API_KEY=...
NODEMAILER_HOST=...
NODEMAILER_USER=...
NODEMAILER_PASS=...
```

### Firestore Emulator (Local Dev)
```bash
firebase emulators:start --project bejoby-dev
```

### NPM Scripts
```bash
npm run dev        # Next.js dev server
npm run build      # Build for prod
npm run start      # Start prod server
npm test           # Vitest
npm run lint       # ESLint
```

---

## 🎯 Definition of Done (Spec + Plan + Tasks)

Feature está LISTO cuando:
1. ✅ Spec aprobada por stakeholder
2. ✅ Plan técnico revisado por tech lead
3. ✅ Todos los tests pasan (Unit + E2E)
4. ✅ Security review completado
5. ✅ Deploy en staging validado
6. ✅ Deploy en producción exitoso
7. ✅ Monitoreo (Sentry, Analytics) OK

---

**Metodología:** Spec Driven Development (SDD)
**Framework:** github/spec-kit (MIT)
**Última revisión:** 2026-09-04
