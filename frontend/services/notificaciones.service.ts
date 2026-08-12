import { fetchApi, getErrorMessage } from "@/lib/api-client";

/**
 * ==========================================
 * 📘 GUÍA PARA AGREGAR NUEVAS NOTIFICACIONES
 * ==========================================
 * Si necesitas crear un nuevo tipo de notificación (ej: "torneo_empezado"):
 * 1. Agrega el string exacto aquí abajo dentro de TipoNotificacion.
 * 2. Agrega el MISMO string en backend/app/schemas/notificacion_schemas.py (TipoNotificacion).
 * 3. (Opcional) Asignale un ícono en frontend/components/notifications-panel.tsx (getNotificationIcon).
 * 4. Usa tu nuevo string al llamar a notificacion_service.crear_notificaciones_bulk() en Python.
 * ==========================================
 */
export type TipoNotificacion = 
  | "partido_cancelado"
  | "partido_editado"
  | "jugador_inscripto"
  | "jugador_baja"
  | "reserva_cancha"
  | "cancelacion_cancha"
  | "cambio_cancha_perdida"
  | "cambio_cancha_ganada"
  | "reserva_cancelada_por_dueno"
  | "reserva_reprogramada"
  | "torneo_cancelado";

export interface NotificacionData {
  id: number;
  tipo: TipoNotificacion;
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

export const NotificacionesService = {
  getAll: async (
    soloNoLeidas: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificacionesListado> => {
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
  },

  getConteoNoLeidas: async (): Promise<ConteoNoLeidas> => {
    try {
      return await fetchApi(`/notificaciones/no-leidas/count`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al obtener conteo de notificaciones");
    }
  },

  marcarLeida: async (notificacionId: number): Promise<NotificacionData> => {
    try {
      return await fetchApi(`/notificaciones/${notificacionId}/leer`, {
        method: "PATCH"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al marcar notificación como leída");
    }
  },

  marcarTodasLeidas: async (): Promise<{ mensaje: string }> => {
    try {
      return await fetchApi(`/notificaciones/leer-todas`, {
        method: "PATCH"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al marcar notificaciones como leídas");
    }
  },

  eliminar: async (notificacionId: number): Promise<{ mensaje: string }> => {
    try {
      return await fetchApi(`/notificaciones/${notificacionId}`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al eliminar notificación");
    }
  },

  eliminarTodas: async (): Promise<{ mensaje: string }> => {
    try {
      return await fetchApi(`/notificaciones`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al eliminar notificaciones");
    }
  }
};
