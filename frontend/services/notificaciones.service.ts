import { fetchApi, getErrorMessage } from "@/lib/api-client";

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
