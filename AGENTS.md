# AGENTS.md - BeJoby Local PoC Exportable a GCP

## Mision Del Agente

Construir una PoC local de BeJoby orientada a apoyar a personas que estan sin empleo o en riesgo laboral, con una experiencia humana, simple y util. La PoC debe poder ejecutarse en local con bajo costo y luego migrarse progresivamente a GCP sin rehacer la arquitectura.

BeJoby no debe sentirse como otro portal frio de postulaciones. Debe sentirse como un espacio de apoyo: cursos, contenido practico, orientacion, herramientas de empleabilidad, acompanamiento con IA y donaciones voluntarias para sostener el proyecto.

## Principios De Producto

1. Ayuda primero, monetizacion despues.
2. La donacion es voluntaria, nunca una barrera de acceso.
3. La IA debe contener, orientar y ordenar, no prometer empleo.
4. El sistema debe ser usable con recursos limitados.
5. Toda funcionalidad local debe tener una ruta clara a cloud.
6. El usuario debe entender que sus datos se tratan con cuidado, consentimiento y proposito.

## Objetivo Tecnico

Implementar una PoC local exportable a GCP para:

- Mejorar el front de BeJoby con una narrativa social y de apoyo.
- Publicar cursos y contenidos breves para personas desempleadas.
- Permitir donaciones voluntarias.
- Preparar un flujo de reserva de turnos para hablar con una IA.
- Manejar la limitacion inicial de concurrencia de la PC local mediante agenda, turnos y cola.
- Separar frontend, backend, agente IA, persistencia y adaptadores cloud.

## Stack Sugerido

### Local

- Frontend: Next.js o React compatible con la base actual de BeJoby.
- Backend API: FastAPI.
- Base de datos: PostgreSQL local o SQLite para PoC rapida.
- Vector store: ChromaDB o pgvector si PostgreSQL esta disponible.
- LLM local: Ollama con modelo liviano.
- LLM cloud opcional: Gemini mediante API key.
- Orquestacion IA: LangGraph para flujos con estado.
- Observabilidad PoC: logs estructurados en JSON.
- Scheduler local: tabla de reservas + worker simple.

### GCP Futuro

- Frontend: Cloud Run, Firebase Hosting o Vercel si se mantiene fuera de GCP.
- Backend API: Cloud Run.
- Base de datos: Cloud SQL PostgreSQL o Firestore segun costo y complejidad.
- Vector store: pgvector en Cloud SQL, AlloyDB o servicio administrado posterior.
- LLM: Vertex AI / Gemini.
- Archivos: Cloud Storage.
- Secretos: Secret Manager.
- Jobs: Cloud Scheduler + Cloud Tasks.
- Observabilidad: Cloud Logging + Error Reporting.

## Reglas De Implementacion

- No acoplar la logica del negocio al proveedor de IA.
- Crear interfaces para proveedores de LLM: `LocalLLMProvider`, `GeminiProvider`.
- Crear interfaces para almacenamiento: `LocalRepository`, `CloudRepository` futuro.
- Crear interfaces para agenda: `LocalBookingService`, `CloudBookingService` futuro.
- Mantener una configuracion por ambiente: `local`, `demo`, `cloud`.
- No guardar datos sensibles sin consentimiento explicito.
- Evitar modelos chinos por la restriccion de privacidad definida para BeJoby.
- Toda respuesta IA debe incluir tono de apoyo y evitar promesas laborales absolutas.
- El flujo de IA debe poder degradar si el modelo local esta ocupado.

## Prioridad De Desarrollo

1. Landing/front social de BeJoby.
2. Catalogo simple de cursos y contenidos.
3. Formulario de ayuda/orientacion inicial.
4. Donaciones voluntarias.
5. Reserva de turnos IA.
6. Chat IA con cupos limitados.
7. Panel admin basico.
8. Exportabilidad a GCP.

## Definicion De Listo

La PoC se considera lista cuando:

- Corre localmente con un comando documentado.
- Tiene una pagina principal clara y emocionalmente correcta.
- Permite ver cursos o contenidos de apoyo.
- Permite registrar interes o pedir ayuda.
- Permite reservar un turno para hablar con la IA.
- Permite configurar proveedor IA local o Gemini.
- Tiene una estructura compatible con despliegue posterior en GCP.
- Tiene README tecnico y variables de entorno documentadas.
- Incluye criterios de privacidad y consentimiento.

## Comportamiento Esperado Del Agente

Antes de modificar codigo:

1. Leer este archivo completo.
2. Leer `docs/SPEC-001-bejoby-local-poc-gcp.md`.
3. Revisar la estructura existente del proyecto.
4. Respetar el stack ya presente si existe.
5. Proponer cambios pequenos y ejecutables.

Durante la implementacion:

- Priorizar vertical slices funcionales.
- No construir una plataforma gigante antes de validar el flujo.
- Mantener costos bajos.
- Documentar decisiones relevantes.
- Separar claramente PoC local de adaptadores cloud.

Al terminar cada fase:

- Ejecutar pruebas o al menos validaciones manuales.
- Actualizar README o docs si cambia la ejecucion.
- Registrar pendientes y riesgos.
