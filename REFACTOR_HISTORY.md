# 📖 Bitácora de Auditoría y Refactorización

Este documento mantiene el historial y progreso de las mejoras arquitectónicas, de seguridad y rendimiento implementadas en el proyecto.

## Slice 1: Autenticación y Gestión de Usuarios
**Estado:** ✅ Completado

**Resumen de Mejoras:**
1. **Seguridad Crítica:** Implementación de hashing de contraseñas con `bcrypt` (mitigando desbordamiento de 72 bytes).
2. **Arquitectura Frontend:** Extracción de la lógica de negocio a un Custom Hook (`useRegister.ts`) con React Query.
3. **Compatibilidad Next.js:** Refactorización de `useSearchParams` en el Login, encapsulado en boundaries de `<Suspense>` para proteger el SSR.
4. **Segregación de Interfaces (SOLID):** Tipado estricto en TypeScript separando `RegisterPayload` y `UpdateProfilePayload` para evitar fugas de datos.
5. **Resiliencia de Datos:** Implementación de Mock de emails para desarrollo y rollbacks transaccionales de DB para evitar estados inconsistentes (usuarios fantasma).

---

## Slice 2: Core de Reservas y Partidos
**Estado:** ✅ Completado

**Resumen de Mejoras:**
1. **Escudo de Privacidad (Pydantic):** Implementación de `JugadorPublicoRespuesta` para omitir datos sensibles (email, rol, passwords) en el listado público de partidos.
2. **Mitigación N+1 (SQLAlchemy):** Uso exhaustivo de `joinedload()` en repositorios para cargar relaciones complejas en una única consulta SQL (Eager Loading).
3. **Filtros por URL (Next.js):** Sincronización bidireccional del estado de búsqueda con `useSearchParams` y límites lógicos mediante `<Suspense>`.
4. **Optimización UI (React):** Memoización con `useMemo` del algoritmo de agrupación de partidos para prevenir micro-retrasos en renders no intencionales.
5. **Seguridad Transaccional:** Validación del bloqueo pesimista (`with_for_update`) al procesar inscripciones.

---

## Slice 3: Core de Torneos y Sistema de Equipos
**Estado:** ✅ Completado

**Resumen de Mejoras:**
1. **Sellar Fuga de Privacidad:** Modificación de `EquipoDetalleResponse` para exponer un `JugadorPublicoRespuesta` en lugar de datos sensibles.
2. **Erradicar el N+1:** Implementación de Eager Loading (`joinedload`) en el repositorio de Torneos para cargar relaciones (equipos, creadores) eficientemente.
3. **Desacoplar "God Components":** Descomposición de la vista masiva de Torneos en subcomponentes modulares e independientes (`FixtureTab`, `EquiposTab`, `InformacionTab`, `TorneoHeader`).
4. **Optimizar Renders y Estabilidad (Frontend):** Implementación de `useMemo` en cálculos pesados de agrupamientos de fixtures, y corrección crítica de "race conditions" al regenerar el fixture, asegurando que la UI no colapse por errores transitorios de la caché.
5. **Estandarizar Fetching (React Query):** Eliminación de fetchers manuales con `useEffect` (ej: `getFixturePorFechas` y `getBracketTorneo`) reemplazándolos completamente por hooks de TanStack Query. Migración del estado de los filtros del catálogo de torneos a URLs compartibles con `useSearchParams`.

---

## Slice 4: Administración de Canchas y Agenda
**Estado:** ✅ Completado

**Resumen de Mejoras:**
1. **Unificar Validación en Pydantic (Edge Validation):** Se movió la validación de horas a un `@model_validator` en `CanchaBase`.
2. **Optimizar Algoritmo de Agenda (O(N)):** Se refactorizó `AgendaBuilder` implementando un Hash Map O(1) para inyectar partidos, previniendo ineficiencias O(N*M).
3. **Erradicar el Over-Fetching (DB):** (Falso Positivo) Se auditó el repositorio y se comprobó que `obtener_partidos_por_cancha_y_fecha` ya estaba optimizada sin N+1.
4. **Desacoplar el "God Component":** Se descompuso `canchas/page.tsx` en `CanchasHero`, `CanchasFiltros` y `CanchasList`.
5. **Migrar Filtros a URL y Memoizar:** Se implementó el patrón de arquitectura **Smart/Dumb Components**. El orquestador `canchas/page.tsx` maneja el estado local inicializado desde la URL, memoiza el filtrado con `useMemo`, e implementa `window.history.replaceState` en un `useEffect`. Esto garantiza el Deep Linking (SSR-friendly) mientras evade completamente los bugs de asincronía y Router Cache de Next.js. `CanchasFiltros` fue refactorizado a un componente presentacional puro.

---

## Slice 5: Estadísticas y Dashboard
**Estado:** ✅ Completado

**Resumen de Mejoras:**
1. **Desacoplar el Dashboard (Dumb Components):** Se extrajeron los gráficos de Recharts hacia subcomponentes modulares e independientes (`KpiCards`, `EvolucionChart`, `MapaCalorChart`, etc.) reduciendo el "God Component" en un 60%.
2. **Memoización Estricta (useMemo):** Se envolvió la transformación de datos costosa (`combinedData`) en un `useMemo` para evitar re-renders por cálculos O(N) pesados en el frontend.
3. **Tipado Estricto (TypeScript y Pydantic):** Se erradicó el uso de `any` creando e implementando interfaces DTO puras, y se migró el tipo de las fechas de `str` a `datetime.date` en Pydantic.
4. **Optimización del Algoritmo de Ocupación (Backend):** Se refactorizó la lógica en Python implementando `_obtener_patron_semanal_turnos()` que permite acceso O(1) con diccionarios precalculados, erradicando loops anidados CPU-bound intensivos.
5. **Corrección de Bugs Críticos:** Se corrigió un error de estado (`loading` vs `isLoading`) que producía ReferenceErrors asíncronos y bloqueaba el primer renderizado de la UI en situaciones críticas.

---

## Slice 6: Sistema de Notificaciones (Alertas)
**Estado:** ✅ Completado

**Hallazgos de Auditoría:**
* **Contratos Débiles (Tipado Abierto):** En Pydantic (`notificacion_schemas.py`), el tipo de alerta viaja como un `str` genérico. El frontend mapea los íconos de la campanita haciendo un `switch` con strings quemados, lo que expone al sistema a fallos silenciosos por errores de tipeo o desajustes entre front y back.
* **Cuello de Botella Síncrono:** La generación de notificaciones (`crear_notificaciones_bulk`) bloquea el hilo principal de los requests. Ej: si se cancela un torneo, el servidor detiene la respuesta HTTP al organizador hasta terminar de escribir todas las alertas de los jugadores en la DB.
* **Polling Manual Anti-Patrón:** El frontend utiliza un `setInterval` manual acoplado a un `useState` local en `useNotifications`. Esto puede causar desincronización entre múltiples pestañas, duplicidad de peticiones e incapacidad de limpiar la caché eficientemente.

**Plan de Acción (Ejecutado):**
1. ✅ **Tipado Literal Defensivo (Contratos):** Restringir el tipo `str` en Pydantic y TypeScript a tipos Literales estrictos (Enum) garantizando integridad de eventos.
2. ✅ **Delegación Asíncrona (BackgroundTasks):** Envolver los servicios de inyección de alertas en `BackgroundTasks` de FastAPI, liberando la respuesta HTTP de manera inmediata.
3. ✅ **Estandarización a React Query (Polling):** Erradicar el `setInterval` manual migrando la campanita de notificaciones a un `useQuery` nativo con `refetchInterval` para sincronización multi-pestaña.
4. ✅ **Actualizaciones Optimistas (useMutation):** Migrar acciones de "marcar como leído" o "eliminar" a mutations de TanStack Query para que la UI reaccione instantáneamente sin esperar al servidor.
5. ✅ **Auditoría de Índices SQL:** Comprobar que la BD consulte mediante un índice compuesto `(usuario_id, leida)` optimizado para lectura intensa O(log N).
