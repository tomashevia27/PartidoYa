import { fetchApi, getErrorMessage, ApiError } from "@/lib/api-client";

const CLOUD_NAME = "dzsrgcgq6"
const UPLOAD_PRESET = "PartidoYa_preset"

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  edad: number;
  genero: string;
  zona: string;
  rol: string;
  foto_perfil?: string;
}

export interface UpdateProfilePayload {
  nombre: string;
  apellido: string;
  edad: number;
  genero: string;
  zona: string;
  password?: string;
  foto_perfil?: string;
}

export interface UserProfile {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  edad: number;
  genero: string;
  zona: string;
  rol: string;
  foto_perfil?: string;
}

export const UsersService = {
  uploadImage: async (file: File): Promise<string> => {
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
  },

  register: async (userData: RegisterPayload): Promise<UserProfile> => {
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
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      return await fetchApi(`/usuarios/me`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al cargar el perfil");
    }
  },

  updateProfile: async (userData: UpdateProfilePayload): Promise<UserProfile> => {
    try {
      return await fetchApi(`/usuarios/me`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error) || "Error al actualizar el perfil");
    }
  }
};
