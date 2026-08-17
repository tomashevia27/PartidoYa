from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from ..models.usuario_model import Usuario, RolUsuario
from ..schemas.partido_schemas import ReservaManualCreate, ReprogramarReserva
from ..repositories import partido_repository, cancha_repository
from ..services import partido_notificador
from ..services.partido_service import (
    _obtener_ahora_local,
    _validar_fecha_futura,
    _validar_y_obtener_datos_cancha,
)
from ..models.partido_model import Partido


def crear_reserva_manual(db: Session, current_user: Usuario, datos: ReservaManualCreate):
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(status_code=403, detail="Solo los dueños de cancha pueden cargar reservas manuales")

    _validar_fecha_futura(datos.fecha, datos.horario, "No se puede reservar un turno que ya pasó o está en curso")

    cancha, modalidad, cantidad_jugadores = _validar_y_obtener_datos_cancha(
        db, datos.cancha_id, datos.fecha, datos.horario
    )

    cancha.verificar_propietario(current_user.id, "No podés cargar una reserva en una cancha que no te pertenece")

    nuevo_partido = Partido.crear_reserva_manual(
        cancha.id, datos.fecha, datos.horario, modalidad, cantidad_jugadores,
        current_user.id, datos.cliente_nombre, datos.cliente_apellido, datos.cliente_telefono
    )

    resultado = partido_repository.guardar_partido(db, nuevo_partido)
    db.commit()
    return resultado

def crear_bloqueo_turno(db: Session, current_user: Usuario, datos: ReservaManualCreate):
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(status_code=403, detail="Solo los dueños de cancha pueden bloquear turnos")

    cancha, modalidad, cantidad_jugadores = _validar_y_obtener_datos_cancha(
        db, datos.cancha_id, datos.fecha, datos.horario
    )

    cancha.verificar_propietario(current_user.id, "No podés bloquear un turno en una cancha que no te pertenece")

    nuevo_partido = Partido.crear_bloqueo(
        cancha.id, datos.fecha, datos.horario, modalidad, cantidad_jugadores, current_user.id
    )

    resultado = partido_repository.guardar_partido(db, nuevo_partido)
    db.commit()
    return resultado

def eliminar_bloqueo_turno(db: Session, current_user: Usuario, partido_id: int):
    partido = partido_repository.obtener_por_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Bloqueo no encontrado")

    partido.verificar_desbloqueo()

    cancha = cancha_repository.obtener_por_id(db, partido.cancha_id)
    cancha.verificar_propietario(current_user.id, "No podés desbloquear un turno en una cancha que no te pertenece")

    db.delete(partido)
    db.commit()
    return {"mensaje": "Bloqueo eliminado exitosamente"}

def cancelar_reserva_dueno(db: Session, current_user: Usuario, partido_id: int, background_tasks: BackgroundTasks):
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(status_code=403, detail="Solo los dueños de cancha pueden cancelar reservas")

    partido = partido_repository.obtener_por_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    _validar_fecha_futura(partido.fecha, partido.horario, "No podés cancelar una reserva que ya ocurrió o está en curso")

    cancha = cancha_repository.obtener_por_id(db, partido.cancha_id)

    cancha.verificar_propietario(current_user.id, "No podés cancelar reservas de canchas que no te pertenecen")
    partido.cancelar_por_admin()

    if not partido.reserva_manual and partido.organizador_id:
        partido_notificador.notificar_reserva_cancelada_por_dueno(cancha, partido, background_tasks)

    db.commit()
    db.refresh(partido)
    return partido

def reprogramar_reserva(db: Session, current_user: Usuario, partido_id: int, datos: ReprogramarReserva, background_tasks: BackgroundTasks):
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(status_code=403, detail="Solo los dueños de cancha pueden reprogramar reservas")

    partido = partido_repository.obtener_por_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    partido.verificar_reprogramacion()

    cancha_id_destino = datos.cancha_id if datos.cancha_id else partido.cancha_id

    _validar_fecha_futura(datos.fecha, datos.horario, "La nueva fecha y hora deben ser futuras")

    cancha, modalidad, cantidad_jugadores = _validar_y_obtener_datos_cancha(
        db, cancha_id_destino, datos.fecha, datos.horario, excluir_partido_id=partido.id
    )

    cancha.verificar_propietario(current_user.id, "No podés reprogramar reservas en canchas que no te pertenecen")

    if datos.cancha_id and datos.cancha_id != partido.cancha_id:
        cancha_original = cancha_repository.obtener_por_id(db, partido.cancha_id)
        cancha_original.verificar_propietario(current_user.id, "No podés mover reservas desde canchas que no te pertenecen")

    fecha_anterior = partido.fecha
    horario_anterior = partido.horario
    cancha_id_anterior = partido.cancha_id

    partido.reprogramar(datos.cancha_id or partido.cancha_id, datos.fecha, datos.horario, modalidad, cantidad_jugadores)

    if not partido.reserva_manual and partido.organizador_id:
        partido_notificador.notificar_reserva_reprogramada(
            cancha, partido, fecha_anterior, horario_anterior, cancha_id_anterior, background_tasks
        )

    db.commit()
    db.refresh(partido)
    return partido
