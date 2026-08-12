from fastapi import BackgroundTasks
from . import notificacion_service

def _obtener_nombre_completo(usuario):
    return f"{usuario.nombre} {usuario.apellido}" if usuario else "El organizador"

def notificar_torneo_cancelado(torneo, background_tasks: BackgroundTasks):
    usuarios_ids = set()
    for equipo in torneo.equipos_inscriptos:
        for jugador in equipo.jugadores:
            if jugador.id != torneo.organizador_id:
                usuarios_ids.add(jugador.id)

    if not usuarios_ids:
        return

    org_nom = _obtener_nombre_completo(torneo.organizador)
    fecha_str = torneo.fecha_inicio.strftime("%d/%m/%Y") if hasattr(torneo.fecha_inicio, "strftime") else str(torneo.fecha_inicio)
    
    mensaje = f"El torneo '{torneo.nombre}' organizado por {org_nom} (inicio: {fecha_str}) ha sido cancelado."

    background_tasks.add_task(
        notificacion_service.lanzar_notificaciones_bg,
        usuarios_ids=usuarios_ids,
        tipo="torneo_cancelado",
        mensaje=mensaje,
        partido_id=None  
    )