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
**Estado:** 🔄 En Proceso (Auditoría Inicial)

**Hallazgos de Auditoría:**
* **Filtración de Datos (Equipos):** El esquema de respuesta de equipos expone correos y roles de todos los integrantes.
* **Ineficiencia de DB (N+1):** El conteo de cupos restantes en torneos dispara subconsultas SQL masivas por cada torneo renderizado.
* **God Components:** Los archivos de la interfaz gráfica de Torneos están masivamente acoplados (hasta 30 KB en un solo archivo), mezclando fetchers, filtros y renderizado de fixtures.

**Plan de Acción (Definition of Done):**
1. **Sellar Fuga de Privacidad:** Modificar `EquipoDetalleResponse` para exponer un `JugadorPublicoRespuesta`.
2. **Erradicar el N+1:** Implementar Eager Loading (`joinedload`) en el repositorio de Torneos.
3. **Desacoplar "God Components":** Extraer lógica hacia subcomponentes independientes (Tabs, Headers).
4. **Optimizar Renders (Frontend):** Implementar `useMemo` en cálculos pesados de rondas y fixtures.
5. **Estandarizar Fetching:** Emplear React Query y sincronizar el estado de los filtros a la URL.
