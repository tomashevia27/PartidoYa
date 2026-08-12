from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime

# ==========================================
# 📘 GUÍA PARA AGREGAR NUEVAS NOTIFICACIONES
# ==========================================
# Si necesitas crear un nuevo tipo de notificación (ej: "torneo_empezado"):
# 1. Agrega el string exacto aquí abajo dentro de TipoNotificacion.
# 2. Agrega el MISMO string en frontend/services/notificaciones.service.ts (TipoNotificacion).
# 3. (Opcional) Asignale un ícono en frontend/components/notifications-panel.tsx (getNotificationIcon).
# 4. Usa tu nuevo string al llamar a notificacion_service.crear_notificaciones_bulk()
# ==========================================
TipoNotificacion = Literal[
    "partido_cancelado",
    "partido_editado",
    "jugador_inscripto",
    "jugador_baja",
    "reserva_cancha",
    "cancelacion_cancha",
    "cambio_cancha_perdida",
    "cambio_cancha_ganada",
    "reserva_cancelada_por_dueno",
    "reserva_reprogramada",
    "torneo_cancelado"
]

class NotificacionRespuesta(BaseModel):
    id: int
    tipo: TipoNotificacion
    mensaje: str
    partido_id: Optional[int] = None
    leida: bool
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificacionesListado(BaseModel):
    notificaciones: List[NotificacionRespuesta]
    total_no_leidas: int


class ConteoNoLeidas(BaseModel):
    total_no_leidas: int


class MensajeRespuesta(BaseModel):
    mensaje: str
