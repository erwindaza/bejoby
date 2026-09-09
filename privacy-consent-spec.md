# BeJoby — Specification: Privacy & Consent Module

**Estado:** 🔄 Awaiting Stakeholder Approval
**Versión:** 0.1
**Fecha:** 2026-09-06
**Metodología:** Spec Driven Development (SDD)
**Fuente:** Especificación JSON provista por stakeholder (Falabella Legal/Compliance)

---

## 📋 Resumen Ejecutivo

Implementar un **subsistema persistente de consentimiento, privacidad, cesión de datos y auditoría** para candidatos de BeJoby, conforme a:
- **Ley 19.628** (protección de la vida privada, Chile)
- **Ley 21.719** (modernización de protección de datos personales, Chile) — **vigencia del nuevo régimen: 2026-12-01**

⚠️ **No es un checkbox de frontend.** Es un sistema de: consentimiento granular, versionado de política de privacidad, trazabilidad de cesión de datos a empleadores, gobernanza de IA, y ejercicio de derechos ARCO+ (acceso, rectificación, cancelación/eliminación, oposición, bloqueo, portabilidad).

**Principio rector:** *Privacy by design* + **denegar por defecto** cuando falte evidencia de consentimiento/autorización legalmente requerida.

---

## ⚖️ Marco Legal

| Principio | Aplicación en BeJoby |
|-----------|----------------------|
| Licitud | Toda base legal (consentimiento, contrato, interés legítimo) documentada por evento |
| Lealtad y transparencia | Textos claros, sin dark patterns, checkbox nunca premarcado |
| Finalidad | Datos de reclutamiento no se reusan para marketing ni entrenamiento de IA sin base legal separada |
| Proporcionalidad | Solo se solicitan datos necesarios para reclutamiento |
| Calidad de datos | Candidato puede rectificar |
| Responsabilidad (accountability) | Todo evento de tratamiento es auditable y reconstruible |
| Seguridad y confidencialidad | CV nunca público; storage privado; cifrado en tránsito y reposo |
| Protección desde el diseño y por defecto | Denegar tratamiento/cesión si falta evidencia de consentimiento |

---

## 🧭 Flujo de Arquitectura (End-to-End)

```
Candidato crea cuenta
  → Completa perfil
  → Sube CV
  → Se muestra aviso de privacidad
  → Candidato otorga consentimiento requerido (checkbox NO premarcado)
  → Evidencia de consentimiento se almacena (append-only)
  → CV se almacena de forma segura (storage privado, sin URLs públicas)
  → CV opcionalmente procesado por IA (con aviso específico de uso de IA)
  → Candidato ve una oferta y decide postular
  → Se muestra aviso específico de cesión de datos a ESE empleador
  → Candidato confirma postulación
  → CV/perfil se comparte con el empleador
  → Evento de cesión se registra (auditable)
  → Candidato puede acceder después a su panel de privacidad
```

---

## 👥 Historias de Usuario (Priorizadas)

### HU-1: Como candidato, debo otorgar consentimiento antes de que mi CV/perfil se active
**Prioridad:** P0
**Trigger:**
- Antes de guardar un CV por primera vez
- Antes de activar un perfil de candidato con datos personales
- Cuando la política de privacidad cambia materialmente y se requiere renovar consentimiento

**Criterios de Éxito:**
- [ ] Modal bloqueante (`PrivacyConsentModal`) antes de guardar CV activo
- [ ] Checkbox **nunca premarcado**
- [ ] Texto exacto y versión de política aceptada se guarda como snapshot (no solo un booleano)
- [ ] Link a política de privacidad completa siempre visible
- [ ] Un CV **no puede quedar activo** sin evidencia de consentimiento registrada
- [ ] Botón: "Guardar y continuar"

**Restricciones:**
- Nunca inferir consentimiento por inactividad
- Retirar consentimiento debe ser tan fácil como otorgarlo
- El retiro **no invalida retroactivamente** el tratamiento lícito ya realizado

---

### HU-2: Como candidato, debo autorizar explícitamente la cesión de mi CV a CADA empleador al postular
**Prioridad:** P0
**Trigger:** Click en "Postular"

**Criterios de Éxito:**
- [ ] Modal (`ApplicationDataSharingModal`) con texto dinámico: empresa + oferta específica
- [ ] Checkbox específico por postulación, no reutiliza consentimiento general de perfil
- [ ] Al confirmar: se crea el consentimiento + la postulación + el evento de cesión de datos, de forma atómica
- [ ] Evento de cesión (`candidate_data_sharing_events`) debe ser 100% reconstruible: qué se compartió, con quién, cuándo, bajo qué consentimiento

---

### HU-3: Como candidato, debo ser informado cuando IA procese mi información
**Prioridad:** P1 (aviso) / P2 (registro completo de gobernanza)
**Aplica cuando:** parsing de CV, matching, scoring, ranking, recomendaciones automáticas, clasificación, resúmenes generados por IA, filtrado automático

**Criterios de Éxito:**
- [ ] Aviso (`AIProcessingNotice`) explica: propósito, categorías de datos usadas, si genera score/ranking, si el output puede influir en la selección, si hay revisión humana, lógica general en lenguaje simple, consecuencias esperadas
- [ ] Candidato puede: solicitar explicación, solicitar revisión humana, expresar su punto de vista, impugnar una decisión automatizada, oponerse cuando aplique legalmente
- [ ] Todo procesamiento de IA queda registrado (`ai_processing_events`): proveedor, modelo, versión, propósito, impacto en decisión (none/advisory/significant), si requiere revisión humana

---

### HU-4: Como candidato, debo tener un panel de privacidad centralizado
**Prioridad:** P0 (versión básica) / P1 (funciones avanzadas)
**Ruta:** `/candidate/privacy` (label de navegación: "Privacidad y datos")

**Criterios de Éxito — Secciones:**
- [ ] **Mis datos** — ver copia de mis datos personales
- [ ] **Mis consentimientos** — historial completo (append-only, nunca se sobrescribe)
- [ ] **Empresas con las que compartí mi CV** — lista de cesiones + postulación asociada a cada una
- [ ] **Uso de IA** — qué procesamiento de IA se ha aplicado a mi perfil
- [ ] **Descargar mis datos** (portabilidad)
- [ ] **Eliminar mis datos** (sujeto a obligaciones legales de retención)
- [ ] **Solicitudes de privacidad** — crear y ver estado de solicitudes ARCO+ (acceso, rectificación, eliminación, oposición, bloqueo, portabilidad, retiro de consentimiento, revisión de decisión automatizada)

---

### HU-5: Como candidato, debo poder ejercer mis derechos (ARCO+) mediante solicitudes formales
**Prioridad:** P1

**Criterios de Éxito:**
- [ ] Crear solicitud de: acceso, rectificación, eliminación, oposición, bloqueo, portabilidad, retiro de consentimiento, revisión de decisión automatizada
- [ ] Estado de solicitud: recibida → verificación de identidad → procesando → completada/rechazada
- [ ] Export de datos personales en formato portable
- [ ] Flujo de eliminación respeta períodos de retención legal (no elimina si hay obligación de conservar)

---

### HU-6: Como empresa/administrador de BeJoby, la política de privacidad debe estar versionada y ser trazable
**Prioridad:** P0
**Ruta pública:** `/privacy`

**Criterios de Éxito:**
- [ ] Política versionada (cada versión tiene fecha de vigencia)
- [ ] Debe incluir: identidad del responsable, contacto, categorías de datos, finalidades y base legal de cada una, categorías de destinatarios (incluyendo empleadores/reclutadores), encargados de tratamiento/subprocesadores, transferencias internacionales (si aplica) y países involucrados, plazos de retención, derechos del titular y cómo ejercerlos, derecho a retirar consentimiento, información sobre IA y decisiones automatizadas, medidas de seguridad (nivel alto), mecanismos de reclamo, versión y fecha de vigencia de la política

---

## ❓ Preguntas de Clarificación para Stakeholder

1. **Identidad del responsable de tratamiento:** ¿Razón social exacta, RUT y datos de contacto del DPO/encargado de privacidad que debe figurar en la política?
2. **Retención:** ¿Cuáles son los plazos exactos de retención para candidatos inactivos y postulaciones no exitosas? (el JSON pide que sea "configurable" pero necesitamos un default legal)
3. **Transferencias internacionales:** ¿Los proveedores de IA (Gemini/Vertex AI) procesan datos fuera de Chile? ¿Qué países/regiones deben declararse en la política?
4. **Proveedores de IA:** ¿Gemini/Vertex AI ya tiene un DPA (Data Processing Agreement) firmado con Falabella/BeJoby? ¿Confirma que no se usa para entrenar modelos de terceros?
5. **Verificación de identidad:** Para solicitudes ARCO+, ¿qué mecanismo de verificación de identidad se exige (email confirmado, doble factor, etc.)?
6. **Migración de datos existentes:** Los candidatos ya registrados (pre-feature) no tienen `consent_records`. ¿Se requiere consentimiento retroactivo o solo aplica hacia adelante?
7. **Revisión humana de decisiones automatizadas:** ¿Quién es el responsable humano designado para revisar impugnaciones de decisiones de IA (scoring, ranking)?
8. **Marketing vs reclutamiento:** ¿BeJoby actualmente envía comunicaciones de marketing a candidatos? Si es así, ¿ya existe un consentimiento separado, o hay que construirlo desde cero?
9. **Definición de "dato sensible":** ¿El formulario de candidato hoy solicita algún dato sensible (salud, afiliación sindical, etc.) que deba justificarse o eliminarse?
10. **Plazo para responder solicitudes de privacidad:** ¿Cuál es el SLA legal/interno para resolver una solicitud ARCO+ (Ley 21.719 suele fijar plazos)?
11. **Canal de reclamos:** ¿Existe ya un canal oficial de reclamos de privacidad (email, formulario) que deba enlazarse en la política?
12. **Alcance del P0:** ¿Se aprueba lanzar primero solo el P0 (política versionada + consentimientos de perfil/postulación + auditoría + dashboard básico) y dejar P1/P2 para fases posteriores?

---

## 🎯 Criterios de Aceptación (Definition of Done)

- [ ] Un CV no puede activarse sin el paso de privacidad requerido
- [ ] Los checkboxes nunca están premarcados
- [ ] Todo consentimiento otorgado tiene timestamp y versión de política
- [ ] Todo evento de cesión de datos a empleador es reconstruible
- [ ] El candidato puede ver qué empresas recibieron su perfil
- [ ] El candidato puede retirar consentimiento cuando aplique
- [ ] El candidato puede solicitar eliminación
- [ ] El candidato puede solicitar exportación de datos
- [ ] El candidato puede solicitar rectificación
- [ ] El candidato puede solicitar oposición/bloqueo cuando aplique
- [ ] El candidato puede solicitar revisión de una decisión automatizada
- [ ] El procesamiento de IA es auditable por proveedor/modelo/propósito
- [ ] El CV nunca es accesible públicamente
- [ ] Los reclutadores solo acceden a candidatos conectados a procesos autorizados
- [ ] El consentimiento de marketing está separado del de reclutamiento

---

## 🚫 Fuera de Alcance (esta spec)

- Localización/i18n completa de textos legales en inglés (se prioriza español/Chile)
- Cumplimiento GDPR (UE) — foco exclusivo en Ley 19.628/21.719 de Chile
- Portal de administración avanzado de auditoría (`P2`, fase posterior)

---

**Próximo paso:** Aprobación del stakeholder (respuestas a las 12 preguntas) → Redactar/revisar `privacy-consent-plan.md`.
