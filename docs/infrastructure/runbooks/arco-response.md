# Runbook: Respuesta a Solicitudes ARCO (BeJoby Coach Laboral)

**Última actualización:** 2026-09-30  
**Vigencia Ley 21.719 (Chile):** 2026-12-01  
**Ámbito:** BeJoby como coach laboral con RAG sobre contenido de `aif369.com`.

---

## 1. Qué es ARCO

ARCO son los derechos que tiene todo titular de datos personales en Chile:

- **A**cceso: saber qué datos personales se tienen.
- **R**ectificación: corregir datos inexactos.
- **C**ancelación: eliminar datos cuando no hay obligación de conservar.
- **O**posición: oponerse al tratamiento para ciertas finalidades.

En el MVP de BeJoby también se soportan:

- **Bloqueo**: suspender temporalmente un tratamiento.
- **Portabilidad**: recibir los datos en formato estructurado (JSON).
- **Retiro de consentimiento**: revocar un consentimiento otorgado.

---

## 2. Principio Clave del MVP

BeJoby **no almacena historial de chat ni conversaciones** del coach laboral. Por lo tanto:

- No hay chat que exportar.
- No hay perfil psicológico ni evaluaciones que eliminar.
- Los únicos datos personales almacenados son: **email, nombre opcional y preferencias de mejora**.

Si un usuario solicita acceso/eliminación, la respuesta es simple y rápida.

---

## 3. Canales de Recepción

| Canal | Acción |
|-------|--------|
| Panel de privacidad (`/candidate/privacy` o similar) | Automático vía `/api/privacy/requests`. |
| Email a privacidad@bejoby.com | Crear manualmente `privacy_requests` con `request_type` correspondiente. |
| Reclamo formal | Escalar a área legal; registrar en `privacy_requests`. |

---

## 4. Plazos

- **Respuesta:** 10 días hábiles desde recepción (Ley 21.719).
- **Bloqueo:** inmediato si el usuario lo solicita.
- **Meta interna BeJoby:** resolver en 48 horas para casos simples (acceso, rectificación, eliminación de cuenta).

---

## 5. Flujo por Tipo de Solicitud

### 5.1 Acceso / Portabilidad

1. Verificar identidad del solicitante (login válido o email verificado).
2. Ejecutar `exportUserData(userId)`.
3. Entregar JSON con: email, nombre, preferencias, consentimientos, solicitudes previas.
4. Registrar en `privacy_requests` como `COMPLETED`.
5. Notificar al usuario.

### 5.2 Rectificación

1. Verificar identidad.
2. Validar campo a modificar (`email`, `name` o `preferences`).
3. Ejecutar `rectifyUserField(userId, { field, new_value })`.
4. Registrar en `privacy_requests` como `COMPLETED`.
5. Notificar al usuario.

### 5.3 Cancelación / Eliminación de Cuenta

1. Verificar identidad.
2. Ejecutar `requestUserDeletion(userId)`.
3. Si es elegible:
   - Marcar `deleted_at` en `users`.
   - Crear `privacy_requests` tipo `SUPPRESSION` como `COMPLETED`.
   - Programar borrado físico tras 30 días.
4. Si no es elegible (ej. solicitud ARCO pendiente):
   - Comunicar motivos y fecha estimada de eliminación.
5. Notificar al usuario.

### 5.4 Oposición / Bloqueo

1. Verificar identidad.
2. Identificar finalidad: `marketing_optional`, `ai_processing`, etc.
3. Ejecutar `blockProcessingForPurpose(userId, purposeCode, request_type)`.
4. Registrar en `privacy_requests` como `COMPLETED`.
5. Asegurar que el sistema respete el bloqueo en próximos tratamientos.

### 5.5 Revisión de Decisión Automatizada

1. En el MVP, el coach laboral **no toma decisiones vinculantes**.
2. Si un usuario solicita revisión, registrar `AUTOMATED_DECISION_REVIEW`.
3. Responder explicando que BeJoby solo orienta; no decide contrataciones ni admisiones.
4. Escalar a revisión humana si hay confusión o reclamo.

### 5.6 Retiro de Consentimiento

1. Identificar el consentimiento a retirar (`consent_records`).
2. Ejecutar `withdrawConsent(consentId, reason)`.
3. Asegurar que futuros tratamientos basados en ese consentimiento se detengan.
4. El retiro no invalida tratamientos lícitos previos.

---

## 6. Casos Especiales

### Usuario sin cuenta registrada

Si alguien escribe desde un email no registrado:
- Responder que no se encontraron datos asociados.
- No crear cuenta ni solicitar más información de la necesaria.

### Solicitud de terceros

- Solo responder al titular o a quien acredite representación legal.
- Documentar evidencia de representación.

### Solicitudes repetitivas o abusivas

- Pueden rechazarse con fundamento legal si son manifiestamente infundadas o excesivas.
- Registrar motivo en `legal_reason`.
- Escalar con área legal antes de rechazar.

---

## 7. Registro y Evidencia

Cada solicitud debe dejar rastro:

- `privacy_requests` con estados y resolución.
- `audit_events` para acciones ejecutadas.
- `data_lineage_events` para movimientos de datos personales.

**Nunca** incluir en los logs:
- Texto completo de conversaciones (no se almacenan).
- Contraseñas, tokens, claves de encriptación.
- Datos de terceros.

---

## 8. Escalamientos

| Situación | Escalar a |
|-----------|-----------|
| Breach de datos sensibles | Legal + Seguridad + DPO (si aplica) |
| Solicitud judicial o fiscalía | Legal |
| Reclamo ante autoridad de protección de datos | Legal |
| Duda sobre si eliminar o conservar datos | Legal |
| Incidente con proveedor LLM | Seguridad + Legal |

---

## 9. Plantillas de Respuesta

### Acceso / Portabilidad

> Estimado/a [nombre],
>
> Adjunto encontrarás una copia de los datos personales que BeJoby tiene asociados a tu cuenta. Recuerda que BeJoby no almacena el contenido de tus conversaciones con el coach laboral.
>
> Si tienes dudas, responde a este correo.
>
> Equipo BeJoby

### Eliminación completada

> Estimado/a [nombre],
>
> Hemos procesado tu solicitud de eliminación. Tu cuenta y datos personales han sido marcados para eliminación. El borrado físico se completará en 30 días.
>
> Equipo BeJoby

### Eliminación diferida

> Estimado/a [nombre],
>
> No podemos eliminar tu cuenta en este momento porque [motivo legal]. Una vez resuelto el impedimento, procederemos con la eliminación.
>
> Equipo BeJoby

---

## 10. Referencias

- `docs/sdds/data-governance-arco-sdd.md`
- `src/lib/compliance/arco-handler.ts`
- `src/lib/compliance/privacy-requests.ts`
- `src/app/api/privacy/requests/route.ts`
- Ley 19.628 y Ley 21.719 de Chile.
