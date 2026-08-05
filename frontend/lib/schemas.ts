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
  escudo: z.string().nullable().optional(),
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
  duracion_turno: z.number().nullable().optional(),
  fotos: z.string().nullable().optional(),
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
  descripcion: z.string().nullable().optional(),
  estado: z.string(),
  cancha: z.object({
    id: z.number(),
    nombre: z.string(),
    zona: z.string(),
    direccion: z.string(),
    duracion_turno: z.number().optional(),
  }).nullable().optional(),
  organizador: UserProfileSchema.nullable().optional(),
  jugadores: z.array(UserProfileSchema).optional(),
});

export const ResultadosFinalesSchema = z.object({
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

// Torneo
export const TorneoSchema = z.object({
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

export const CanchaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre de la cancha es obligatorio."),
  tipo_superficie: z.string().min(1, "El tipo de superficie es obligatorio."),
  tamano: z.coerce.number({ invalid_type_error: "Seleccioná un tamaño válido." }).min(5, "El tamaño debe ser un número válido."),
  iluminacion: z.boolean(),
  zona: z.string().min(1, "La zona es obligatoria."),
  direccion: z.string().min(1, "La dirección exacta es obligatoria."),
  precio_por_turno: z.coerce.number({ invalid_type_error: "Debes ingresar un número válido." }).positive("El precio por turno debe ser mayor a cero."),
  dias_operativos: z.number().min(1, "Debe seleccionar al menos un día operativo."),
  apertura_h: z.string().min(1, "Requerido").regex(/^\d+$/, "Solo números"),
  apertura_m: z.enum(["00", "15", "30", "45"], { errorMap: () => ({ message: "Requerido" }) }),
  cierre_h: z.string().min(1, "Requerido").regex(/^\d+$/, "Solo números"),
  cierre_m: z.enum(["00", "15", "30", "45"], { errorMap: () => ({ message: "Requerido" }) }),
}).superRefine((data, ctx) => {
  if (data.apertura_m !== data.cierre_m) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Los minutos de apertura y cierre deben coincidir para evitar turnos incompletos.",
      path: ["cierre_m"]
    });
  }

  const ah = data.apertura_h.padStart(2, "0")
  const am = data.apertura_m
  const ch = data.cierre_h.padStart(2, "0")
  const cm = data.cierre_m
  if (`${ah}:${am}` >= `${ch}:${cm}`) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La hora de cierre debe ser posterior a la de apertura.",
      path: ["cierre_h"]
    });
  }
});

export type CanchaFormValues = z.infer<typeof CanchaFormSchema>;

export const PartidoFormSchema = z.object({
  cancha_id: z.coerce.number().positive("Debe seleccionar una cancha."),
  fecha: z.string().min(1, "La fecha es obligatoria."),
  horario: z.string().min(1, "El turno es obligatorio."),
  tipo: z.enum(["abierto", "cerrado"]),
  cupos_disponibles: z.coerce.number().optional(),
  max_cupos: z.number().optional(),
  descripcion: z.string().optional(),
}).superRefine((data, ctx) => {
  const matchDate = new Date(`${data.fecha}T${data.horario}`);
  const now = new Date();
  if (matchDate <= now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha y hora del partido deben ser en el futuro.",
      path: ["fecha"]
    });
  }

  if (data.tipo === "abierto") {
    if (data.cupos_disponibles === undefined || data.cupos_disponibles < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indicá la cantidad de lugares disponibles.",
        path: ["cupos_disponibles"]
      });
    } else if (data.max_cupos && data.cupos_disponibles > data.max_cupos) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Los cupos no pueden superar los lugares máximos disponibles (${data.max_cupos}).`,
        path: ["cupos_disponibles"]
      });
    }
  }
});

export type PartidoFormValues = z.infer<typeof PartidoFormSchema>;

export const JugadorSchema = z.object({
  nombre: z.string().min(1, "El nombre del jugador es obligatorio."),
  email: z.string().min(1, "El email es obligatorio.").email("Debe ser un correo válido.")
});

export const InscripcionEquipoSchema = z.object({
  nombre_equipo: z.string().min(1, "El nombre del equipo es obligatorio."),
  escudo: z.string().url("Debe ser una URL válida.").optional().or(z.literal("")),
  jugadores: z.array(JugadorSchema).min(1, "Debés ingresar al menos al capitán o primer jugador."),
  min_jugadores: z.number().optional(),
  max_jugadores: z.number().optional()
}).superRefine((data, ctx) => {
  if (data.min_jugadores && data.jugadores.length < data.min_jugadores) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `El equipo debe tener al menos ${data.min_jugadores} jugadores.`,
      path: ["jugadores"]
    });
  }
  if (data.max_jugadores && data.jugadores.length > data.max_jugadores) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `El equipo no puede tener más de ${data.max_jugadores} jugadores.`,
      path: ["jugadores"]
    });
  }
});

export type InscripcionEquipoValues = z.infer<typeof InscripcionEquipoSchema>;

export const LoginSchema = z.object({
  email: z.string().min(1, "El email es obligatorio.").email("Formato de email inválido."),
  password: z.string().min(1, "La contraseña es obligatoria.")
});
export type LoginValues = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  apellido: z.string().min(1, "El apellido es obligatorio."),
  email: z.string().min(1, "El email es obligatorio.").email("Formato de email inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(1, "Confirmar la contraseña es obligatorio."),
  edad: z.coerce.number().min(0, "La edad debe ser válida").optional().or(z.literal("").transform(() => undefined)),
  genero: z.string().optional(),
  zona: z.string().optional(),
  rol: z.enum(["jugador", "dueño"], { errorMap: () => ({ message: "Selecciona un rol válido" }) })
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});
export type RegisterValues = z.infer<typeof RegisterSchema>;

export const ProfileEditSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  apellido: z.string().min(1, "El apellido es obligatorio."),
  edad: z.coerce.number().min(0, "La edad debe ser mayor o igual a 0").optional().or(z.literal("").transform(() => undefined)),
  genero: z.string().optional(),
  zona: z.string().optional(),
  password: z.string().optional(),
});
export type ProfileEditValues = z.infer<typeof ProfileEditSchema>;

