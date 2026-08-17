# Guía de Testing Manual (PartidoYa)

Esta guía centraliza los pasos de validación en la interfaz de usuario (Frontend) para garantizar que la experiencia cumpla con los Criterios de Aceptación (AC) definidos en el MVP.

---

## Bloque 1 (Sprints 1 y 2)
### US 1, 2, 3 (Usuarios) y US 4, 5, 6, 8, 9 (Canchas y Partidos)

✅ **Checklist Visual (Bloque 1):**
- [ ] Entra a la página de Registro y envía el formulario vacío. Verifica que todos los campos requeridos se marquen en rojo.
- [ ] Registra un usuario completo y asegúrate de que el login te deje entrar a tu perfil.
- [ ] En la edición de perfil (US 3), cambia tu edad y zona. Dale a guardar. Verifica (recargando la página) que los datos persistan y que el email no se haya modificado (si el frontend permitió intentarlo).
- [ ] Siendo Dueño (admin), ve a "Crear Cancha". Pon un precio de $0 y verifica que el formulario arroje error. 
- [ ] Pon horario de apertura "20:00" y cierre "10:00". Verifica el error en UI.
- [ ] Crea la cancha correctamente, edita su superficie de juego y guarda de nuevo.
- [ ] Desde la vista de Jugador, intenta crear un "Partido Abierto" en el pasado (ej. ayer). Debería bloquearse.
- [ ] Crea un Partido Cerrado. Luego, crea un Partido Abierto válido.
- [ ] Como Dueño, intenta "Eliminar" la cancha donde acabas de crear los partidos. Debe saltar un error advirtiendo que tiene reservas pendientes.

---

## Bloque 2 (Sprints 3 y 4)
### US 10, 11, 12, 13, 23 (Partidos/Notificaciones) y US 24, 25, 26, 27 (Reservas de Dueños)

✅ **Checklist Visual (Bloque 2):**
- [ ] **US 9 & 10:** Inicia sesión con la Cuenta A. Crea un partido "Abierto" a futuro. 
- [ ] Inicia sesión con la Cuenta B. Ve a "Partidos Disponibles" e inscríbete al partido de la Cuenta A (US 10). Intenta inscribirte de nuevo; el botón debe estar deshabilitado u oculto.
- [ ] **US 11:** Con la Cuenta B, ve a "Mis Partidos" y date de baja. Confirma el SweetAlert. Verifica que ya no aparezcas en la lista de inscriptos.
- [ ] **US 13:** Con la Cuenta A (Organizador), ve a "Mis Partidos" -> Editar, y cambia la hora del partido a una hora más tarde.
- [ ] **US 23:** Vuelve a la Cuenta B (si la volviste a inscribir tras darte de baja) y revisa la campanita de notificaciones en el navbar. Debe haber una alerta de reprogramación.
- [ ] **US 12:** Con la Cuenta A (Organizador), dale a "Cancelar Partido". Confirma la alerta.
- [ ] **US 24:** Inicia sesión con cuenta de Dueño y ve a "Agenda" (US 27). Haz clic en un recuadro verde (Disponible) futuro y registra una "Reserva Manual" (deja el cliente vacío para probar la opcionalidad).
- [ ] **US 25:** En la agenda, haz clic en la reserva recién creada e intenta cambiarle el horario a un turno que ya está ocupado (debe dar error y volver al horario anterior). Cambia el horario a un turno libre y guarda.
- [ ] **US 26:** Haz clic de nuevo en la reserva manual reprogramada y presiona "Cancelar Reserva". Verifica que el cuadro en la agenda vuelva a ponerse verde (Disponible).

---

## Bloque 3 (Sprint 5)
### US 14, 15, 16, 17, 22 (Torneos - ABM e Inscripciones)

✅ **Checklist Visual (Bloque 3):**
- [ ] **US 14:** Inicia sesión con la Cuenta A (Organizador). Ve a la sección de Torneos y haz clic en "Crear Torneo". Deja campos vacíos e intenta crear (verifica errores).
- [ ] Crea un torneo con modalidad Eliminación Directa, 6 equipos (debería dar error, ya que no es potencia de 2).
- [ ] Crea el torneo correctamente.
- [ ] **US 16:** Inicia sesión con la Cuenta B. Ve a la vista principal de Torneos (Torneos Disponibles) y verifica que aparezca la tarjeta del torneo creado.
- [ ] **US 15:** Con la Cuenta B, haz clic en el torneo y luego en "Inscribir equipo".
- [ ] Agrega menos jugadores del mínimo requerido para la modalidad de ese torneo e intenta guardar (verifica el error).
- [ ] Agrega a los jugadores de forma correcta y confirma la inscripción.
- [ ] **US 17:** Ve a la sección "Mis Torneos" y verifica que el torneo aparezca en la pestaña correspondiente (Próximos) y que la información esté actualizada.
- [ ] **US 22:** Inicia sesión nuevamente con la Cuenta A (Organizador). Accede a "Mis Torneos", selecciona el torneo y presiona "Cancelar Torneo". Confirma la alerta.
- [ ] Con la Cuenta B, revisa tu sección de "Mis Torneos" y verifica que el torneo cancelado haya desaparecido de los Próximos, o aparezca en una pestaña separada de Cancelados.

---

## Bloque 4 (Sprints 6) - Checklist Funcional (Gestión de Torneos)

**US 18: Generar fixture del torneo**
- [ ] Entrar al detalle del Torneo "ED Test".
- [ ] Verificar que el botón "Generar Fixture" esté visible (y no lo esté si entro con otro usuario).
- [ ] Hacer clic en "Generar Fixture".
- [ ] Verificar que el estado del torneo cambie a "En Curso".
- [ ] Verificar que ahora se muestra la grilla de partidos vacíos (pendientes).

**US 21: Editar configuración del torneo (Programar partidos)**
- [ ] Seleccionar un partido pendiente en el Fixture.
- [ ] Hacer clic en "Programar".
- [ ] Elegir una cancha, fecha y horario (que cumplan las reglas del torneo y de la zona).
- [ ] Guardar y comprobar que el partido refleje la información nueva.

**US 19: Cargar resultados de los partidos**
- [ ] Para un partido ya programado, hacer clic en "Cargar Resultado".
- [ ] Intentar cargar un resultado de un partido no programado o cuya fecha sea futura (esperar error visible).
- [ ] Cargar goles (ej: 2 a 1) y asignar una tarjeta amarilla a un jugador.
- [ ] Guardar. Verificar que el partido pasa a estado "Finalizado".
- [ ] En un torneo de Eliminación Directa, verificar que NO se permite el empate y que el ganador avanza a la siguiente llave.

**US 20 & 28 & 29: Visualizar Estadísticas y Dashboard**
- [ ] Ir a la pestaña "Tabla de Posiciones" (en torneo TCT o FG) y verificar que el equipo ganador sumó 3 puntos.
- [ ] Ir a la pestaña "Estadísticas" y verificar que el goleador y el jugador con tarjeta aparezcan listados correctamente.
- [ ] Verificar en el panel "Dashboard" del Organizador que los porcentajes (partidos jugados vs totales) se hayan actualizado.
