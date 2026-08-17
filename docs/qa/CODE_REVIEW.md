# Code Review y Oportunidades de Mejora (PartidoYa)

### Plantilla Base: Code Review y Oportunidades de Mejora
Por cada módulo del bloque auditado, la estructura será:
- **Módulo: [Nombre del Módulo/Dominio]**
  - **Archivos Clave Analizados:** Rutas de los controladores, servicios o componentes.
  - **Hallazgos (Code Smells & Anti-patrones):** Prácticas dudosas, código acoplado, lógica de negocio filtrada a controladores, etc.
  - **Oportunidades de Refactorización y Arquitectura:** Mejoras a nivel estructural, tipado y legibilidad.
  - **Mejoras de Rendimiento / Seguridad:** Consultas N+1, exposición de datos sensibles, renders innecesarios.

---

## Bloque 1 - Sprints 1 y 2

### Módulo: Autenticación y Usuarios (US 1, 2, 3)
- **Archivos Clave Analizados:** `routers/auth.py`, `routers/users.py`, `services/auth_service.py`, `services/user_service.py`
- **Hallazgos:**
  - [⏳ PENDIENTE] `auth_service.py` - Registro: La gestión transaccional es un poco precaria. Se hace `db.add()`, luego `db.flush()`, y si falla el email, un `db.rollback()`. Aunque funciona, es propenso a errores. El hashing de password mutando el diccionario del DTO (Pydantic model) (`usuario_dict["password"] = get_password_hash(...)`) es funcional pero ensucia los datos originales.
  - [⏳ PENDIENTE] `auth_service.py` - Login: Retorna directamente en JSON el `rol` del usuario y su `id`. Idealmente, esto podría ir en la respuesta estándar o dentro del JWT de forma que el cliente no deba almacenarlo en variables separadas no encriptadas.
- **Oportunidades de Refactorización:**
  - [⏳ PENDIENTE] Extraer la lógica transaccional de correo a tareas asíncronas (`BackgroundTasks` de FastAPI), como ya se hace en otros módulos (Ej: `partido_notificador`), en lugar de bloquear el request de registro esperando al SMTP.
- **Mejoras de Seguridad:**
  - [⏳ PENDIENTE] El endpoint de reenvío de código no valida límite de peticiones (Rate Limiting). Puede ser usado para ataques de denegación de servicio a nuestro servidor de correos (Email Bombing).

### Módulo: Canchas (US 4, 5, 6)
- **Archivos Clave Analizados:** `routers/canchas.py`, `services/cancha_service.py`
- **Hallazgos:**
  - En `cancha_service.py` existen varias funciones auxiliares (`_verificar_rol_admin`, `_obtener_cancha_existente`) que están repetidas a lo largo de las distintas operaciones. Esto es un acierto para evitar duplicidad de código.
  - [⏳ PENDIENTE] Sin embargo, la lógica de validación de que los "horarios de la cancha no pueden cambiar si hay reservas" no contempla detalladamente *cuándo* son esas reservas. Solo evalúa `tiene_reservas_activas_futuras()`. Si hay una reserva el Viernes, y el dueño cambia el horario del Lunes, igual se bloquea la edición.
- **Oportunidades de Refactorización:**
  - [⏳ PENDIENTE] Se podría usar FastAPI `Depends` para inyectar validaciones de roles directamente a nivel router en lugar de llamarlos proceduralmente en la capa de servicios (`_verificar_rol_admin`).
- **Mejoras de Rendimiento:**
  - [⏳ PENDIENTE] La generación de agendas vacías en `obtener_turnos_disponibles` usando `AgendaBuilder` calcula franjas horarias al vuelo. Si la cancha tiene un rango operativo de 24 hs, genera muchos slots en memoria. Se debería asegurar que se pagine o cachee esta lógica.

### Módulo: Partidos (US 8, 9)
- **Archivos Clave Analizados:** `routers/partidos.py`, `services/partido_service.py`
- **Hallazgos:**
  - [⏳ PENDIENTE] `partido_service.py` tiene demasiadas responsabilidades (358 líneas). Contiene lógica para consultar partidos, inscribir usuarios, desinscribir, crear reservas y manejar acciones del dueño de la cancha.
  - Hay un uso acertado de `BackgroundTasks` para el envío de notificaciones asíncronas.
  - [✅ RESUELTO] En `_validar_fecha_futura`, el chequeo temporal usa `datetime.now(TZ_LOCAL).replace(tzinfo=None)`. Trabajar con datetimes *naive* (sin tz) al compararlos suele ser foco de bugs por desajustes horarios entre servidores. Deberían mantenerse con tz (*timezone aware*).
- **Oportunidades de Refactorización:**
  - [⏳ PENDIENTE] Romper `partido_service.py` en: `partido_jugador_service.py` y `reserva_admin_service.py` para separar los flujos del cliente C2C de la gestión B2C (Dueños de cancha).
- **Mejoras de Rendimiento:**
  - [⏳ PENDIENTE] En `obtener_mis_partidos`, se hacen dos queries separadas: `obtener_organizados_por_usuario` y `obtener_inscritos_por_usuario`. Esto podría consolidarse en una sola query optimizada desde el backend usando un `OR` para reducir viajes a la BD, o resolverse con GraphQL.

---

## Bloque 2 (Sprints 3 y 4) - Hallazgos Técnicos

### [✅ RESUELTO] Vulnerabilidad Crítica: Inscripción a partidos pasados (US 10)
- **Archivo:** `backend/app/models/partido_model.py` (método `inscribir_jugador`) y `partido_service.py` (`inscribirse_a_partido`).
- **Problema:** No existe validación de fecha y hora actual vs fecha del partido al momento de que un usuario hace POST a `/partidos/{id}/jugadores`.
- **Riesgo (Alto):** Los usuarios podrían inscribirse y descontar cupos a partidos que ocurrieron hace semanas o meses.

### [✅ RESUELTO] Vulnerabilidad Crítica: Cancelación de reservas pasadas (US 26)
- **Archivo:** `backend/app/services/partido_service.py` (método `cancelar_reserva_dueno`).
- **Problema:** El dueño de la cancha puede cancelar una reserva que ya sucedió porque no se llama a `_validar_fecha_futura`.
- **Riesgo (Medio/Alto):** Permite alterar el registro histórico de reservas de la cancha y corromper estadísticas y agendas pasadas.

### Archivos Analizados (Bloque 2)
- `backend/app/models/partido_model.py`
- `backend/app/services/partido_service.py`
- `backend/app/routers/partidos.py`
- `backend/app/routers/reservas.py`

### Hallazgos de Código (Code Smells)
- [⏳ PENDIENTE] **God Object:** El archivo `partido_service.py` está creciendo demasiado. Actualmente maneja la lógica de partidos (C2C), reservas manuales de dueños (B2B) y notificaciones de forma acoplada.
- [⏳ PENDIENTE] **Duplicación Lógica:** Hay duplicación en la verificación de solapamiento de horarios entre la creación de partidos y las reservas manuales.

### Oportunidades de Refactorización
- [⏳ PENDIENTE] Separar `partido_service.py` extrayendo la lógica de dueños de cancha hacia un `reserva_admin_service.py`.
- [⏳ PENDIENTE] Utilizar Inyección de Dependencias para el servicio de notificaciones en lugar de importar y llamar a los métodos directamente.

### Mejoras de Rendimiento
- [⏳ PENDIENTE] **Índices de Búsqueda:** La búsqueda de disponibilidad de agenda (`canchas/{id}/agenda`) se realiza iterando sobre todos los partidos y reservas futuras. Para un sistema con alta concurrencia, debería delegarse este filtrado a la base de datos (con índices en las columnas de fechas y estado).

---

## Bloque 3 (Sprint 5) - Hallazgos Técnicos

### [✅ RESUELTO] Vulnerabilidad Crítica: Inscripción a torneos vencidos (US 15)
- **Archivo:** `backend/app/services/torneo_service.py` (método `inscribir_equipo`).
- **Problema:** Un torneo creado pero nunca iniciado (sin fixture generado) permanece eternamente en estado `abierto`. El método `inscribir_equipo` solo valida que esté abierto, pero NO valida si la fecha de inicio (`fecha_inicio`) ya pasó.
- **Riesgo (Alto):** Equipos podrían inscribirse a un torneo cuya fecha ya caducó.

### [✅ RESUELTO] Vulnerabilidad Crítica: Torneos fantasma en el listado público (US 16)
- **Archivo:** `backend/app/services/torneo_service.py` (método `listar_torneos_abiertos`).
- **Problema:** El método devuelve todos los torneos `abierto` con cupos, sin filtrar aquellos donde `fecha_inicio` ya pasó.
- **Riesgo (Medio):** Los usuarios verán torneos 'fantasmas' vencidos al buscar competencias disponibles en la plataforma.

### Archivos Analizados (Bloque 3)
- `backend/app/models/torneo_model.py`
- `backend/app/services/torneo_service.py`
- `backend/app/routers/torneos.py`
- `backend/app/schemas/torneo_schemas.py`

### Hallazgos de Código (Code Smells)
- [⏳ PENDIENTE] **Complex Validation:** El esquema `TorneoCreate` contiene validaciones condicionales excesivamente anidadas y largas dentro del `@model_validator`.
- [⏳ PENDIENTE] **Fuga de Responsabilidad:** `inscribir_equipo` accede directamente a consultas SQL (vía SQLAlchemy) para validar los emails de los jugadores, puenteando el repositorio de usuarios.

### Oportunidades de Refactorización
- [⏳ PENDIENTE] **State Machine:** Implementar un patrón State Machine para gestionar la propiedad `EstadoTorneo` (Abierto -> En curso -> Finalizado / Cancelado) en lugar de utilizar cheques manuales (`if torneo.estado == ...`).
- [⏳ PENDIENTE] Extraer las validaciones complejas de `TorneoCreate` hacia funciones validadoras unitarias para mejorar su legibilidad y testeabilidad aislada.

### Mejoras de Rendimiento
- [⏳ PENDIENTE] **Filtrado en Memoria (N+1 Risk):** El método `listar_torneos_abiertos` recupera TODOS los torneos abiertos de la base de datos y luego realiza el filtrado de cupos y fechas iterando la lista en memoria de Python. Esto debe bajarse a una consulta SQL eficiente filtrando directamente a nivel base de datos (`WHERE inscriptos < max_equipos AND fecha_inicio >= NOW()`).

### [✅ RESUELTO] Vulnerabilidad Crítica: Error 500 en serialización de validaciones (US 14)
- **Archivo:** `backend/app/main.py` (Manejador de Excepciones).
- **Problema:** Pydantic v2 lanza `ValueError` internamente que no era serializable en JSON, provocando Status 500 en la API en vez de 422.
- **Riesgo (Alto):** Caídas del servidor al procesar datos inválidos por parte del cliente.

---

## Bloque 4 (Sprint 6) - Hallazgos Técnicos

### Archivos Analizados (Bloque 4)
- `backend/app/services/fixture/fixture_service.py` (y sus generadores)
- `backend/app/services/partido_torneo_service.py`
- `backend/app/routers/torneos.py`

### [✅ RESUELTO] Vulnerabilidad Crítica: Carga de resultados en partidos sin programar (US 19)
- **Archivo:** `backend/app/services/partido_torneo_service.py` (Manejo de Resultados).
- **Problema:** No se verificaba si el partido tenía fecha asignada antes de compararla, provocando un error `TypeError` con `NoneType` al evaluar `partido.fecha > hoy`.
- **Riesgo (Crítico):** Caída de la API (HTTP 500) al consultar un endpoint válido.
- **Solución:** Inyectada guarda de validación `if not partido.fecha:` para retornar HTTP 400.

### [✅ RESUELTO] Vulnerabilidad Funcional: Programación de partidos en el pasado (US 21)
- **Archivo:** `backend/app/services/partido_torneo_service.py` (Programación de partidos).
- **Problema:** El endpoint de programar permitía ingresar fechas anteriores a la actual sin restricción.
- **Riesgo (Alto):** Generación de historial corrupto e inconsistente en los calendarios.
- **Solución:** Se implementó `_validar_fecha_futura` para restringir la agenda a futuro.

### Hallazgos de Código (Code Smells)
- [⏳ PENDIENTE] **Servicio Anémico:** `fixture_service.py` actúa únicamente como un pasamanos (wrapper) hacia un Factory, no aportando valor de negocio propio a la capa de servicios.
- [⏳ PENDIENTE] **God Function / Fuga de Lógica:** El método `calcular_resultados_finales` en `partido_torneo_service.py` está manejando lógicas que exceden la responsabilidad del servicio, consultando y procesando modelos de DB para armar reportes.
- [⏳ PENDIENTE] **Falta de DTOs en Lógica Interna:** Múltiples funciones están usando diccionarios "crudos" y diccionarios anidados de Python (como `defaultdict`) en vez de esquemas intermedios, aumentando la probabilidad de KeyError.

### Oportunidades de Refactorización
- [⏳ PENDIENTE] **Patrón Strategy explícito:** En lugar de ocultar la resolución en `FixtureFactory`, inyectar la estrategia (Generator) específica al servicio basado en el formato, mejorando la inyección de dependencias.
- [⏳ PENDIENTE] **Extracción de Cálculo de Torneo:** Extraer `calcular_resultados_finales` a una clase de Dominio independiente que se encargue exclusivamente del análisis de campeonatos.

### Mejoras de Rendimiento
- [⏳ PENDIENTE] **N+1 en Estadísticas de Jugador:** El método `estadisticas_jugador_por_torneo` consulta los registros y luego, *dentro* de un bucle `for`, realiza una query a `PartidoTorneo` por cada registro. Esto disparará decenas de consultas SQL en lugar de resolverlo mediante un único JOIN (Ej. `joinedload`).
