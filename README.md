<div align="center">
  <img src="./frontend/public/logo-partidoya.jpg" alt="PartidoYa Logo" width="120" />
  <h1>PartidoYa ⚽</h1>
  <p><strong>La Plataforma SaaS integral para dueños de complejos deportivos y apasionados del fútbol.</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_14-336791?logo=postgresql)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?logo=docker)](https://www.docker.com/)
</div>

---

**PartidoYa** es una plataforma SaaS diseñada para digitalizar por completo el ecosistema del fútbol amateur. Conectamos a administradores de complejos deportivos (B2B) con jugadores (C2C) a través de un sistema de reservas, gestión inteligente de torneos y automatización de partidos.

## 🚀 Características Principales

### 🏢 B2B: Para Dueños de Complejos
Transforma la gestión de tus instalaciones en una experiencia automatizada y basada en datos.
- **Gestión de Canchas y Agenda:** Administra la disponibilidad, bloquea horarios y gestiona reservas con una agenda interactiva.
- **Reservas Manuales (B2B):** Carga de reservas telefónicas o presenciales sin fricciones.
- **Dashboard Estadístico:** Analíticas en tiempo real sobre la ocupación, ganancias estimadas y métricas de rendimiento por cancha.

### 🏃 C2C: Para Jugadores
Tu próximo partido a un par de clics de distancia.
- **Organización Inteligente:** Crea partidos públicos o privados, divide los gastos y administra los cupos disponibles.
- **Matchmaking Local:** Únete a partidos abiertos cerca de tu zona que necesiten jugadores.
- **Notificaciones Automáticas:** Alertas por email cuando un partido se confirma, se cancela o sufre reprogramaciones.

### 🏆 Motor de Torneos Avanzado
Un ecosistema completo para administrar competiciones de principio a fin.
- **Múltiples Formatos:** Soporte para *Todos contra Todos*, *Fase de Grupos + Eliminatorias*, y *Eliminación Directa*.
- **Fixture Automatizado:** Generación algorítmica de cruces, fechas y horarios.
- **Tablas y Estadísticas:** Tablas de posiciones automatizadas y carga de resultados en tiempo real.

---

## 💻 Stack Tecnológico

La arquitectura de PartidoYa está separada en dos repositorios lógicos (Frontend y Backend) que se comunican a través de una API RESTful fuertemente tipada.

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), React 19, [TailwindCSS v4](https://tailwindcss.com/) y Shadcn UI. Manejo de estado del servidor con **TanStack Query**.
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11) con inyección de dependencias.
- **Base de Datos:** [PostgreSQL 14](https://www.postgresql.org/) gestionado a través del ORM [SQLAlchemy](https://www.sqlalchemy.org/).
- **Infraestructura:** [Docker](https://www.docker.com/) y Docker Compose para entornos locales aislados.

---

## 🌐 Entorno en Producción

Nuestra plataforma está desplegada en la nube y lista para ser utilizada:

- 🎮 **Plataforma Web (Frontend):** [tp-gdsi-grupo-01.vercel.app](https://tp-gdsi-grupo-01.vercel.app/)
- ⚙️ **API REST (Backend):** [teamup-backend-lq30.onrender.com](https://teamup-backend-lq30.onrender.com)
- 📚 **Documentación API (Swagger):** [teamup-backend-lq30.onrender.com/docs](https://teamup-backend-lq30.onrender.com/docs)

> *Nota técnica: El backend está alojado en la capa gratuita de Render. Si el servidor entra en estado de suspensión por inactividad, la primera petición (Cold Start) puede demorar entre 30 y 60 segundos.*

---

## ⚙️ Instalación Rápida (Entorno Local)

Para ejecutar PartidoYa en tu máquina local solo necesitas tener **Docker** y **Docker Compose** instalados.

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/partidoya.git
   cd partidoya
   ```

2. **Levanta los contenedores:**
   Ejecuta el siguiente comando en la raíz del proyecto para descargar las imágenes, instalar las dependencias y levantar todos los servicios:
   ```bash
   docker compose up --build -d
   ```

3. **Accede a los servicios:**
   Una vez que el proceso finalice, los servicios estarán disponibles en los siguientes puertos locales:

   | Servicio | Puerto Local | URL |
   |---|---|---|
   | **Frontend** (Plataforma Web) | `3000` | [http://localhost:3000](http://localhost:3000) |
   | **Backend API** (FastAPI) | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |
   | **Base de Datos** (PostgreSQL)| `5432` | `postgresql://admin:admin123@localhost:5432/bdd_db` |
   | **Gestor DB** (PgAdmin) | `5050` | [http://localhost:5050](http://localhost:5050) |

4. **Detener el entorno:**
   ```bash
   docker compose down
   ```
   *(Añade `-v` si también deseas eliminar los volúmenes y destruir la base de datos local).*

---

## 🎓 Contexto Académico

Este proyecto fue desarrollado íntegramente en el marco de la materia **Gestión del Desarrollo de Sistemas Informáticos (GDSI)** de la Facultad de Ingeniería de la Universidad de Buenos Aires (**FIUBA**).

El ciclo de vida del producto se gestionó utilizando el framework ágil **Scrum**, estructurado en **7 Sprints semanales**. Esta metodología permitió una entrega iterativa y un enfoque constante en la mitigación de riesgos técnicos, asegurando un MVP funcional y alineado con los requerimientos comerciales (User Stories).

**Equipo de Desarrollo (Grupo 01):**
- Manuel Campoliete
- Tomás Hevia
- Nicolás Olivera
- Julián Alvarez
- Camila Suarez
- Milagros Thome

---
<div align="center">
  <p>Construido con dedicación para revolucionar el fútbol amateur.</p>
</div>
