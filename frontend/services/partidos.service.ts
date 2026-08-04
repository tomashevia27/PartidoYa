import { fetchApi, getErrorMessage } from "@/lib/api-client";
import { PartidoSchema, MisPartidosSchema } from "@/lib/schemas";
import { z } from "zod";

export type PartidoData = z.infer<typeof PartidoSchema>;
export type MisPartidosData = z.infer<typeof MisPartidosSchema>;

export interface PartidoCreateData {
  cancha_id: number;
  fecha: string;
  horario: string;
  tipo: string;
  descripcion?: string;
  cupos_disponibles?: number;
}

export interface PartidoDisponibleFilters {
  zona?: string;
  modalidad?: string;
  fecha?: string;
}

export interface FiltroOpcion {
  valor: string;
  cantidad: number;
}

export interface FiltrosDisponiblesData {
  zonas: FiltroOpcion[];
  modalidades: FiltroOpcion[];
}

export const PartidosService = {
  getMisPartidos: async (): Promise<MisPartidosData> => {
    try {
      return await fetchApi(`/partidos/mis-partidos`, {}, MisPartidosSchema);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar partidos");
    }
  },

  getById: async (partidoId: string | number): Promise<PartidoData> => {
    try {
      return await fetchApi(`/partidos/${partidoId}`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar el partido");
    }
  },

  create: async (partidoData: PartidoCreateData): Promise<PartidoData> => {
    try {
      return await fetchApi(`/partidos`, {
        method: "POST",
        body: JSON.stringify(partidoData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  },

  cancel: async (partidoId: string | number): Promise<PartidoData> => {
    try {
      return await fetchApi(`/partidos/${partidoId}/cancelar`, {
        method: "PATCH"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cancelar el partido");
    }
  },

  inscribirse: async (partidoId: string | number): Promise<PartidoData> => {
    try {
      return await fetchApi(`/partidos/${partidoId}/inscribirse`, {
        method: "POST"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al inscribirse al partido");
    }
  },

  bajarse: async (partidoId: string | number): Promise<PartidoData> => {
    try {
      return await fetchApi(`/partidos/${partidoId}/bajarse`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al darse de baja del partido");
    }
  },

  update: async (partidoId: string | number, partidoData: PartidoCreateData): Promise<PartidoData> => {
    try {
      return await fetchApi(`/partidos/${partidoId}`, {
        method: "PUT",
        body: JSON.stringify(partidoData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  },

  getDisponibles: async (filters?: PartidoDisponibleFilters): Promise<PartidoData[]> => {
    const params = new URLSearchParams()
    if (filters?.zona) params.set("zona", filters.zona)
    if (filters?.modalidad) params.set("modalidad", filters.modalidad)
    if (filters?.fecha) params.set("fecha", filters.fecha)

    const queryString = params.toString()
    const endpoint = `/partidos/disponibles${queryString ? \`?\${queryString}\` : ""}`

    try {
      return await fetchApi(endpoint);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar partidos disponibles");
    }
  },

  getFiltrosDisponibles: async (): Promise<FiltrosDisponiblesData> => {
    try {
      return await fetchApi(`/partidos/filtros`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar opciones de filtros");
    }
  }
};
