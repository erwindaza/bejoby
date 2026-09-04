# BeJoby — Specification: Application & Publication History (SDD Pilot)

**Estado:** ✅ Aprobado — en despliegue
**Versión:** 0.2
**Fecha:** 2026-09-04
**Metodología:** Spec Driven Development (SDD)

---

## 🚀 Pipeline de Despliegue (Requisito transversal)

Todo cambio de código —incluyendo esta iniciativa— debe pasar por el siguiente flujo antes de llegar a producción:

```
push → rama dev
         │
         ├─ CI: lint + type-check + build + tests (bloqueante)
         ├─ SonarQube Quality Gate (bloqueante)
         │
         ▼ (Vercel auto-deploy a https://bejoby.vercel.app)
         │
     PR: dev → qa
         │
         ├─ CI: lint + type-check + build + tests (bloqueante)
         ├─ SonarQube Quality Gate (bloqueante)
         ├─ QA Agent automatizado (scripts/qa-agent.py)
         │
         ▼ (merge a qa)
         │
     PR: qa → main
         │
         ├─ CI: lint + type-check + build + tests (bloqueante)
         ├─ SonarQube Quality Gate (bloqueante)
         │
         ▼ (merge a main → Vercel auto-deploy a https://www.bejoby.com)
         │
   Production Health Check (post-deploy, automático)
```

**Reglas:**
- Ningún merge a `qa` o `main` procede si el SonarQube Quality Gate falla (bugs, vulnerabilidades, code smells sobre el umbral, cobertura insuficiente).
- El mismo workflow de CI (`.github/workflows/ci.yml`) corre el scan de Sonar en los tres puntos (push a `dev`, PR a `qa`, PR a `main`) — un solo gate, tres veces.
- El gate de Sonar está detrás de un feature flag (`vars.SONAR_ENABLED`) hasta que se configuren los secrets `SONAR_TOKEN`/`SONAR_HOST_URL` en GitHub — **pendiente de credenciales del equipo de plataforma/DevOps de Falabella**.
- Nunca se hacen cambios directos en `main`/producción; todo pasa por PR desde `qa`.

**Dependencia externa:** credenciales de la instancia SonarQube de Falabella (host URL + token) para habilitar el gate. Hasta entonces, el paso corre en modo informativo/deshabilitado.

---

## 📋 Resumen Ejecutivo

Agregamos historial transaccional bidireccional a BeJoby:
- **Candidatos**: ven el estado de cada postulación (timeline completa)
- **Empleadores**: ven publicaciones, postulaciones recibidas y transacciones asociadas

Beneficio: mayor transparencia, menos queries de soporte, mejor engagement.

---

## 👥 Historias de Usuario (Priorizadas)

### HU-1: Como candidato, quiero ver mi historial de postulaciones
**Prioridad:** P1 (MVP)
**Tema:** Dashboard Candidato → Sección "Mis Postulaciones"

#### Descripción
Como candidato, necesito acceder a un historial completo de todas mis postulaciones para:
- Saber el estado actual de cada postulación (enviada, revisada, entrevista, rechazada, aceptada)
- Ver quién me contactó y cuándo
- Entender el timeline de cada proceso
- Descargar documentos compartidos (oferta, contrato, feedback)

#### Criterios de Éxito
- [ ] Mostrar listado de todas las postulaciones del usuario autenticado
- [ ] Cada postulación tiene: puesto, empresa, estado, fecha de envío, último update
- [ ] Estados visuales claros (badge con color y ícono por estado)
- [ ] Filtros funcionales: por estado, rango de fechas, empresa
- [ ] Al hacer clic en una postulación, abre modal/página con timeline completa
- [ ] Timeline muestra: fecha de envío → revisión → entrevista → decisión
- [ ] Incluye botón "Contactar empresa" si está en estado pendiente
- [ ] Responsive mobile-first (candidatos usan phone)

#### Flujo Principal
1. Candidato inicia sesión
2. Va a "Mis Postulaciones" en sidebar/navbar
3. Ve tabla/grid con todas sus postulaciones
4. Filtra por estado o rango de fechas
5. Hace clic en una postulación → abre modal con timeline + detalles
6. Puede descargar documentos o contactar empresa desde allí

#### Restricciones & Notas
- Solo muestra postulaciones del candidato autenticado
- No mostrar datos de otras postulaciones del mismo puesto
- Respetar RGPD: no guardar email de empleador en historial público
- Performances: carga de max 100 postulaciones por página (lazy-load si hay más)

---

### HU-2: Como empleador, quiero ver mi historial de publicaciones, postulaciones y transacciones
**Prioridad:** P1 (MVP)
**Tema:** Dashboard Empleador → Sección "Analytics & Historial"

#### Descripción
Como empleador, necesito un dashboard que me muestre:
- Todas mis publicaciones (activas, cerradas, archivadas)
- Postulaciones recibidas por cada publicación + estado de cada candidato
- Transacciones (pagos de publicaciones, upgrades, etc.)
- Timeline de cada proceso de hiring

#### Criterios de Éxito
- [ ] Mostrar 3 sub-secciones: Publicaciones | Postulaciones | Transacciones
- [ ] **Publicaciones**: listado con estado, fecha, cantidad de postulaciones, acción "ver postulaciones"
- [ ] **Postulaciones**: tabla con candidato, puesto, estado (nuevo, revisado, entrevista, rechazado, oferta), fecha
- [ ] **Transacciones**: tabla con fecha, tipo (publicar, upgrade, featured), monto, estado (pagado, pendiente)
- [ ] Filtros: por estado, rango de fechas, tipo de transacción
- [ ] Al hacer clic en una publicación → abre detalles + listado de postulantes
- [ ] Al hacer clic en un candidato → perfil + historial de interacción (emails, chats, notas internas)
- [ ] CTA: "Enviar feedback a candidato", "Hacer oferta", "Archivar publicación"
- [ ] Export a CSV: postulaciones, transacciones
- [ ] Responsive en mobile (al menos lectura del historial)

#### Flujo Principal
1. Empleador inicia sesión
2. Va a "Analytics & Historial" en sidebar
3. Ve resumen: publicaciones activas, postulaciones nuevas, saldo de transacciones pendientes
4. Hace clic en "Ver Publicaciones" → tabla filtrable de todas sus publicaciones
5. Hace clic en una publicación → modal con detalles + postulantes asociados
6. Hace clic en un candidato → perfil + historial de emails/interacciones

#### Restricciones & Notas
- Solo mostrar datos del empleador autenticado + su empresa
- Guardar transacciones con auditoría (quién, cuándo, qué acción)
- Integración futura con VTEX para pagos recurrentes
- No mostrar CV completo en listado (solo preview); acceso full bajo click
- Max 50 postulaciones por página (lazy-load)
- Archivos (PDFs de CVs, contratos) guardar en Cloud Storage con presigned URLs

---

## ❓ Preguntas de Clarificación para Stakeholder

### Scope & Prioridad
1. **HU-1 (candidatos)**: ¿Es bloqueante para MVP? ¿O priorizamos primero HU-2 (empleadores)?
2. **Estados de postulación**: ¿Cuáles son todos los estados posibles? (ej: enviada, revisada, entrevista, rechazo, oferta, aceptada, expirada)
3. **Historial de interacción**: ¿Guardamos emails, chats, notas internas en una tabla separada?

### Datos & Modelos
4. **CV en postulación**: ¿Guardamos versión del CV al momento de postular, o siempre muestra el actual?
5. **Transacciones**: ¿Qué tipos incluimos? (publicar, featured, homepage, upgrade de perfil, etc.)
6. **Período de retención**: ¿Cuánto tiempo guardamos historial? (ej: 2 años, indefinido)

### Integraciones
7. **VTEX**: ¿Necesitamos SSO con VTEX o solo integración de pagos? ¿Qué endpoints de VTEX usamos?
8. **Email de notificaciones**: ¿Enviamos email al candidato cuando hay update en su postulación?
9. **Chat/Contacto**: ¿Implementamos chat en plataforma o redireccionamos a WhatsApp/Email?

### UX & Comportamiento
10. **Candidato - Privacidad**: ¿El candidato puede ver quién vió su CV? (analytics)
11. **Empleador - Permisos**: ¿Solo admin de empresa ve todo, o cada hiring manager ve solo sus publicaciones?
12. **Notificaciones**: ¿Real-time o digest diario de cambios?

---

## 🎯 Definición de Listo (DoD)

### Por Historia
- [ ] Spec aprobada por stakeholder (todas las preguntas resueltas)
- [ ] Plan técnico documentado (stack, DB schema, APIs, orquestación)
- [ ] Tasks desglosados con dependencias claras
- [ ] Criterios de aceptación testables (E2E, unitarios o manuales)

### Por Feature
- [ ] Componentes React funcionales
- [ ] API routes completas (GET, POST, PUT si aplica)
- [ ] Firestore schema definido y migrado
- [ ] Tests covering flujo principal
- [ ] Responsive en mobile
- [ ] Documentación de campos en BD

---

## 📊 Métricas de Éxito

| Métrica | Target | Medición |
|---------|--------|----------|
| Time-to-view (candidatos) | <2s | Vercel Analytics |
| Pagination de historial | <500ms | Firestore latency |
| User satisfaction (rating) | >4/5 | In-app survey |
| Adoption (MAU) | >60% de usuarios activos | GA4 |

---

## 🔄 Dependencias Externas

- [ ] Stakeholder aprueba scope & preguntas de clarificación
- [ ] Credenciales VTEX (si necesario para pagos)
- [ ] Definición de roles en Firestore (admin, hiring manager, candidate)

---

**Próximo paso:** Esperar aprobación stakeholder → Redactar plan.md con decisiones técnicas.
