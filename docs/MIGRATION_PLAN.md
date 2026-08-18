# 🏗️ Inventario de Infraestructura & Plan de Migración

> **Proyecto:** PartidoYa  
> **Fecha de Auditoría:** 2026-08-17 (v2 — corregido)  
> **Auditor:** Antigravity (DevOps/Cloud Engineer)  
> **Alcance:** Repositorio completo (Backend + Frontend)

---

## 📋 Resumen Ejecutivo

Se auditó el 100% del repositorio. Se identificaron **7 servicios externos**. De ellos, **3 requieren migración** desde cuentas de terceros, **2 requieren reconfiguración** en cuentas propias ya existentes, y **2 no requieren acción**.

> [!CAUTION]
> **Hallazgo de Seguridad Crítico:** Se encontraron credenciales de la base de datos de producción de Render **hardcodeadas en texto plano** dentro de 3 archivos seeder versionados en Git.

---

## 📊 Matriz de Propiedad y Acción

| # | Servicio | Propietario | Acción Requerida |
|---|---|---|---|
| 1 | **Render PostgreSQL** (DB) | ❌ Ex-compañero | 🔴 **MIGRAR** — Crear DB nueva + dump/restore |
| 2 | **Render Backend** (Hosting) | ❌ Ex-compañero | 🔴 **MIGRAR** — Crear Web Service nuevo |
| 3 | **Resend** (Email) | ❌ Ex-compañero | 🔴 **MIGRAR** — Crear cuenta + verificar dominio |
| 4 | **Cloudinary** (CDN) | ✅ Tuyo | 🟡 **RECONFIGURAR** — Externalizar config a env vars |
| 5 | **Vercel** (Frontend) | ✅ Tuyo | 🟡 **RECONFIGURAR** — Vincular nuevo repo |
| 6 | Vercel Analytics | ✅ Tuyo | ⚪ Automático con Vercel |
| 7 | Google Fonts | N/A | ⚪ Público, sin acción |

---

## 🔍 Detalle de Servicios a Migrar

### 🐘 Render PostgreSQL — Base de Datos

| Campo | Detalle |
|---|---|
| **Host actual** | `dpg-d8bqhul8nd3s738tbc20-a.virginia-postgres.render.com` |
| **DB / Usuario** | `teamup_db_yilz` / `teamup_user` |
| **Usado en** | [config.py:13](file:///home/tomas-hevia/Escritorio/PartidoYa_prueba/backend/app/core/config.py#L13), [db.py:12](file:///home/tomas-hevia/Escritorio/PartidoYa_prueba/backend/app/core/db.py#L12) |

> [!WARNING]
> **Credenciales hardcodeadas en:**
> - `backend/seeders/crear_torneo_test.py:11`
> - `backend/seeders/cargar_torneo.py:10`
> - `backend/seeders/cargar_datos.py:9` (comentada pero visible en Git)

### 🖥️ Render Backend — Hosting API

| Campo | Detalle |
|---|---|
| **URL actual** | `teamup-backend-lq30.onrender.com` |
| **Env vars necesarias** | `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` |

### 📧 Resend — Email Transaccional

| Campo | Detalle |
|---|---|
| **Sender actual** | `onboarding@partidoya.me` |
| **Usado en** | [email_service.py](file:///home/tomas-hevia/Escritorio/PartidoYa_prueba/backend/app/services/email_service.py) |
| **Env vars** | `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` |

---

## 🔍 Detalle de Servicios a Reconfigurar

### 🖼️ Cloudinary — Ya es tuyo, solo limpiar código

**Problema:** `CLOUD_NAME` y `UPLOAD_PRESET` están hardcodeados en [users.service.ts:3-4](file:///home/tomas-hevia/Escritorio/PartidoYa_prueba/frontend/services/users.service.ts#L3-L4).

**Acción:** Externalizar a `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_PRESET`.

### 🌐 Vercel — Ya es tuyo, solo revincular repo

**Problema:** Proyecto conectado al repo grupal viejo.

**Acción:** Crear nuevo proyecto en tu Vercel apuntando a `tomashevia27/PartidoYa_prueba`, o cambiar el repo vinculado en el proyecto existente. Configurar env var `NEXT_PUBLIC_API_URL`.

---

## 🚫 Servicios NO Detectados

Pasarelas de pago, APIs de mapas, Redis, WebSockets, Auth externos (Firebase/Auth0), Sentry, AWS S3, CI/CD, Cron/Workers — **ninguno encontrado**.

---

## 🗺️ Plan de Migración — Zero-Downtime (4 Fases)

### Fase 0: Limpieza de Código (PASO INMEDIATO)

> [!IMPORTANT]
> Esto se hace **antes de tocar cualquier infraestructura**. Es puro código, sin riesgo.

- [ ] **Eliminar credenciales hardcodeadas** de los 3 seeders
- [ ] **Externalizar Cloudinary** config a env vars en el frontend
- [ ] **Crear `.env.example`** documentando todas las variables del proyecto
- [ ] **Commit + push** — El repo queda limpio para cualquier deploy futuro

### Fase 1: Base de Datos (Lo más crítico)

1. Hacer `pg_dump` de la DB actual (mientras siga accesible)
2. Crear instancia **Render PostgreSQL** en tu cuenta personal
3. Restaurar con `psql < dump.sql`
4. Verificar integridad (counts de tablas principales)

```bash
# Backup
pg_dump "postgresql://teamup_user:PASS@OLD_HOST/teamup_db_yilz?sslmode=require" > backup.sql
# Restore
psql "postgresql://NEW_USER:NEW_PASS@NEW_HOST/NEW_DB?sslmode=require" < backup.sql
```

### Fase 2: Resend + Backend en Render

1. Crear cuenta [resend.com](https://resend.com) → obtener `RESEND_API_KEY`
2. Verificar dominio `partidoya.me` (o nuevo) con registros DNS
3. Crear **Web Service** en tu Render → conectar repo `tomashevia27/PartidoYa_prueba`
   - Root Dir: `backend`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Configurar env vars:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | Nueva connection string (Fase 1) |
   | `SECRET_KEY` | Nueva clave segura (64+ chars) |
   | `RESEND_API_KEY` | De tu cuenta Resend |
   | `RESEND_SENDER_EMAIL` | `onboarding@tudominio.com` |

5. Deploy y verificar `/docs`

> [!WARNING]
> Cambiar `SECRET_KEY` invalida todos los JWT. Los usuarios deberán loguearse de nuevo.

### Fase 3: Vercel + Validación Final

1. Crear nuevo proyecto en Vercel → repo `tomashevia27/PartidoYa_prueba`, Root Dir: `frontend`
2. Env vars: `NEXT_PUBLIC_API_URL` = URL del nuevo backend
3. Env vars: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_PRESET` (si externalizaste en Fase 0)
4. Deploy
5. **Checklist de validación:**
   - [ ] Registro → email llega
   - [ ] Upload de foto → Cloudinary funciona
   - [ ] Login → JWT ok
   - [ ] CRUD canchas, partidos, torneos
   - [ ] Imágenes existentes se muestran
6. Restringir CORS en `main.py` (reemplazar `"*"` por dominio real)
7. Actualizar `README.md` con nuevas URLs

---

## ⏱️ Tiempo Estimado

| Fase | Tiempo |
|---|---|
| Fase 0 — Limpieza de código | 30 min |
| Fase 1 — Base de datos | 1-2h |
| Fase 2 — Resend + Backend | 1-2h (DNS puede demorar hasta 24h) |
| Fase 3 — Vercel + Validación | 30 min |
| **Total** | **~3 a 5 horas** |
