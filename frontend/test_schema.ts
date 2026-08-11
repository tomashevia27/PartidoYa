import { z } from "zod";
// Copied schemas
const JugadorSimpleSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().optional(),
});
const EquipoInscriptoSchema = z.object({
  id: z.number(),
  nombre: z.string().optional(),
  nombre_equipo: z.string().optional(),
  jugadores: z.union([z.string(), z.array(JugadorSimpleSchema)]),
  escudo: z.string().nullable().optional(),
});
const ResultadosFinalesSchema = z.object({
  campeon: z.object({
    equipo_id: z.number().nullable().optional(),
    equipo_nombre: z.string().nullable().optional(),
  }).nullable().optional(),
  goleador: z.object({
    usuario_id: z.number().nullable().optional(),
    nombre: z.string().nullable().optional(),
    goles: z.number().nullable().optional(),
  }).nullable().optional(),
  valla_invicta: z.object({
    equipo_id: z.number().nullable().optional(),
    nombre: z.string().nullable().optional(),
    goles_recibidos: z.number().nullable().optional(),
  }).nullable().optional(),
});
const TorneoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional(),
  formato: z.string(),
  zona: z.string(),
  dias_operativos: z.number(),
  franja_horaria: z.string(),
  min_integrantes_por_equipo: z.number().optional(),
  max_equipos: z.number(),
  costo_inscripcion: z.number(),
  ida_y_vuelta: z.boolean(),
  fase_final: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  reglas: z.string().nullable().optional(),
  estado: z.string(),
  organizador_id: z.number().optional(),
  equipos_inscriptos: z.number(),
  equipos: z.array(EquipoInscriptoSchema).optional(),
  lugar: z.string(),
  cupos_restantes: z.number().optional(),
  rol_usuario: z.enum(["Organizador", "Jugador"]).optional(),
  resultados_finales: ResultadosFinalesSchema.nullable().optional(),
});

const ESTADO_MAP: Record<string, string> = {
  "abierto": "Abierto para inscripción",
  "en_curso": "En curso",
  "finalizado": "Finalizado",
  "cancelado": "Cancelado",
}

const FORMATO_MAP: Record<string, string> = {
  "eliminacion_directa": "Eliminación directa",
  "fase_grupos": "Fase de grupos",
  "fase_grupos_8avos": "Fase de grupos + 8vos",
  "fase_grupos_16avos": "Fase de grupos + 16vos",
  "todos_contra_todos": "Todos contra todos",
}

function normalizarTorneo(t: any): any {
  const equiposArray = Array.isArray(t.equipos_inscriptos)
    ? t.equipos_inscriptos.map((eq: any) => ({
      id: eq.id,
      nombre_equipo: eq.nombre || eq.nombre_equipo,
      jugadores: eq.jugadores || "[]",
      escudo: eq.escudo
    }))
    : (t.equipos || []);
  const inscriptosCount = Array.isArray(t.equipos_inscriptos) ? t.equipos_inscriptos.length : (t.inscriptos ?? t.equipos_inscriptos ?? 0);

  return {
    ...t,
    estado: ESTADO_MAP[t.estado] ?? t.estado,
    formato: FORMATO_MAP[t.formato] ?? t.formato,
    costo_inscripcion: Number(t.costo_inscripcion ?? 0),
    equipos_inscriptos: inscriptosCount,
    equipos: equiposArray,
    max_equipos: t.max_equipos ?? (inscriptosCount + (t.cupos_restantes || 0)),
    cupos_restantes: t.cupos_restantes ?? (t.max_equipos ? t.max_equipos - inscriptosCount : 0),
  }
}

async function test() {
    try {
        const res = await fetch("http://localhost:8000/api/torneos/2");
        const json = await res.json();
        console.log("Raw JSON:", JSON.stringify(json, null, 2));
        const norm = normalizarTorneo(json);
        console.log("Normalized:", JSON.stringify(norm, null, 2));
        TorneoSchema.parse(norm);
        console.log("Schema parsed successfully");
    } catch(e) {
        console.error("Error parsing:", e);
    }
}
test();
