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
