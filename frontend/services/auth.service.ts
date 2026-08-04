import { fetchApi, ApiError, getErrorMessage } from "@/lib/api-client";

export const AuthService = {
  login: async (email: string, password: string): Promise<{ usuario_id: number; rol: string; access_token: string; token_type: string }> => {
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
  },

  confirmEmail: async (email: string, code: string): Promise<{ mensaje: string }> => {
    try {
      return await fetchApi(`/confirmar-email`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al confirmar email");
    }
  },

  resendCode: async (email: string): Promise<{ mensaje: string }> => {
    try {
      return await fetchApi(`/reenviar-codigo`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al reenviar código");
    }
  }
};
