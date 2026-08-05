import { fetchApi, getErrorMessage } from "@/lib/api-client";
import { TorneoSchema, TorneoArraySchema } from "@/lib/schemas";
import { z } from "zod";

export type TorneoData = z.infer<typeof TorneoSchema>;

export interface TorneoCreateData {
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  formato: string
  zona: string
  dias_operativos: number
  franja_horaria: string
  min_integrantes_por_equipo: number
  max_equipos: number
  costo_inscripcion: number
  ida_y_vuelta: boolean
  fase_final?: string | null
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

export interface VallaInvictaData {
  equipo_id: number
  equipo_nombre: string
  goles_recibidos: number
}

export interface ProgramarPartidoData {
  cancha_id: number
  fecha: string   // "YYYY-MM-DD"
  horario: string // "HH:MM:SS"
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

export const TorneosService = {
  create: async (data: TorneoCreateData): Promise<TorneoData> => {
    try {
      return await fetchApi(`/api/torneos/`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al crear el torneo");
    }
  },

  update: async (torneoId: string | number, torneoData: TorneoUpdateData): Promise<TorneoData> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}`, {
        method: "PATCH",
        body: JSON.stringify(torneoData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al editar el torneo");
    }
  },

  getDisponibles: async (): Promise<TorneoData[]> => {
    try {
      const data = await fetchApi(`/api/torneos/`, { method: "GET" }) as any[];
      return TorneoArraySchema.parse(data.map(normalizarTorneo));
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar torneos abiertos");
    }
  },

  getMisTorneos: async (): Promise<TorneoData[]> => {
    try {
      const data = await fetchApi(`/api/torneos/mis-torneos`) as any;
      const allTorneos = [
          ...(data.proximos || []),
          ...(data.en_curso || []),
          ...(data.finalizados || []),
          ...(data.cancelados || [])
      ].map((t: any) => ({
          ...t,
          rol_usuario: t.rol
      })).map(normalizarTorneo);
      return TorneoArraySchema.parse(allTorneos);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar los torneos del usuario");
    }
  },

  getById: async (id: number): Promise<TorneoData> => {
    try {
      const data = await fetchApi(`/api/torneos/${id}`, { method: "GET" }) as any;
      return TorneoSchema.parse(normalizarTorneo(data));
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Torneo no encontrado");
    }
  },

  inscribirEquipo: async (torneoId: number, data: InscripcionData): Promise<any> => {
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
      if ((error as any).data?.detail && Array.isArray((error as any).data?.detail)) {
        throw new Error("Revisá los datos cargados en la plantilla del equipo.")
      }
      throw new Error(getErrorMessage(error) || "Error al inscribir el equipo.");
    }
  },

  cancelar: async (torneoId: number): Promise<TorneoData> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/cancelar`, {
        method: "POST"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cancelar el torneo");
    }
  },

  bajarse: async (torneoId: number): Promise<TorneoData> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/inscripciones`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al darse de baja del torneo");
    }
  },

  getFixturePorFechas: async (torneoId: number): Promise<FixtureResponse> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/fixture`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar fixture por fechas");
    }
  },

  getBracket: async (torneoId: number): Promise<BracketResponse> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/bracket`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar bracket");
    }
  },

  generarFixture: async (torneoId: number): Promise<PartidoTorneoData[]> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/fixture`, {
        method: "POST"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al generar fixture");
    }
  },

  getFixtureListado: async (torneoId: number): Promise<PartidoTorneoData[]> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/partidos`, {
        method: "GET"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar fixture");
    }
  },

  cargarResultadoPartido: async (partidoId: number, payload: CargarResultadoData): Promise<PartidoTorneoData> => {
    try {
      return await fetchApi(`/api/torneos/partidos/${partidoId}/resultado`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error de validación");
    }
  },

  getEstadisticas: async (torneoId: number): Promise<EstadisticasTorneoData> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/estadisticas`, {
        method: "GET",
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar estadísticas");
    }
  },

  getTopJugadores: async (torneoId: number, tipo: "goleadores" | "amarillas" | "rojas", limit: number = 10): Promise<TopJugadorData[]> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/top/${tipo}?limit=${limit}`, {
        method: "GET",
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || `Error al cargar top de ${tipo}`);
    }
  },

  getTablaPosiciones: async (torneoId: number): Promise<TablaPosicionData[]> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/tabla-posiciones`, {
        method: "GET",
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar tabla de posiciones");
    }
  },

  getVallasInvictas: async (torneoId: number, limit: number = 10): Promise<VallaInvictaData[]> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/top/vallas-invictas?limit=${limit}`, {
        method: "GET",
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar vallas invictas");
    }
  },

  programarPartido: async (partidoId: number, payload: ProgramarPartidoData): Promise<PartidoTorneoData> => {
    try {
      return await fetchApi(`/api/torneos/partidos/${partidoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error de validación");
    }
  },

  // ── Aliases para compatibilidad con nombres históricos ──────────────────
  getBracketTorneo: async (torneoId: number): Promise<BracketResponse> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/bracket`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar bracket");
    }
  },

  getFixtureTorneo: async (torneoId: number): Promise<PartidoTorneoData[]> => {
    try {
      return await fetchApi(`/api/torneos/${torneoId}/partidos`, { method: "GET" });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar fixture");
    }
  },
};
