from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from ..core.dependencies import get_db, require_admin
from ..models.usuario_model import Usuario
from ..schemas.partido_schemas import ReservaManualCreate, PartidoRespuesta, ReprogramarReserva
from ..services import reserva_admin_service

router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.post("/manual", response_model=PartidoRespuesta)
def crear_reserva_manual(
    datos: ReservaManualCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Crea una reserva manual en la agenda del dueño de cancha."""
    return reserva_admin_service.crear_reserva_manual(db, current_user, datos)


@router.post("/bloquear", response_model=PartidoRespuesta)
def crear_bloqueo_turno(
    datos: ReservaManualCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Bloquea un turno para que no esté disponible para reservas."""
    return reserva_admin_service.crear_bloqueo_turno(db, current_user, datos)


@router.delete("/bloquear/{partido_id}")
def eliminar_bloqueo_turno(
    partido_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Desbloquea un turno previamente bloqueado."""
    return reserva_admin_service.eliminar_bloqueo_turno(db, current_user, partido_id)

@router.delete("/{partido_id}", response_model=PartidoRespuesta)
def cancelar_reserva(
    partido_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Cancela una reserva o partido por parte del dueño."""
    return reserva_admin_service.cancelar_reserva_dueno(db, current_user, partido_id, background_tasks)

@router.put("/{partido_id}/reprogramar", response_model=PartidoRespuesta)
def reprogramar_reserva(
    partido_id: int,
    datos: ReprogramarReserva,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Reprograma una reserva a una nueva fecha/hora y opcionalmente a otra cancha."""
    return reserva_admin_service.reprogramar_reserva(db, current_user, partido_id, datos, background_tasks)
