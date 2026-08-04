"use client"

import { fetchApi, API_URL, getAccessToken, ApiError } from "@/lib/api-client";
import { CanchaArraySchema, PartidoArraySchema, TorneoArraySchema, TorneoSchema, CanchaSchema, PartidoSchema, MisPartidosSchema } from "@/lib/schemas";
import { z } from "zod";
import { getErrorMessage } from "@/lib/api-client"
export { API_URL, getAccessToken }
export type CanchaData = z.infer<typeof CanchaSchema>;
export type PartidoData = z.infer<typeof PartidoSchema>;
export type TorneoData = z.infer<typeof TorneoSchema>;
export type { MisPartidosData } from "@/lib/schemas";
const CLOUD_NAME = "dzsrgcgq6"
const UPLOAD_PRESET = "PartidoYa_preset"

export interface UserData {
  nombre: string
  apellido: string
  email?: string
  password?: string
  edad: number
  genero: string
  zona: string
  rol: string
  foto_perfil?: string
}

export interface UserProfile extends UserData {
  id: number
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error("Error al subir la imagen a Cloudinary")
  }

  const data = await response.json()
  return data.secure_url
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ usuario_id: number; rol: string; access_token: string; token_type: string }> {
  try {
    return await fetchApi(`/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if ((error as ApiError).data?.detail && Array.isArray((error as ApiError).data?.detail)) {
      throw new Error("Por favor, ingresá un formato de email válido.")
    }
    throw new Error(getErrorMessage(error) || "Error al iniciar sesión");
  }
}

export async function registerUser(userData: UserData): Promise<UserProfile> {
  try {
    return await fetchApi(`/registro`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    if ((error as ApiError).data?.detail && Array.isArray((error as ApiError).data?.detail)) {
      const messages = (error as ApiError).data?.detail.map((err: { loc: string[] }) => {
        const campo = err.loc[err.loc.length - 1]
        switch (campo) {
          case "nombre": return "• El nombre no puede estar vacío."
          case "apellido": return "• El apellido no puede estar vacío."
          case "password": return "• La contraseña debe tener como mínimo 8 caracteres."
          case "email": return "• El email ingresado no es válido."
          case "edad": return "• La edad debe ser un número válido."
          case "genero": return "• Tenés que seleccionar una opción de género."
          case "zona": return "• La zona de juego no puede estar vacía."
          case "rol": return "• Debe seleccionarse un rol."
          default: return `• Por favor, revisá el campo: ${campo}.`
        }
      })
      throw new Error("Revisá los datos ingresados:\n" + messages.join("\n"))
    }
    throw new Error(getErrorMessage(error) || "Error al registrarse");
  }
}

export async function getUserProfile(): Promise<UserProfile> {
    try {
        return await fetchApi(`/usuarios/me`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar el perfil");
      }
}


export async function confirmEmail(email: string, code: string): Promise<{ mensaje: string }> {
    try {
        return await fetchApi(`/confirmar-email`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al confirmar email");
      }
}

export async function resendCode(email: string): Promise<{ mensaje: string }> {
    try {
        return await fetchApi(`/reenviar-codigo`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al reenviar código");
      }
}

export async function updateUserProfile(
  userData: Partial<UserData>
): Promise<UserProfile> {
    try {
        return await fetchApi(`/usuarios/me`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al actualizar el perfil");
      }
}



export async function crearCancha(canchaData: Omit<CanchaData, "id">) {
    try {
        return await fetchApi(`/canchas`, {
        method: "POST",
        body: JSON.stringify(canchaData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

export async function actualizarCancha(canchaId: number | string, canchaData: Partial<CanchaData>) {
    try {
        return await fetchApi(`/canchas/${canchaId}`, {
        method: "PUT",
        body: JSON.stringify(canchaData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

export async function eliminarCancha(canchaId: number | string) {
    try {
        return await fetchApi(`/canchas/${canchaId}`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al eliminar la cancha");
      }
}

export interface PartidoCreateData {
  cancha_id: number;
  fecha: string;
  horario: string;
  tipo: string;
  descripcion?: string;
  cupos_disponibles?: number;
}



export async function getMisPartidos(): Promise<import("@/lib/schemas").MisPartidosData> {
    try {
        return await fetchApi(`/partidos/mis-partidos`, {}, MisPartidosSchema);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar partidos");
      }
}

export async function getMisCanchas(): Promise<CanchaData[]> {
    try {
        return await fetchApi(`/canchas/me`, {}, CanchaArraySchema);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar mis canchas");
      }
}

export async function getCanchas(): Promise<CanchaData[]> {
    try {
        return await fetchApi(`/canchas`, {}, CanchaArraySchema);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar las canchas");
      }
}

export async function getCancha(canchaId: string | number): Promise<CanchaData> {
    try {
        return await fetchApi(`/canchas/${canchaId}`, {}, CanchaSchema);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar la cancha");
      }
}

export async function getPartido(partidoId: string | number): Promise<PartidoData> {
    try {
        return await fetchApi(`/partidos/${partidoId}`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar el partido");
      }
}

export async function crearPartido(partidoData: PartidoCreateData): Promise<PartidoData> {
    try {
        return await fetchApi(`/partidos`, {
        method: "POST",
        body: JSON.stringify(partidoData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

export async function cancelarPartido(partidoId: string | number): Promise<PartidoData> {
    try {
        return await fetchApi(`/partidos/${partidoId}/cancelar`, {
        method: "PATCH"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cancelar el partido");
      }
}

export async function inscribirseAPartido(
  partidoId: string | number
): Promise<PartidoData> {
    try {
        return await fetchApi(`/partidos/${partidoId}/inscribirse`, {
        method: "POST"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al inscribirse al partido");
      }
}

export async function bajarseDePartido(partidoId: string | number): Promise<PartidoData> {
    try {
        return await fetchApi(`/partidos/${partidoId}/bajarse`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al darse de baja del partido");
      }
}

export async function editarPartido(partidoId: string | number, partidoData: PartidoCreateData): Promise<PartidoData> {
    try {
        return await fetchApi(`/partidos/${partidoId}`, {
        method: "PUT",
        body: JSON.stringify(partidoData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

// ─────────────────────────────────────────────
// US 7: Ver partidos disponibles
// ─────────────────────────────────────────────

export interface PartidoDisponibleFilters {
  zona?: string;
  modalidad?: string;
  fecha?: string;
}

export async function getPartidosDisponibles(filters?: PartidoDisponibleFilters): Promise<PartidoData[]> {
  const params = new URLSearchParams()
  if (filters?.zona) params.set("zona", filters.zona)
  if (filters?.modalidad) params.set("modalidad", filters.modalidad)
  if (filters?.fecha) params.set("fecha", filters.fecha)

  const queryString = params.toString()
  const endpoint = `/partidos/disponibles${queryString ? `?${queryString}` : ""}`

  try {
    return await fetchApi(endpoint);
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Error al cargar partidos disponibles");
  }
}

export interface FiltroOpcion {
  valor: string;
  cantidad: number;
}

export interface FiltrosDisponiblesData {
  zonas: FiltroOpcion[];
  modalidades: FiltroOpcion[];
}

export async function getFiltrosDisponibles(): Promise<FiltrosDisponiblesData> {
    try {
        return await fetchApi(`/partidos/filtros`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar opciones de filtros");
      }
}

// ─────────────────────────────────────────────
// Notificaciones internas
// ─────────────────────────────────────────────

export interface NotificacionData {
  id: number;
  tipo: string;
  mensaje: string;
  partido_id?: number | null;
  leida: boolean;
  fecha_creacion: string;
}

export interface NotificacionesListado {
  notificaciones: NotificacionData[];
  total_no_leidas: number;
}

export interface ConteoNoLeidas {
  total_no_leidas: number;
}

export async function getNotificaciones(
  soloNoLeidas: boolean = false,
  limit: number = 50,
  offset: number = 0
): Promise<NotificacionesListado> {
  const params = new URLSearchParams()
  if (soloNoLeidas) params.set("solo_no_leidas", "true")
  params.set("limit", String(limit))
  params.set("offset", String(offset))

  const queryString = params.toString()
  try {
    return await fetchApi(`/notificaciones?${queryString}`);
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Error al cargar notificaciones");
  }
}

export async function getConteoNoLeidas(): Promise<ConteoNoLeidas> {
    try {
        return await fetchApi(`/notificaciones/no-leidas/count`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al obtener conteo de notificaciones");
      }
}

export async function marcarNotificacionLeida(notificacionId: number): Promise<NotificacionData> {
    try {
        return await fetchApi(`/notificaciones/${notificacionId}/leer`, {
        method: "PATCH"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al marcar notificación como leída");
      }
}

export async function marcarTodasLeidas(): Promise<{ mensaje: string }> {
    try {
        return await fetchApi(`/notificaciones/leer-todas`, {
        method: "PATCH"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al marcar notificaciones como leídas");
      }
}

export async function eliminarNotificacion(notificacionId: number): Promise<{ mensaje: string }> {
    try {
        return await fetchApi(`/notificaciones/${notificacionId}`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al eliminar notificación");
      }
}

export async function eliminarTodasNotificaciones(): Promise<{ mensaje: string }> {
    try {
        return await fetchApi(`/notificaciones`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al eliminar notificaciones");
      }
}

// ─────────────────────────────────────────────
// US Sprint 4: Agenda y Reserva Manual
// ─────────────────────────────────────────────

export interface AgendaSlot {
  horario: string
  estado: "disponible" | "ocupado" | "bloqueado"
  partido_id?: number | null
  cliente_nombre?: string | null
  cliente_apellido?: string | null
  cliente_telefono?: string | null
  organizador_nombre?: string | null
  organizador_apellido?: string | null
  es_reserva_manual?: boolean
}

export interface AgendaData {
  cancha: CanchaData & { id: number }
  fecha: string
  slots: AgendaSlot[]
}

export interface TurnoSlot {
  horario: string
  estado: "disponible" | "ocupado" | "bloqueado"
}

export interface TurnosRespuesta {
  cancha_id: number
  fecha: string
  slots: TurnoSlot[]
}

export async function getTurnos(canchaId: number | string, fecha: string, excluirPartidoId?: number): Promise<TurnosRespuesta> {
  let url = `/canchas/${canchaId}/turnos?fecha=${fecha}`
  if (excluirPartidoId !== undefined) {
    url += `&excluir_partido_id=${excluirPartidoId}`
  }
  try {
    return await fetchApi(url);
  } catch (error) {
    throw new Error(getErrorMessage(error) || "Error al cargar los turnos");
  }
}

export async function getAgenda(canchaId: number | string, fecha: string): Promise<AgendaData> {
    try {
        return await fetchApi(`/canchas/${canchaId}/agenda?fecha=${fecha}`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar la agenda");
      }
}

export interface ReservaManualData {
  cancha_id: number
  fecha: string
  horario: string
  cliente_nombre?: string
  cliente_apellido?: string
  cliente_telefono?: string
}

export async function crearReservaManual(reservaData: ReservaManualData): Promise<PartidoData> {
    try {
        return await fetchApi(`/reservas/manual`, {
        method: "POST",
        body: JSON.stringify(reservaData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

export async function bloquearTurno(data: ReservaManualData): Promise<PartidoData> {
    try {
        return await fetchApi(`/reservas/bloquear`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

export async function desbloquearTurno(partidoId: number): Promise<{ mensaje: string }> {
    try {
        return await fetchApi(`/reservas/bloquear/${partidoId}`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al desbloquear el turno");
      }
}

export async function cancelarReservaDueno(partidoId: number): Promise<PartidoData> {
    try {
        return await fetchApi(`/reservas/${partidoId}`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cancelar la reserva");
      }
}

export interface ReprogramarReservaData {
  fecha: string
  horario: string
  cancha_id?: number
}

export async function reprogramarReserva(
  partidoId: number,
  data: ReprogramarReservaData
): Promise<PartidoData> {
    try {
        return await fetchApi(`/reservas/${partidoId}/reprogramar`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
      }
}

// ─────────────────────────────────────────────
// US 5: Torneos 
// ─────────────────────────────────────────────

export interface TorneoCreateData {
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  formato: string
  zona: string
  dias_operativos: number        // bitmask 7 días
  franja_horaria: string        // "HH:MM-HH:MM"
  min_integrantes_por_equipo: number  // 5 | 7 | 9 | 11
  max_equipos: number
  costo_inscripcion: number
  ida_y_vuelta: boolean          // solo todos_contra_todos
  fase_final?: string | null     // "semis" | "cuartos" | "octavos" (fase_grupos)
  descripcion?: string
  reglas?: string
}

export interface JugadorSimple {
  id: number
  nombre: string
  apellido: string
  email?: string
}

export type TorneoUpdateData = Partial<TorneoCreateData>

export interface EquipoInscripto {
  id: number
  nombre?: string
  nombre_equipo?: string
  jugadores: string | JugadorSimple[]
  escudo?: string
}



export async function editarTorneo(torneoId: string | number, torneoData: TorneoUpdateData): Promise<TorneoData> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}`, {
        method: "PATCH",
        body: JSON.stringify(torneoData),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al editar el torneo");
      }
}

export interface TorneoMisActividades {
  id: number
  nombre: string
  fecha_inicio: string
  formato: string
  estado: string
  rol: "Organizador" | "Jugador"
  lugar: string
  costo_inscripcion: number
  max_equipos: number
  equipos_inscriptos: number
}

export interface MisTorneosResponse {
  proximos: TorneoMisActividades[]
  en_curso: TorneoMisActividades[]
  finalizados: TorneoMisActividades[]
  cancelados: TorneoMisActividades[]
}

export interface InscripcionData {
  nombre_equipo: string
  jugadores: string // String JSON stringificado
  escudo?: string
}

const ESTADO_MAP: Record<string, string> = {
  "abierto": "Abierto para inscripción",
  "en_curso": "En curso",
  "finalizado": "Finalizado",
  "cancelado": "Cancelado",
}
const FORMATO_MAP: Record<string, string> = {
  "eliminacion_directa": "Eliminación directa",
  "fase_grupos": "Fase de grupos",
  "fase_grupos_8avos": "Fase de grupos + 8vos",
  "fase_grupos_16avos": "Fase de grupos + 16vos",
  "todos_contra_todos": "Todos contra todos",
}

function normalizarTorneo(t: any): TorneoData {
  const equiposArray = Array.isArray(t.equipos_inscriptos)
    ? t.equipos_inscriptos.map((eq: any) => ({
      id: eq.id,
      nombre_equipo: eq.nombre || eq.nombre_equipo,
      jugadores: eq.jugadores || "[]",
      escudo: eq.escudo
    }))
    : (t.equipos || []);
  const inscriptosCount = Array.isArray(t.equipos_inscriptos) ? t.equipos_inscriptos.length : (t.inscriptos ?? t.equipos_inscriptos ?? 0);

  return {
    ...t,
    estado: ESTADO_MAP[t.estado] ?? t.estado,
    formato: FORMATO_MAP[t.formato] ?? t.formato,
    costo_inscripcion: Number(t.costo_inscripcion ?? 0),
    equipos_inscriptos: inscriptosCount,
    equipos: equiposArray,
    max_equipos: t.max_equipos ?? (inscriptosCount + (t.cupos_restantes || 0)),
    cupos_restantes: t.cupos_restantes ?? (t.max_equipos ? t.max_equipos - inscriptosCount : 0),
  }
}

export async function crearTorneo(data: TorneoCreateData): Promise<TorneoData> {
    try {
        return await fetchApi(`/api/torneos/`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al crear el torneo");
      }
}

export async function getTorneosDisponibles(): Promise<TorneoData[]> {
    try {
        return await fetchApi(`/api/torneos/`, { method: "GET" }, TorneoArraySchema);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar torneos abiertos");
      }
}

export async function getMisTorneos(): Promise<TorneoData[]> {
    try {
        const data = await fetchApi(`/api/torneos/mis-torneos`) as any;
        // The backend returns { proximos: [], en_curso: [], finalizados: [], cancelados: [] }
        // We need to flatten it for the frontend components that expect an array
        const allTorneos = [
            ...(data.proximos || []),
            ...(data.en_curso || []),
            ...(data.finalizados || []),
            ...(data.cancelados || [])
        ].map((t: any) => ({
            ...t,
            rol_usuario: t.rol
        }));
        return TorneoArraySchema.parse(allTorneos);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar los torneos del usuario");
      }
}

export async function getTorneo(id: number): Promise<TorneoData> {
    try {
        return await fetchApi(`/api/torneos/${id}`, { method: "GET" }, TorneoSchema);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Torneo no encontrado");
      }
}

export async function inscribirEquipo(torneoId: number, data: InscripcionData): Promise<any> {
  const jugadoresParseados: { nombre: string; email: string }[] = JSON.parse(data.jugadores)
  const emails = jugadoresParseados.map(j => j.email)

  try {
    return await fetchApi(`/api/torneos/${torneoId}/inscripciones`, {
      method: "POST",
      body: JSON.stringify({
        nombre: data.nombre_equipo,
        jugadores_emails: emails,
        escudo: data.escudo || ""
      }),
    });
  } catch (error) {
    if ((error as ApiError).data?.detail && Array.isArray((error as ApiError).data?.detail)) {
      throw new Error("Revisá los datos cargados en la plantilla del equipo.")
    }
    throw new Error(getErrorMessage(error) || "Error al inscribir el equipo.");
  }
}

export async function cancelarTorneo(torneoId: number): Promise<TorneoData> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/cancelar`, {
        method: "POST"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cancelar el torneo");
      }
}

export async function bajarseDeTorneo(torneoId: number): Promise<TorneoData> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/inscripciones`, {
        method: "DELETE"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al darse de baja del torneo");
      }
}

export interface PartidoTorneoData {
  id: number
  torneo_id: number
  equipo_local_id?: number
  equipo_visitante_id?: number
  equipo_local?: {
    id: number
    nombre?: string
    nombre_equipo?: string
    escudo?: string
    jugadores: JugadorSimple[]
  }
  equipo_visitante?: {
    id: number
    nombre?: string
    nombre_equipo?: string
    escudo?: string
    jugadores: JugadorSimple[]
  }
  goles_local?: number
  goles_visitante?: number
  estado: string
  fecha?: string
  horario?: string
  cancha_id?: number
  fase: string
  grupo?: string
  numero_fecha?: number
  partido_padre_local_id?: number
  partido_padre_visitante_id?: number
}

// ─── Fixture por fechas ───────────────────────────────────────────────────────

export interface PartidoBracketData {
  id: number
  equipo_local?: { id: number; nombre?: string; nombre_equipo?: string }
  equipo_visitante?: { id: number; nombre?: string; nombre_equipo?: string }
  goles_local?: number
  goles_visitante?: number
  estado: string
  fecha?: string
  horario?: string
  fase?: string
  grupo?: string
  partido_padre_local_id?: number
  partido_padre_visitante_id?: number
}

export interface FechaFixtureData {
  numero: number
  partidos: PartidoBracketData[]
}

export interface FixtureResponse {
  fechas: FechaFixtureData[]
}

export interface RondaBracketData {
  nombre: string
  partidos: PartidoBracketData[]
}

export interface BracketResponse {
  rondas: RondaBracketData[]
}

export async function getFixturePorFechas(torneoId: number): Promise<FixtureResponse> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/fixture`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar fixture por fechas");
      }
}

export async function getBracketTorneo(torneoId: number): Promise<BracketResponse> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/bracket`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar bracket");
      }
}

export interface CargarResultadoData {
  goles_local: number
  goles_visitante: number
  estadisticas_jugadores: {
    usuario_id: number
    equipo_id: number
    goles: number
    amarillas: number
    rojas: number
  }[]
}

export interface EstadisticaJugadorTorneoData {
  usuario_id: number
  usuario_nombre: string
  usuario_apellido: string
  equipo_id: number
  equipo_nombre: string
  goles: number
  amarillas: number
  rojas: number
}

export interface EstadisticaEquipoTorneoData {
  equipo_id: number
  equipo_nombre: string
  goles: number
  amarillas: number
  rojas: number
}

export interface EstadisticasTorneoData {
  jugadores: EstadisticaJugadorTorneoData[]
  equipos: EstadisticaEquipoTorneoData[]
}

export interface TopJugadorData {
  usuario_id: number
  usuario_nombre: string
  usuario_apellido: string
  equipo_id: number
  equipo_nombre: string
  valor: number
}

export interface TablaPosicionData {
  equipo_id: number
  equipo_nombre: string
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  grupo?: string
}

export async function generarFixture(torneoId: number): Promise<PartidoTorneoData[]> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/fixture`, {
        method: "POST"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al generar fixture");
      }
}

export async function getFixtureTorneo(torneoId: number): Promise<PartidoTorneoData[]> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/partidos`, {
        method: "GET"
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar fixture");
      }
}

export async function cargarResultadoPartido(partidoId: number, payload: CargarResultadoData): Promise<PartidoTorneoData> {
    try {
        return await fetchApi(`/api/torneos/partidos/${partidoId}/resultado`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error de validación");
      }
}

export async function getEstadisticasTorneo(torneoId: number): Promise<EstadisticasTorneoData> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/estadisticas`, {
        method: "GET",
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar estadísticas");
      }
}

export async function getTopJugadores(torneoId: number, tipo: "goleadores" | "amarillas" | "rojas", limit: number = 10): Promise<TopJugadorData[]> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/top/${tipo}?limit=${limit}`, {
        method: "GET",
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || `Error al cargar top de ${tipo}`);
      }
}

export async function getTablaPosiciones(torneoId: number): Promise<TablaPosicionData[]> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/tabla-posiciones`, {
        method: "GET",
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar tabla de posiciones");
      }
}

export interface VallaInvictaData {
  equipo_id: number
  equipo_nombre: string
  goles_recibidos: number
}

export async function getVallasInvictas(torneoId: number, limit: number = 10): Promise<VallaInvictaData[]> {
    try {
        return await fetchApi(`/api/torneos/${torneoId}/top/vallas-invictas?limit=${limit}`, {
        method: "GET",
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error al cargar vallas invictas");
      }
}

export interface ProgramarPartidoData {
  cancha_id: number
  fecha: string   // "YYYY-MM-DD"
  horario: string // "HH:MM:SS"
}

export async function programarPartido(partidoId: number, payload: ProgramarPartidoData): Promise<PartidoTorneoData> {
    try {
        return await fetchApi(`/api/torneos/partidos/${partidoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      } catch (error) {
        throw new Error(getErrorMessage(error) || "Error de validación");
      }
}

/* 

// ─────────────────────────────────────────────
// US: Torneos (MOCK PARA FRONTEND ACTUALIZADO)
// ─────────────────────────────────────────────

export interface TorneoCreateData {
  nombre: string
  fecha_inicio: string
  formato: string
  lugar: string
  max_equipos: number
  max_integrantes_por_equipo: number
  costo_inscripcion: number
  descripcion?: string
  reglas?: string
}

export interface EquipoInscripto {
  id: number
  nombre_equipo: string
  jugadores: string // Sigue siendo string porque el backend recibe/almacena el JSON stringificado
  escudo?: string
}



// Almacenamiento en memoria para simular backend
let mockTorneos: TorneoData[] = [
  {
    id: 1,
    nombre: "Torneo de Verano 2026",
    fecha_inicio: "2026-07-01",
    formato: "Fase de grupos + eliminación",
    lugar: "Cancha Central",
    max_equipos: 16,
    max_integrantes_por_equipo: 5,
    costo_inscripcion: 5000,
    descripcion: "El mejor torneo del verano con grandes premios.",
    reglas: "Fútbol 5. Se aplican reglas FIFA.",
    estado: "Abierto para inscripción",
    organizador_id: 2, 
    equipos_inscriptos: 1, // Ajustado a los dos equipos mockeados abajo
    equipos: [
        { 
          id: 101, 
          nombre_equipo: "Los Pumas", 
          jugadores: JSON.stringify([
            { nombre: "Juan Pérez", email: "juan@pumas.com", dni: "38123456" },
            { nombre: "Pedro Gómez", email: "pedro@pumas.com", dni: "39123456" },
            { nombre: "Pablo Ruiz", email: "pablo@pumas.com", dni: "40123456" },
            { nombre: "Leo Ruiz", email: "leo@pumas.com", dni: "40223456" },
            { nombre: "Cristobal Almada", email: "quito@pumas.com", dni: "43323456" }
          ])
        }
    ],
    rol_usuario: "Jugador" 
  },
  {
    id: 2,
    nombre: "Liga de Invierno",
    fecha_inicio: "2026-06-01",
    formato: "Todos contra todos",
    lugar: "Complejo Norte",
    max_equipos: 10,
    costo_inscripcion: 8000,
    estado: "En curso",
    organizador_id: 1, 
    equipos_inscriptos: 10,
    equipos: [],
    max_integrantes_por_equipo: 5,
    rol_usuario: "Organizador"
  },
  {
    id: 3,
    nombre: "Copa Relámpago",
    fecha_inicio: "2025-12-01",
    formato: "Eliminación directa",
    lugar: "Polideportivo Sur",
    max_equipos: 8,
    costo_inscripcion: 3000,
    estado: "Finalizado",
    organizador_id: 1, 
    equipos_inscriptos: 8,
    equipos: [],
    max_integrantes_por_equipo: 5,
    rol_usuario: "Organizador"
  }
]

export async function crearTorneo(data: TorneoCreateData): Promise<TorneoData> {
  const token = getAccessToken()
  if (!token) throw new Error("No autenticado")

  const formatoMap: Record<string, string> = {
    "Eliminación directa": "eliminacion_directa",
    "Fase de grupos + eliminación": "fase_grupos",
    "Todos contra todos": "todos_contra_todos"
  }

  const payload = {
    ...data,
    formato: formatoMap[data.formato] || data.formato
  }

  const response = await fetch(`${API_URL}/api/torneos/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()

  if (!response.ok) {
    if (Array.isArray(result.detail)) {
      throw new Error(result.detail[0]?.msg || "Error de validación")
    }
    throw new Error(result.detail || "Error al crear el torneo")
  }

  const estadoMap: Record<string, string> = {
    "abierto": "Abierto para inscripción",
    "en_curso": "En curso",
    "finalizado": "Finalizado",
    "cancelado": "Cancelado"
  }
  
  const torneoFrontend: TorneoData = {
    ...data,
    id: result.id,
    estado: estadoMap[result.estado] || "Abierto para inscripción",
    organizador_id: result.organizador_id,
    equipos_inscriptos: 0,
    equipos: [],
    rol_usuario: "Organizador"
  }
  
  mockTorneos.push(torneoFrontend)
  return torneoFrontend
}

export async function getTorneosDisponibles(): Promise<TorneoData[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  getAccessToken()
  return mockTorneos.filter(t => t.estado === "Abierto para inscripción")
}

export async function getMisTorneos(): Promise<TorneoData[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  getAccessToken()
  return mockTorneos.filter(t => t.organizador_id === 1 || t.rol_usuario === "Jugador" || t.rol_usuario === "Organizador")
}

export async function getTorneo(id: number): Promise<TorneoData> {
  await new Promise(resolve => setTimeout(resolve, 500))
  getAccessToken()
  const torneo = mockTorneos.find(t => t.id === id)
  if (!torneo) throw new Error("Torneo no encontrado")
  return torneo
}

export interface InscripcionData {
  nombre_equipo: string
  jugadores: string // Recibe el string del JSON mandado por el formulario dinámico
  escudo?: string
}

export async function inscribirEquipo(torneoId: number, data: InscripcionData): Promise<TorneoData> {
  await new Promise(resolve => setTimeout(resolve, 500))
  getAccessToken()
  
  const torneoIndex = mockTorneos.findIndex(t => t.id === torneoId)
  if (torneoIndex === -1) throw new Error("Torneo no encontrado")
  
  const torneo = mockTorneos[torneoIndex]
  if (torneo.equipos_inscriptos >= torneo.max_equipos) {
    throw new Error("El torneo ya no tiene cupos disponibles.")
  }

  // Creamos el nuevo registro del equipo inscripto
  const nuevoEquipo: EquipoInscripto = {
    id: Date.now(),
    nombre_equipo: data.nombre_equipo,
    jugadores: data.jugadores, // Mantiene el JSON stringificado listo para la UI
    escudo: data.escudo
  }
  
  torneo.equipos = torneo.equipos || []
  torneo.equipos.push(nuevoEquipo)
  torneo.equipos_inscriptos += 1
  torneo.rol_usuario = "Jugador"

  return torneo
}

export async function cancelarTorneo(torneoId: number): Promise<TorneoData> {
  await new Promise(resolve => setTimeout(resolve, 500))
  getAccessToken()
  
  const torneoIndex = mockTorneos.findIndex(t => t.id === torneoId)
  if (torneoIndex === -1) throw new Error("Torneo no encontrado")
  
  const torneo = mockTorneos[torneoIndex]
  if (torneo.organizador_id !== 1 && torneo.rol_usuario !== "Organizador") {
      throw new Error("No tenés permisos para cancelar este torneo.")
  }

  torneo.estado = "Cancelado"
  return torneo
} */

// ─────────────────────────────────────────────
// US 36: Estadísticas / Métricas del Dashboard
// ─────────────────────────────────────────────

export interface KpiResumen {
  reservas_hoy: number
  reservas_semana: number
  reservas_mes: number
  tasa_ocupacion_hoy: number
  ingreso_estimado_mes: number
  proxima_reserva_fecha: string | null
  proxima_reserva_horario: string | null
  proxima_reserva_cancha: string | null
}

export interface ReservasDiarias {
  fecha: string
  cantidad: number
}

export interface ReservasPorPeriodoRespuesta {
  datos: ReservasDiarias[]
  total: number
}

export interface ReservasPorDiaSemana {
  dia: string
  dia_numero: number
  cantidad: number
}

export interface ReservasPorDiaSemanaRespuesta {
  datos: ReservasPorDiaSemana[]
}

export interface ReservasPorHora {
  hora: string
  cantidad: number
}

export interface ReservasPorHoraRespuesta {
  datos: ReservasPorHora[]
}

export interface MapaCalorCelda {
  dia: string
  dia_numero: number
  hora: string
  cantidad: number
}

export interface MapaCalorRespuesta {
  datos: MapaCalorCelda[]
}

export interface OcupacionDiaria {
  fecha: string
  tasa: number
}

export interface OcupacionRespuesta {
  tasa_promedio: number
  datos: OcupacionDiaria[]
}

export interface CancelacionesRespuesta {
  total_reservas: number
  total_cancelaciones: number
  total_efectivas: number
  tasa_cancelacion: number
}

export interface TipoReservaItem {
  tipo: string
  cantidad: number
}

export interface DistribucionTipoRespuesta {
  datos: TipoReservaItem[]
}

export interface ModalidadItem {
  modalidad: string
  cantidad: number
}

export interface DistribucionModalidadRespuesta {
  datos: ModalidadItem[]
}

export interface CanchaEstadistica {
  cancha_id: number
  nombre: string
  reservas: number
  ingreso_estimado: number
  tasa_ocupacion: number
}

export interface ComparativaCanchasRespuesta {
  datos: CanchaEstadistica[]
}

export interface IngresoDiario {
  fecha: string
  ingreso: number
}

export interface IngresosRespuesta {
  ingreso_total: number
  ingreso_promedio_diario: number
  datos: IngresoDiario[]
}

function buildEstadisticaParams(
  fechaDesde?: string,
  fechaHasta?: string,
  canchaId?: number
): string {
  const params = new URLSearchParams()
  if (fechaDesde) params.set("fecha_desde", fechaDesde)
  if (fechaHasta) params.set("fecha_hasta", fechaHasta)
  if (canchaId) params.set("cancha_id", String(canchaId))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

async function fetchEstadistica<T>(endpoint: string, params: string): Promise<T> {
    try {
        return await fetchApi(`/estadisticas/${endpoint}${params}`);
      } catch (error) {
        throw new Error(getErrorMessage(error) || `Error al cargar ${endpoint}`);
      }
}

export async function getKpis(canchaId?: number): Promise<KpiResumen> {
  const params = canchaId ? `?cancha_id=${canchaId}` : ""
  return fetchEstadistica<KpiResumen>("kpis", params)
}

export async function getReservasPorPeriodo(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<ReservasPorPeriodoRespuesta> {
  return fetchEstadistica("reservas-periodo", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getReservasPorDiaSemana(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<ReservasPorDiaSemanaRespuesta> {
  return fetchEstadistica("reservas-dia-semana", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getReservasPorHora(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<ReservasPorHoraRespuesta> {
  return fetchEstadistica("reservas-hora", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getMapaCalor(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<MapaCalorRespuesta> {
  return fetchEstadistica("mapa-calor", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getOcupacion(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<OcupacionRespuesta> {
  return fetchEstadistica("ocupacion", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getCancelaciones(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<CancelacionesRespuesta> {
  return fetchEstadistica("cancelaciones", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getDistribucionTipo(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<DistribucionTipoRespuesta> {
  return fetchEstadistica("distribucion-tipo", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getDistribucionModalidad(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<DistribucionModalidadRespuesta> {
  return fetchEstadistica("distribucion-modalidad", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}

export async function getComparativaCanchas(
  fechaDesde?: string, fechaHasta?: string
): Promise<ComparativaCanchasRespuesta> {
  const params = new URLSearchParams()
  if (fechaDesde) params.set("fecha_desde", fechaDesde)
  if (fechaHasta) params.set("fecha_hasta", fechaHasta)
  const qs = params.toString()
  return fetchEstadistica("comparativa-canchas", qs ? `?${qs}` : "")
}

export async function getIngresos(
  fechaDesde?: string, fechaHasta?: string, canchaId?: number
): Promise<IngresosRespuesta> {
  return fetchEstadistica("ingresos", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
}


