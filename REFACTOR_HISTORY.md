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
