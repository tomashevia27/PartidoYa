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
  public data: unknown;
  public isValidationError: boolean;

  constructor(message: string, status: number, data?: unknown, isValidationError: boolean = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isValidationError = isValidationError;
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

type FastAPIValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

// Type guard para chequear si es un error de Pydantic
function isFastAPIValidationError(detail: unknown): detail is FastAPIValidationError[] {
  return Array.isArray(detail) && detail.length > 0 && typeof detail[0] === "object" && detail[0] !== null && "msg" in detail[0];
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
  let data: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  // 6. Manejo estructurado de errores (4xx y 5xx)
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:expired"));
      await new Promise(() => {}); // Detener ejecución mientras el enrutador de React procesa el evento
    }

    let errorMessage = "Error inesperado en la petición";
    
    if (data !== null && typeof data === "object") {
       if ("detail" in data) {
          const detail = (data as { detail: unknown }).detail;
          if (isFastAPIValidationError(detail)) {
             // Formato de error de validación Pydantic/FastAPI
             errorMessage = detail.map(err => err.msg || "Error de validación").join(", ");
          } else if (typeof detail === "string") {
             errorMessage = detail;
          }
       } else if ("mensaje" in data && typeof (data as any).mensaje === "string") {
          errorMessage = (data as { mensaje: string }).mensaje;
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
        throw new ApiError("Error de validación: La respuesta del servidor no tiene el formato esperado.", 500, error.errors, true);
      }
      throw error;
    }
  }

  return data as T;
}
