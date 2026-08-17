# Plan de Refactorización - PartidoYa

## FASE 1 — Seguridad y Transaccionalidad (Impacto ALTO, bajo riesgo de regresión)

- [ ] **1.1** Auth: Transacción limpia en registro — Reemplazar `flush()` + `rollback()` manual por try/except con rollback centralizado. Dejar de mutar el DTO del password. | `auth_service.py`
- [ ] **1.2** Auth: Email asíncrono en registro — Envolver `send_confirmation_email` en `BackgroundTasks`. Quitar el rollback que depende del resultado del email. | `auth_service.py`
- [ ] **1.3** Auth: Rate limiting en reenvío de código — Agregar cooldown/timestamp en `reenviar_codigo` para mitigar Email Bombing. | `auth_service.py`
- [ ] **1.4** Auth: Login seguro — Mover `rol` e `id` al payload del JWT en vez de retornarlos en JSON plano. Actualizar `get_current_user` para extraerlos del token. | `auth_service.py`, `core/security.py`, `core/dependencies.py`

**Checkpoint**: `pytest backend/tests/test_auth.py` + `pytest backend/tests/test_partidos.py`

---

## FASE 2 — Separación de Responsabilidades en Partidos (Impacto ALTO, refactoring estructural)

- [ ] **2.1** Extraer `reserva_admin_service.py` — Mover funciones de Dueño de Cancha (`crear_reserva_manual`, `crear_bloqueo_turno`, `eliminar_bloqueo_turno`, `cancelar_reserva_dueno`, `reprogramar_reserva` + helpers compartidos). Actualizar `routers/reservas.py`. | Nuevo: `reserva_admin_service.py`, Edit: `partido_service.py`, `routers/reservas.py`
- [ ] **2.2** Consolidar queries en `obtener_mis_partidos` — Unificar las dos queries en una sola consulta con `or_()`. | `partido_repository.py`, `partido_service.py`
- [ ] **2.3** Deduplicar verificación de solapamiento — Extraer la lógica de overlap compartida entre `crear_partido` y `crear_reserva_manual` a una función privada. | `partido_service.py`, `reserva_admin_service.py`

**Checkpoint**: `pytest backend/tests/test_partidos.py` + `pytest backend/tests/test_reservas.py`

---

## FASE 3 — Performance: Resolución de N+1 (Impacto ALTO en producción)

- [ ] **3.1** N+1 en `estadisticas_jugador_por_torneo` — Reemplazar el `for` con query individual por un `JOIN` con `joinedload`. | `partido_torneo_service.py`
- [ ] **3.2** N+1 en `obtener_estadisticas_torneo` — Cargar `usuario` y `equipo` eagerly via `selectinload()`. | `partido_torneo_service.py`
- [ ] **3.3** N+1 en `top_jugadores_por_goles/amarillas/rojas` — `selectinload` + consolidar las 3 funciones en una parametrizada `_top_jugadores(db, torneo_id, campo_stat, limit)`. | `partido_torneo_service.py`
- [ ] **3.4** N+1 en `tabla_posiciones_torneo` — Consulta por equipo para resolver grupo: mover a una sola query con `selectinload`. | `partido_torneo_service.py`
- [ ] **3.5** Índices de agenda — Crear índices en columnas `fecha`, `estado` en `partidos` y `reservas`. | Modelos o migración

**Checkpoint**: `pytest backend/tests/test_torneos.py` + `pytest backend/tests/test_partidos.py`

---

## FASE 4 — Calidad de Código en Torneos y Fixture (Impacto MEDIO)

- [ ] **4.1** Filtrado SQL en `listar_torneos_abiertos` — Bajar el filtrado de cupos/fechas de Python a SQL. | `torneo_service.py`, `torneo_repository.py`
- [ ] **4.2** Repositorio en `inscribir_equipo` — Eliminar acceso directo a `Usuario`, usar `usuario_repository`. | `torneo_service.py`, `usuario_repository.py`
- [ ] **4.3** Validaciones de `TorneoCreate` — Extraer validaciones del `@model_validator` a funciones unitarias. | `torneo_schemas.py`
- [ ] **4.4** Fixture: Strategy explícita — Eliminar `fixture_service.py` (wrapper anémico) e inyectar generador directamente. | `fixture_service.py`, `torneo_service.py`
- [ ] **4.5** Extraer `calcular_resultados_finales` — Mover a módulo independiente `torneo_resultados.py`. | Nuevo: `torneo_resultados.py`, Edit: `partido_torneo_service.py`

**Checkpoint**: `pytest backend/tests/test_torneos.py`

---

## FASE 5 — Patrones y Mejoras Transversales (Impacto MEDIO)

- [ ] **5.1** State Machine para `EstadoTorneo` — Transiciones válidas centralizadas (abierto → en_curso → finalizado / cancelado). | `torneo_model.py`, `torneo_service.py`
- [ ] **5.2** DI para notificaciones — Inyectar notificador como dependencia en vez de importarlo directamente. | `dependencies.py`, `routers/*.py`, services
- [ ] **5.3** Depends para validación de roles — Mover `_verificar_rol_admin` a un `Depends` a nivel router. | `routers/canchas.py`, `routers/reservas.py`, `core/dependencies.py`
- [ ] **5.4** Cancha: Validación de horarios granular — Evaluar si la reserva es del día/horario afectado, no solo `tiene_reservas_activas_futuras()`. | `cancha_service.py`
- [ ] **5.5** AgendaBuilder: Paginación — Limitar slots generados para canchas con rango 24h. | `agenda_builder.py`, `cancha_service.py`

**Checkpoint**: Suite completa `pytest`
