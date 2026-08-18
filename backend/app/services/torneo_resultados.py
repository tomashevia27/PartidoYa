from sqlalchemy.orm import Session

from ..models.torneo_model import FormatoTorneo
from ..models.partido_torneo import PartidoTorneo, FaseTorneo, EstadoPartidoTorneo
from ..schemas.torneo_schemas import CampeonResponse, JugadorDestacadoResponse, VallaInvictaDestacadaResponse


def calcular_resultados_finales(db: Session, torneo_id: int, formato: FormatoTorneo) -> dict:
    from .partido_torneo_service import (
        tabla_posiciones_torneo,
        top_jugadores_por_goles,
        top_equipos_vallas_invictas,
    )

    campeon = _resolver_campeon(db, torneo_id, formato)
    goleador = _resolver_goleador(db, torneo_id)
    valla_invicta = _resolver_valla_invicta(db, torneo_id)

    return {
        "campeon": campeon.model_dump() if campeon else None,
        "goleador": goleador.model_dump() if goleador else None,
        "valla_invicta": valla_invicta.model_dump() if valla_invicta else None,
    }


def _resolver_campeon(db: Session, torneo_id: int, formato: FormatoTorneo):
    from .partido_torneo_service import tabla_posiciones_torneo

    if formato == FormatoTorneo.todos_contra_todos:
        tabla = tabla_posiciones_torneo(db, torneo_id)
        if tabla:
            return CampeonResponse(equipo_id=tabla[0].equipo_id, equipo_nombre=tabla[0].equipo_nombre)
        return None

    partido_final = db.query(PartidoTorneo).filter(
        PartidoTorneo.torneo_id == torneo_id,
        PartidoTorneo.fase == FaseTorneo.final,
        PartidoTorneo.estado == EstadoPartidoTorneo.finalizado,
    ).first()

    if not partido_final:
        return None

    goles_local = partido_final.goles_local or 0
    goles_visitante = partido_final.goles_visitante or 0

    if goles_local > goles_visitante:
        return CampeonResponse(
            equipo_id=partido_final.equipo_local_id,
            equipo_nombre=partido_final.equipo_local.nombre if partido_final.equipo_local else None,
        )
    if goles_visitante > goles_local:
        return CampeonResponse(
            equipo_id=partido_final.equipo_visitante_id,
            equipo_nombre=partido_final.equipo_visitante.nombre if partido_final.equipo_visitante else None,
        )
    return None


def _resolver_goleador(db: Session, torneo_id: int):
    from .partido_torneo_service import top_jugadores_por_goles

    top_goleadores = top_jugadores_por_goles(db, torneo_id, limit=1)
    if not top_goleadores or top_goleadores[0].valor == 0:
        return None

    tg = top_goleadores[0]
    return JugadorDestacadoResponse(
        usuario_id=tg.usuario_id,
        nombre=f"{tg.usuario_nombre} {tg.usuario_apellido}".strip(),
        goles=tg.valor,
    )


def _resolver_valla_invicta(db: Session, torneo_id: int):
    from .partido_torneo_service import top_equipos_vallas_invictas

    top_vallas = top_equipos_vallas_invictas(db, torneo_id, limit=1)
    if not top_vallas:
        return None

    tv = top_vallas[0]
    return VallaInvictaDestacadaResponse(
        equipo_id=tv.equipo_id,
        nombre=tv.equipo_nombre,
        goles_recibidos=tv.goles_recibidos,
    )
