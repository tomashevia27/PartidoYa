from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, timezone

# Zona horaria de la aplicación (Argentina UTC-3)
TZ_LOCAL = timezone(timedelta(hours=-3))

from ..models.partido_model import Partido
from ..models.usuario_model import Usuario
from ..repositories import partido_repository
from ..repositories import usuario_repository
from ..schemas.partido_schemas import PartidoCreate, PartidoUpdate
from ..repositories import cancha_repository
from ..services import partido_notificador

TAMANOS_MODALIDAD = {
    5: "futbol 5",
    7: "futbol 7",
    9: "futbol 9",
    11: "futbol 11"
}


# ─────────────────────────────────────────────
# Helpers Internos
# ─────────────────────────────────────────────

def _obtener_ahora_local():
    """Obtiene la fecha y hora actual en la zona horaria local, CON información de zona."""
    return datetime.now(TZ_LOCAL)

def _validar_fecha_futura(fecha_partido: date, hora_partido, mensaje_error: str):
    """Valida que la fecha y hora indicadas sean estrictamente futuras."""
    now = _obtener_ahora_local()
    # Si hora_partido es naive, le asignamos la zona horaria local
    hora_aware = hora_partido.replace(tzinfo=TZ_LOCAL) if getattr(hora_partido, 'tzinfo', None) is None else hora_partido
    
    if fecha_partido < now.date() or (fecha_partido == now.date() and hora_aware <= now.timetz()):
        raise HTTPException(status_code=400, detail=mensaje_error)

def _validar_y_obtener_datos_cancha(db: Session, cancha_id: int, fecha: date, horario, excluir_partido_id: int = None, for_update: bool = False):
    """Agrupa las validaciones de existencia, reglas operativas y disponibilidad de la cancha."""
    cancha = cancha_repository.obtener_por_id_bloqueado(db, cancha_id) if for_update else cancha_repository.obtener_por_id(db, cancha_id)

    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    if not cancha.activa:
        raise HTTPException(status_code=400, detail="La cancha no está activa")

    # Validar modalidad
    modalidad = TAMANOS_MODALIDAD.get(cancha.tamano)
    if not modalidad:
        raise HTTPException(status_code=400, detail="La cancha tiene un tamaño inválido")
    cantidad_jugadores = cancha.tamano * 2

    # Validar día y horario
    if not cancha.opera_en_fecha(fecha):
        raise HTTPException(status_code=400, detail="La cancha no opera ese día")
        
    if not cancha.opera_en_horario(horario):
        raise HTTPException(status_code=400, detail="La cancha no está disponible en ese horario")

    # Validar disponibilidad cruzada
    cancha_disponible = partido_repository.verificar_disponibilidad_cancha(
        db, cancha_id, fecha, horario, cancha.duracion_turno, excluir_partido_id=excluir_partido_id
    )
    if not cancha_disponible:
        raise HTTPException(status_code=400, detail="La cancha no está disponible en la fecha y horario seleccionados")

    return cancha, modalidad, cantidad_jugadores


# ─────────────────────────────────────────────
# Consultas y Filtros
# ─────────────────────────────────────────────

def obtener_mis_partidos(db: Session, usuario_id: int):
    organizados, inscritos = partido_repository.obtener_mis_partidos(db, usuario_id)
    return {"organizados": organizados, "inscritos": inscritos}

def obtener_partidos_disponibles(db: Session, zona: str = None, modalidad: str = None, fecha: date = None):
    return partido_repository.obtener_disponibles(db, zona, modalidad, fecha)

def obtener_filtros_disponibles(db: Session):
    return partido_repository.obtener_filtros_disponibles(db)

def obtener_detalle_partido(db: Session, partido_id: int):
    partido = partido_repository.obtener_por_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return partido


# ─────────────────────────────────────────────
# Acciones de Jugadores
# ─────────────────────────────────────────────

def inscribirse_a_partido(db: Session, partido_id: int, usuario_id: int, background_tasks: BackgroundTasks):
    partido = partido_repository.obtener_por_id_bloqueado(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    _validar_fecha_futura(partido.fecha, partido.horario, "No te podés inscribir a un partido que ya pasó")

    usuario = usuario_repository.obtener_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    partido.inscribir_jugador(usuario)

    resultado = partido_repository.guardar_inscripcion(db, partido, usuario)
    partido_notificador.notificar_inscripcion(partido, usuario, background_tasks)
    db.commit()
    return resultado

def bajarse_de_partido(db: Session, partido_id: int, usuario_id: int, background_tasks: BackgroundTasks):
    partido = partido_repository.obtener_por_id_bloqueado(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    _validar_fecha_futura(partido.fecha, partido.horario, "No te podés inscribir a un partido que ya pasó o está en curso")

    usuario = usuario_repository.obtener_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cancelacion_anticipada = partido.bajar_jugador(usuario, _obtener_ahora_local())

    resultado = partido_repository.guardar_baja_inscripcion(db, partido, usuario)
    partido_notificador.notificar_baja(partido, usuario, background_tasks)
    db.commit()
    return resultado


# ─────────────────────────────────────────────
# Acciones del Organizador (Jugador)
# ─────────────────────────────────────────────

def crear_partido(db: Session, organizador_id: int, datos: PartidoCreate, background_tasks: BackgroundTasks):
    if datos.tipo not in ["abierto", "cerrado"]:
        raise HTTPException(status_code=400, detail="El tipo de partido debe ser 'abierto' o 'cerrado'")

    _validar_fecha_futura(datos.fecha, datos.horario, "La fecha y hora deben ser futuras")

    cancha, modalidad, cantidad_jugadores = _validar_y_obtener_datos_cancha(
        db, datos.cancha_id, datos.fecha, datos.horario, for_update=True
    )

    if datos.tipo == "abierto":
        nuevo_partido = Partido.crear_abierto(cancha.id, datos.fecha, datos.horario, modalidad, cantidad_jugadores, 
            datos.cupos_disponibles, datos.descripcion, organizador_id)
    else:
        nuevo_partido = Partido.crear_cerrado(
            cancha.id, datos.fecha, datos.horario, modalidad, cantidad_jugadores, 
            datos.descripcion, organizador_id
        )

    resultado = partido_repository.guardar_partido(db, nuevo_partido)
    partido_notificador.notificar_propietario_reserva(cancha, resultado, background_tasks)
    db.commit()
    return resultado

def editar_partido(db: Session, partido_id: int, usuario_id: int, datos: PartidoUpdate, background_tasks: BackgroundTasks):
    partido = partido_repository.obtener_por_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    partido.verificar_edicion(usuario_id)
    _validar_fecha_futura(partido.fecha, partido.horario, "No se puede editar un partido que ya pasó")
    
    nueva_fecha = datos.fecha if datos.fecha is not None else partido.fecha
    nuevo_horario = datos.horario if datos.horario is not None else partido.horario
    nueva_cancha_id = datos.cancha_id if datos.cancha_id is not None else partido.cancha_id
    
    _validar_fecha_futura(nueva_fecha, nuevo_horario, "La nueva fecha y hora deben ser futuras")

    cancha, modalidad, cantidad_jugadores = _validar_y_obtener_datos_cancha(
        db, nueva_cancha_id, nueva_fecha, nuevo_horario, excluir_partido_id=partido.id
    )

    nuevo_tipo = datos.tipo if datos.tipo is not None else partido.tipo
    if nuevo_tipo not in ["abierto", "cerrado"]:
        raise HTTPException(status_code=400, detail="El tipo de partido debe ser 'abierto' o 'cerrado'")

    nuevo_cupos = datos.cupos_disponibles if datos.cupos_disponibles is not None else partido.cupos_disponibles

    # Variables para notificaciones
    cancha_id_anterior = partido.cancha_id
    fecha_anterior = partido.fecha
    horario_anterior = partido.horario
    descripcion_anterior = partido.descripcion
    cupos_anterior = partido.cupos_disponibles

    partido.actualizar_datos(nueva_cancha_id, nueva_fecha, nuevo_horario, modalidad, cantidad_jugadores, nuevo_tipo, nuevo_cupos, datos.descripcion)

    cambios = {}
    if fecha_anterior != nueva_fecha:
        cambios["fecha"] = {"anterior": fecha_anterior.strftime("%d/%m/%Y"), "nuevo": nueva_fecha.strftime("%d/%m/%Y")}
    if horario_anterior != nuevo_horario:
        cambios["horario"] = {"anterior": horario_anterior.strftime("%H:%M"), "nuevo": nuevo_horario.strftime("%H:%M")}
    if cancha_id_anterior != nueva_cancha_id:
        cancha_anterior_obj = cancha_repository.obtener_por_id(db, cancha_id_anterior)
        cambios["cancha"] = {
            "anterior": cancha_anterior_obj.nombre if cancha_anterior_obj else "desconocida",
            "nuevo": cancha.nombre
        }
    if datos.descripcion is not None and descripcion_anterior != datos.descripcion:
        cambios["descripcion"] = True
    if cupos_anterior != nuevo_cupos and nuevo_tipo == "abierto":
        cambios["cupos_disponibles"] = {"anterior": str(cupos_anterior), "nuevo": str(nuevo_cupos)}

    if cambios:
        partido_notificador.notificar_partido_editado(partido, cambios, background_tasks)

    if cancha_id_anterior != nueva_cancha_id:
        cancha_anterior_obj = cancha_repository.obtener_por_id(db, cancha_id_anterior)
        if cancha_anterior_obj:
            partido_notificador.notificar_cambio_cancha(cancha_anterior_obj, cancha, partido, background_tasks)

    db.commit()
    db.refresh(partido)
    return partido

def cancelar_partido(db: Session, partido_id: int, usuario_id: int, background_tasks: BackgroundTasks):
    partido = partido_repository.obtener_por_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    partido.cancelar_por_organizador(usuario_id)
    _validar_fecha_futura(partido.fecha, partido.horario, "No se puede cancelar un partido que ya pasó")

    partido_notificador.notificar_partido_cancelado(partido, background_tasks)

    cancha = cancha_repository.obtener_por_id(db, partido.cancha_id)
    if cancha:
        partido_notificador.notificar_propietario_cancelacion(cancha, partido, background_tasks)

    db.commit()
    db.refresh(partido)
    return partido