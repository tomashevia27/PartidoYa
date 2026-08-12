# 🏗️ Technical Debt & Backlog V2 (Roadmap)

Este documento centraliza las propuestas de mejora arquitectónica, vulnerabilidades detectadas y deuda técnica que quedaron fuera del alcance inicial del MVP. Sirve como mapa de ruta para la Versión 2.0.

## 1. 🚀 Evolución a Tiempo Real (WebSockets vs Polling)
**Estado Actual:** El panel de notificaciones y la mensajería del sistema funcionan utilizando `refetchInterval` (Polling) de React Query. Esto significa que los clientes bombardean la API cada 30 segundos preguntando por novedades.
**Propuesta:** Reemplazar el Polling por **FastAPI WebSockets**.
**Por qué:** Para aplicaciones de alta escalabilidad, mantener conexiones persistentes push (WebSockets) reduce drásticamente el consumo de CPU y red en el backend. Las notificaciones llegarán en milisegundos sin necesidad de hacer cientos de peticiones GET.

## 2. 🛡️ Seguridad y Rate Limiting
**Estado Actual:** Los endpoints públicos (como `/api/auth/login` o `/api/auth/registro`) no tienen mecanismos de protección contra ataques de fuerza bruta o de denegación de servicio (DDoS).
**Propuesta:** Implementar un middleware de **Rate Limiting**, como `slowapi` en FastAPI.
**Por qué:** Para evitar que un bot intente adivinar contraseñas haciendo 10.000 peticiones por segundo, o que consuma todos los recursos de base de datos creando torneos masivamente.

## 3. 🧩 Manejo Global de Errores (Global Exception Handler)
**Estado Actual:** Las validaciones de Pydantic lanzan un error `422 Unprocessable Entity` nativo de FastAPI. Algunos errores de dominio (como `DomainRuleError`) se manejan, pero si ocurre un `500 Internal Server Error`, FastAPI devuelve su error genérico.
**Propuesta:** Estandarizar una única estructura JSON de error (Ej: `{ "error": "TYPE", "detail": "message", "timestamp": "..." }`) interceptando todos los errores desde `app/main.py` con `@app.exception_handler`.
**Por qué:** Mejora inmensamente la Developer Experience (DX) del frontend. El cliente siempre sabrá qué forma exacta tiene el error para mostrar SweetAlerts o Toasts de manera elegante.

## 4. 🔐 Gestión de Variables de Entorno y Secretos
**Estado Actual:** La variable `SECRET_KEY` del JWT tiene un valor por defecto quemado (hardcodeado) en `app/core/config.py` (`"tp_gdsi_grupo_01_secret_key_2024"`).
**Propuesta:** Obligar a que la aplicación falle en producción si no existe una variable de entorno `SECRET_KEY` inyectada de forma segura (sin fallbacks débiles).
**Por qué:** Un secreto expuesto en código público permite a cualquier atacante falsificar tokens JWT y convertirse en Administrador.

## 5. 🐳 Optimización de Docker para Producción
**Estado Actual:** Usamos `uvicorn` en un solo hilo (single-worker) mediante el CMD del `Dockerfile`. En frontend construimos la imagen de forma estándar.
**Propuesta:** 
- En backend, utilizar `gunicorn` con `uvicorn.workers.UvicornWorker` para aprovechar todos los núcleos de CPU.
- En frontend, aplicar **Multi-stage builds** y habilitar compresión (Brotli/Gzip) mediante un reverse proxy (NGINX).
**Por qué:** Preparar el proyecto para soportar a miles de usuarios simultáneos y optimizar el tamaño de las imágenes de Docker.
