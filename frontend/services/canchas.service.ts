import { fetchApi, getErrorMessage } from "@/lib/api-client";
import { CanchaSchema, CanchaArraySchema } from "@/lib/schemas";
import { z } from "zod";

export type CanchaData = z.infer<typeof CanchaSchema>;

export const CanchasService = {
  create: async (canchaData: Omit<CanchaData, "id">) => {
    try {
      return await fetchApi(`/canchas`, {
        method: "POST",
        body: JSON.stringify(canchaData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  },

  update: async (canchaId: number | string, canchaData: Partial<CanchaData>) => {
    try {
      return await fetchApi(`/canchas/${canchaId}`, {
        method: "PUT",
        body: JSON.stringify(canchaData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Revisá los datos ingresados.");
    }
  },

  delete: async (canchaId: number | string) => {
    try {
      return await fetchApi(`/canchas/${canchaId}`, {
        method: "DELETE"
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al eliminar la cancha");
    }
  },

  getMisCanchas: async (): Promise<CanchaData[]> => {
    try {
      return await fetchApi(`/canchas/me`, {}, CanchaArraySchema);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar mis canchas");
    }
  },

  getAll: async (): Promise<CanchaData[]> => {
    try {
      return await fetchApi(`/canchas`, {}, CanchaArraySchema);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar las canchas");
    }
  },

  getById: async (canchaId: string | number): Promise<CanchaData> => {
    try {
      return await fetchApi(`/canchas/${canchaId}`, {}, CanchaSchema);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar la cancha");
    }
  }
};
