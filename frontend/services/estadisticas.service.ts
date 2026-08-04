import { fetchApi, getErrorMessage } from "@/lib/api-client";

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

export const EstadisticasService = {
  getKpis: async (canchaId?: number): Promise<KpiResumen> => {
    const params = canchaId ? `?cancha_id=${canchaId}` : ""
    return fetchEstadistica<KpiResumen>("kpis", params)
  },

  getReservasPorPeriodo: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<ReservasPorPeriodoRespuesta> => {
    return fetchEstadistica("reservas-periodo", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getReservasPorDiaSemana: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<ReservasPorDiaSemanaRespuesta> => {
    return fetchEstadistica("reservas-dia-semana", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getReservasPorHora: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<ReservasPorHoraRespuesta> => {
    return fetchEstadistica("reservas-hora", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getMapaCalor: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<MapaCalorRespuesta> => {
    return fetchEstadistica("mapa-calor", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getOcupacion: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<OcupacionRespuesta> => {
    return fetchEstadistica("ocupacion", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getCancelaciones: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<CancelacionesRespuesta> => {
    return fetchEstadistica("cancelaciones", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getDistribucionTipo: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<DistribucionTipoRespuesta> => {
    return fetchEstadistica("distribucion-tipo", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getDistribucionModalidad: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<DistribucionModalidadRespuesta> => {
    return fetchEstadistica("distribucion-modalidad", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  },

  getComparativaCanchas: async (fechaDesde?: string, fechaHasta?: string): Promise<ComparativaCanchasRespuesta> => {
    const params = new URLSearchParams()
    if (fechaDesde) params.set("fecha_desde", fechaDesde)
    if (fechaHasta) params.set("fecha_hasta", fechaHasta)
    const qs = params.toString()
    return fetchEstadistica("comparativa-canchas", qs ? `?${qs}` : "")
  },

  getIngresos: async (fechaDesde?: string, fechaHasta?: string, canchaId?: number): Promise<IngresosRespuesta> => {
    return fetchEstadistica("ingresos", buildEstadisticaParams(fechaDesde, fechaHasta, canchaId))
  }
};
