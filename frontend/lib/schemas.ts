import { z } from "zod";

// Base schemas
export const JugadorSimpleSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().optional(),
});

export const EquipoInscriptoSchema = z.object({
  id: z.number(),
  nombre: z.string().optional(),
  nombre_equipo: z.string().optional(),
  jugadores: z.union([z.string(), z.array(JugadorSimpleSchema)]),
  escudo: z.string().optional(),
});

export const UserProfileSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().optional(),
  password: z.string().optional(),
  edad: z.number(),
  genero: z.string(),
  zona: z.string(),
  rol: z.string(),
  foto_perfil: z.string().optional(),
});

// Cancha
export const CanchaSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  tipo_superficie: z.string(),
  tamano: z.number(),
  iluminacion: z.boolean(),
  zona: z.string(),
  direccion: z.string(),
  precio_por_turno: z.number(),
  dias_operativos: z.number(),
  hora_apertura: z.string(),
  hora_cierre: z.string(),
  duracion_turno: z.number().optional(),
  fotos: z.string().optional(),
});

// Partido
export const PartidoSchema = z.object({
  id: z.number(),
  cancha_id: z.number(),
  fecha: z.string(),
  horario: z.string(),
  modalidad: z.string(),
  tipo: z.string(),
  cantidad_jugadores: z.number(),
  cupos_disponibles: z.number(),
  descripcion: z.string().optional(),
  estado: z.string(),
  cancha: z.object({
    id: z.number(),
    nombre: z.string(),
    zona: z.string(),
    direccion: z.string(),
    duracion_turno: z.number().optional(),
  }).optional(),
  organizador: UserProfileSchema.optional(),
  jugadores: z.array(UserProfileSchema).optional(),
});

// Torneo
export const TorneoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  formato: z.string(),
  zona: z.string(),
  dias_operativos: z.number(),
  franja_horaria: z.string(),
  min_integrantes_por_equipo: z.number(),
  max_equipos: z.number(),
  costo_inscripcion: z.number(),
  ida_y_vuelta: z.boolean(),
  fase_final: z.string().nullable().optional(),
  descripcion: z.string().optional(),
  reglas: z.string().optional(),
  estado: z.string(),
  organizador_id: z.number(),
  equipos_inscriptos: z.number(),
  equipos: z.array(EquipoInscriptoSchema).optional(),
  lugar: z.string(),
  cupos_restantes: z.number().optional(),
  rol_usuario: z.enum(["Organizador", "Jugador"]).optional(),
});

// We can define array schemas to use directly in fetchApi
export const CanchaArraySchema = z.array(CanchaSchema);
export const PartidoArraySchema = z.array(PartidoSchema);
export const TorneoArraySchema = z.array(TorneoSchema);

export const MisPartidosSchema = z.object({
  organizados: z.array(PartidoSchema),
  inscritos: z.array(PartidoSchema),
});
export type MisPartidosData = z.infer<typeof MisPartidosSchema>;

export const TorneoFormSchema = z.object({
  nombre: z.string().min(1, "El nombre del torneo es obligatorio."),
  fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria."),
  fecha_fin: z.string().min(1, "La fecha de fin es obligatoria."),
  formato: z.enum(["eliminacion_directa", "fase_grupos", "todos_contra_todos"]),
  zona: z.string().min(1, "La zona es obligatoria."),
  dias_operativos: z.number().min(1, "Debe seleccionar al menos un día operativo."),
  apertura_h: z.string().min(1, "Requerido").regex(/^\d+$/, "Solo números"),
  apertura_m: z.string().min(1, "Requerido").regex(/^\d+$/, "Solo números"),
  cierre_h: z.string().min(1, "Requerido").regex(/^\d+$/, "Solo números"),
  cierre_m: z.string().min(1, "Requerido").regex(/^\d+$/, "Solo números"),
  max_equipos: z.number().min(2, "Mínimo 2 equipos"),
  min_integrantes_por_equipo: z.number().min(5, "Mínimo 5 jugadores"),
  ida_y_vuelta: z.boolean(),
  fase_final: z.string().optional(),
  costo_inscripcion: z.number().min(0, "El costo no puede ser negativo."),
  descripcion: z.string().optional(),
  reglas: z.string().optional(),
}).superRefine((data, ctx) => {
  const inicio = new Date(data.fecha_inicio + "T00:00:00")
  const fin = new Date(data.fecha_fin + "T00:00:00")
  if (fin <= inicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha de fin debe ser posterior a la fecha de inicio.",
      path: ["fecha_fin"]
    });
  }

  const ah = data.apertura_h.padStart(2, "0")
  const am = data.apertura_m.padStart(2, "0")
  const ch = data.cierre_h.padStart(2, "0")
  const cm = data.cierre_m.padStart(2, "0")
  if (`${ah}:${am}` >= `${ch}:${cm}`) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El horario de cierre debe ser posterior al de apertura.",
      path: ["cierre_h"]
    });
  }
});

export type TorneoFormData = z.infer<typeof TorneoFormSchema>;
