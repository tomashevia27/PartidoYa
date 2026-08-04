import { z } from "zod";

export const API_URL = process.env.NEXT_PUBLIC_API_URL
  || (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("partidoya_auth_access_token");
  }
  return null;
}

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getErrorMessage(error: unknown): string {
  let msg = "";
  if (error instanceof ApiError) msg = error.message;
  else if (error instanceof Error) msg = error.message;
  else msg = String(error);

  if (msg === "fetch failed" || msg === "Failed to fetch") {
    return "No se pudo conectar con el servidor. Revisá tu conexión a internet.";
  }
  return msg;
}

export async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  schema?: z.ZodType<T>
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  // 1. Inyectar Authorization dinámicamente
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // 2. Por defecto asumir JSON si no es FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  // 3. Ejecutar la petición
  const response = await fetch(url, { ...options, headers });

  // 4. Procesar respuestas 204 (No Content)
  if (response.status === 204) {
    return {} as T;
  }

  // 5. Intentar parsear a JSON de forma segura
  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  // 6. Manejo estructurado de errores (4xx y 5xx)
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("partidoya_auth_user_id");
      sessionStorage.removeItem("partidoya_auth_user_role");
      sessionStorage.removeItem("partidoya_auth_access_token");
      window.location.href = "/login?expired=true";
      await new Promise(() => {}); // Detener ejecución mientras el navegador redirige
    }

    let errorMessage = "Error inesperado en la petición";
    
    if (data && typeof data === "object") {
       if (data.detail) {
          if (Array.isArray(data.detail)) {
             // Formato de error de validación Pydantic/FastAPI
             errorMessage = data.detail.map((err: any) => err.msg || "Error de validación").join(", ");
          } else if (typeof data.detail === "string") {
             errorMessage = data.detail;
          }
       } else if (data.mensaje) {
          errorMessage = data.mensaje;
       }
    } else if (typeof data === "string" && data) {
        errorMessage = data; // HTML o string plano (ej. nginx 502)
    }

    throw new ApiError(errorMessage, response.status, data);
  }

  if (schema) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod Validation Error:", error.errors);
        throw new ApiError("Error de validación: La respuesta del servidor no tiene el formato esperado.", 500, error.errors);
      }
      throw error;
    }
  }

  return data as T;
}
