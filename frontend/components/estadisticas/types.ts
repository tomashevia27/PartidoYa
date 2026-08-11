export interface KpiResumenDTO {
    reservas_hoy: number;
    reservas_semana: number;
    reservas_mes: number;
    tasa_ocupacion_hoy: number;
    ingreso_estimado_mes: number;
    proxima_reserva_fecha: string | null;
    proxima_reserva_horario: string | null;
    proxima_reserva_cancha: string | null;
}

export interface ReservasDiariasDTO {
    fecha: string;
    cantidad: number;
}

export interface ReservasPorPeriodoRespuestaDTO {
    datos: ReservasDiariasDTO[];
    total: number;
}

export interface OcupacionDiariaDTO {
    fecha: string;
    tasa: number;
}

export interface OcupacionRespuestaDTO {
    tasa_promedio: number;
    datos: OcupacionDiariaDTO[];
}

export interface MapaCalorCeldaDTO {
    dia: string;
    dia_numero: number;
    hora: string;
    cantidad: number;
}

export interface MapaCalorRespuestaDTO {
    datos: MapaCalorCeldaDTO[];
}

export interface TipoReservaItemDTO {
    tipo: string;
    cantidad: number;
}

export interface DistribucionTipoRespuestaDTO {
    datos: TipoReservaItemDTO[];
}

export interface ModalidadItemDTO {
    modalidad: string;
    cantidad: number;
}

export interface DistribucionModalidadRespuestaDTO {
    datos: ModalidadItemDTO[];
}

export interface CancelacionesRespuestaDTO {
    total_reservas: number;
    total_cancelaciones: number;
    total_efectivas: number;
    tasa_cancelacion: number;
}

export interface ReservasPorDiaSemanaDTO {
    dia: string;
    dia_numero: number;
    cantidad: number;
}

export interface ReservasPorDiaSemanaRespuestaDTO {
    datos: ReservasPorDiaSemanaDTO[];
}

export interface CanchaEstadisticaDTO {
    cancha_id: number;
    nombre: string;
    reservas: number;
    ingreso_estimado: number;
    tasa_ocupacion: number;
}

export interface ComparativaCanchasRespuestaDTO {
    datos: CanchaEstadisticaDTO[];
}
