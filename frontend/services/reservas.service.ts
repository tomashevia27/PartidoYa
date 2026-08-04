import { fetchApi, getErrorMessage } from "@/lib/api-client";
import type { CanchaData } from "@/services/canchas.service";
import type { PartidoData } from "@/services/partidos.service";

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

export interface ReservaManualData {
  cancha_id: number
  fecha: string
  horario: string
  cliente_nombre?: string
  cliente_apellido?: string
  cliente_telefono?: string
}

export interface ReprogramarReservaData {
  fecha: string
  horario: string
  cancha_id?: number
}

export const ReservasService = {
  getTurnos: async (canchaId: number | string, fecha: string, excluirPartidoId?: number): Promise<TurnosRespuesta> => {
    let url = `/canchas/${canchaId}/turnos?fecha=${fecha}`
    if (excluirPartidoId !== undefined) {
      url += `&excluir_partido_id=${excluirPartidoId}`
    }
    try {
      return await fetchApi(url);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar los turnos");
    }
  },

  getAgenda: async (canchaId: number | string, fecha: string): Promise<AgendaData> => {
    try {
      return await fetchApi(`/canchas/${canchaId}/agenda?fecha=${fecha}`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar la agenda");
    }
  },

  crearReservaManual: async (reservaData: ReservaManualData): Promise<PartidoData> => {
    try {
      return await fetchApi(`/reservas/manual`, {
        method: "POST",
        body: JSON.stringify(reservaData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  },

  bloquearTurno: async (data: ReservaManualData): Promise<PartidoData> => {
    try {
      return await fetchApi(`/reservas/bloquear`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  },

  desbloquearTurno: async (partidoId: number): Promise<{ mensaje: string }> => {
    try {
      return await fetchApi(`/reservas/bloquear/${partidoId}`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al desbloquear el turno");
    }
  },

  cancelarReservaDueno: async (partidoId: number): Promise<PartidoData> => {
    try {
      return await fetchApi(`/reservas/${partidoId}`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cancelar la reserva");
    }
  },

  reprogramarReserva: async (partidoId: number, data: ReprogramarReservaData): Promise<PartidoData> => {
    try {
      return await fetchApi(`/reservas/${partidoId}/reprogramar`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  }
};
