# 📘 Manual de Arquitectura y Buenas Prácticas (Frontend)

Este documento ("machete") resume las filosofías, estándares de grado empresarial y antipatrones a evitar al desarrollar aplicaciones modernas, tomando como referencia el ecosistema construido para **PartidoYa**.

---

## 🛠️ Stack Tecnológico Actual

*   **Framework Principal:** [Next.js (App Router)](https://nextjs.org/) - Orquestador que permite renderizado híbrido (servidor y cliente).
*   **Librería UI:** [React 18+](https://react.dev/) - Construcción de interfaces interactivas.
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) - Tipado estricto para evitar errores en tiempo de ejecución.
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) - Clases utilitarias (Utility-first) para diseño veloz.
*   **Estado del Servidor (Caché):** [TanStack Query (React Query)](https://tanstack.com/query) - Gestión asíncrona de datos de la API.
*   **Formularios y Validación:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Formularios performantes y validación estricta de esquemas.
*   **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/) - Componentes accesibles preconstruidos (usados con Radix UI).

---

## 🧠 1. Jerarquía y Gestión del Estado

El error más común en React es usar `useState` para todo. Saber **dónde** guardar cada dato define la escalabilidad del proyecto.

| Tipo de Estado | ¿Qué incluye? | ¿Dónde se guarda? | Herramienta |
| :--- | :--- | :--- | :--- |
| **Estado Local (UI)** | ¿Un modal está abierto? Texto temporal de un input. Animaciones. | Memoria del componente. | `useState` |
| **Estado de URL** | Filtros de búsqueda, tab activo, paginación. | En la URL del navegador. | `useSearchParams` / `useRouter` |
| **Estado Global (App)** | Tema oscuro/claro, sesión del usuario, carrito de compras. | Accesible en toda la app. | `Context API` o `Zustand` |
| **Estado del Servidor** | Lista de canchas, fixtures, reservas (datos que vienen de la DB). | Caché asíncrona del cliente. | `TanStack Query` |

> **Regla de Oro de la URL:** Si un usuario querría copiar el enlace y enviárselo a un amigo para que vea exactamente la misma vista filtrada, **ese estado debe ir en la URL**, no en `useState`.

---

## 🚫 2. Antipatrones Comunes (Lo que NO debes hacer)

### ❌ El Componente Dios (God Component)
Archivos gigantes (+300 líneas) que hacen peticiones a la API, filtran arreglos de datos, manejan la lógica de formularios y, además, dibujan la interfaz visual.
*   **Por qué es malo:** Es imposible de mantener, testear y reutilizar. Fomenta el código espagueti.
*   **La solución:** Dividir responsabilidades. Crear subcomponentes más pequeños.

### ❌ Fetching manual con `useEffect` (Race Conditions)
Hacer peticiones a la API con `fetch` o `axios` dentro de un `useEffect` y guardar la respuesta en un `useState`.
*   **Por qué es malo:** Si un usuario hace clic en varios filtros rápidamente, las respuestas del servidor pueden llegar desordenadas (la última petición termina antes que la primera), sobreescribiendo el estado con información vieja (Condición de Carrera). Tampoco maneja caché automática ni reintentos si falla la red.
*   **La solución:** Usar siempre `TanStack Query` para hablar con APIs externas.

### ❌ Validación tardía
Esperar a que el backend lance un error 500 o 400 para decirle al usuario que la contraseña es corta.
*   **Por qué es malo:** Crea una mala experiencia de usuario y sobrecarga el servidor.
*   **La solución (Fail-Fast):** Validar en el lado del cliente con **Zod** antes de enviar el formulario. Y volver a validar en la entrada de la API con **Pydantic**.

---

## ✅ 3. Patrones de Diseño Recomendados (Lo que SÍ debes hacer)

### 🧩 Separación "Smart vs Dumb" (Contenedor / Presentacional)
*   **Componentes Inteligentes (Contenedores):** Son las "Páginas" (`page.tsx`). Se encargan de obtener los datos de la API, leer la URL y gestionar la lógica principal. Casi no tienen HTML complejo.
*   **Componentes Tontos (Presentacionales):** Son elementos como `<TarjetaCancha />` o `<BotonPrimario />`. Solo reciben `props` (datos) e imprimen HTML y CSS. Son altamente reutilizables.

### ⚡ Memoización (`useMemo` y `useCallback`)
Cuando tienes cálculos matemáticos pesados, o filtros sobre miles de elementos en memoria (ej: buscar 1 partido en una lista de 5000).
*   **Problema:** React vuelve a renderizar todo el componente cuando cambia cualquier estado. Si no proteges el cálculo, la PC del usuario se congelará repetidamente calculando lo mismo 10 veces por segundo.
*   **Solución:** Usa `useMemo` para guardar el resultado de un cálculo en memoria. React solo volverá a calcularlo si las variables de las que depende cambian.

### 🖥️ Client Components vs Server Components en Next.js
*   Por defecto, en Next.js App Router, todo se renderiza en el servidor (Server Component). Esto es excelente para el SEO y para descargar menos JavaScript al cliente.
*   Sin embargo, si tu componente necesita interactividad (botones, clics, `useState`, `useEffect`, `onClick`), debes declarar obligatoriamente `"use client"` al principio del archivo. Intenta mantener los Client Components lo más abajo posible en el árbol de dependencias.
