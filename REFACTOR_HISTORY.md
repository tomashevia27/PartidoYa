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

**Hallazgos de Auditoría:**
* **Filtración de Datos:** El esquema de respuesta de los partidos expone correos electrónicos y roles de todos los jugadores inscritos.
* **Ineficiencia de DB (N+1):** SQLAlchemy ejecuta múltiples subconsultas innecesarias al traer las relaciones de los partidos disponibles.
* **Anti-patrones React/Next.js:** Uso ineficiente de estado local (`useState`) para filtros, impidiendo su uso en URLs, y carga duplicada de estado global (`useProfile`) mediante `useEffect`.

**Plan de Acción (Definition of Done):**
1. **Privacidad de Datos (Backend):** Crear y aplicar el esquema `JugadorPublicoRespuesta` para omitir datos sensibles (email).
2. **Mitigar Consultas N+1 (Backend):** Inyectar Eager Loading (`joinedload`) en el repositorio para relaciones de Cancha, Organizador y Jugadores.
3. **Refactorizar Fetching del Perfil (Frontend):** Sustituir el `useEffect` de carga de perfil por el hook existente `useProfile()` en el catálogo.
4. **Optimización con `useMemo` (Frontend):** Prevenir renders costosos envolviendo la lógica de agrupación de fechas (`partidosPorFecha`).
5. **Sincronización de Filtros en URL (Frontend):** Migrar el estado de filtros a `useSearchParams` para habilitar enlaces dinámicos y compartibles.
