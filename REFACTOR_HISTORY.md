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
**Estado:** 🔄 En Proceso (Auditoría Inicial)

**Hallazgos de Auditoría:**
* **Tipado Débil (Frontend y Pydantic):** Ausencia de tipado en React para mapeos gráficos (`item: any`), y fechas enviadas como `str` en lugar de `date` en Pydantic limitando la validación ISO de FastAPI.
* **CPU-Bound Loop Ineficiente:** El cálculo de tasa de ocupación itera sobre cada día y cada cancha recalculando reglas estáticas de apertura/cierre (complejidad O(Días * Canchas)), bloqueando el event loop de Python con peticiones largas.
* **God Component de Gráficos:** El archivo `estadisticas/page.tsx` (casi 500 líneas) incluye todos los dropdowns y 5 gráficos masivos de Recharts sin modularizar, forzando un redibujado costoso.
* **Bomba de Tiempo (ReferenceError):** Fallo de renderizado asíncrono con la variable `loading` (indefinida) en lugar del hook `isLoading` (Línea 125).

**Plan de Acción (Definition of Done):**
1. 🔄 **Desacoplar el Dashboard (Dumb Components):** Extraer los gráficos de Recharts hacia subcomponentes independientes (`KpiCards`, `EvolucionChart`, etc.) para aislar los re-renders.
2. 🔄 **Memoización Estricta (useMemo):** Envolver transformaciones de datos costosas (como `combinedData` y mapeos de fecha) en `useMemo`.
3. 🔄 **Tipado Estricto (TypeScript y Pydantic):** Eliminar los `any` del frontend definiendo interfaces completas, y cambiar los esquemas de Pydantic a `datetime.date`.
4. 🔄 **Optimización del Algoritmo de Ocupación:** Pre-calcular o memorizar el patrón de turnos (`_calcular_turnos_por_dia`) en el Backend para evitar loops O(N) pesados y liberar CPU.
5. 🔄 **Corrección de Bugs Críticos:** Arreglar el error de sintaxis del `loading` que genera pantallas blancas.
