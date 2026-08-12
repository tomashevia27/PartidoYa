from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from ..core.db import Base


class Notificacion(Base):
    __tablename__ = "notificaciones"
    __table_args__ = (
        Index("idx_notificaciones_usuario_leida", "usuario_id", "leida"),
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    mensaje = Column(Text, nullable=False)
    partido_id = Column(Integer, ForeignKey("partidos.id"), nullable=True)
    leida = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, nullable=False)

    usuario = relationship("Usuario", back_populates="notificaciones")
    partido = relationship("Partido")
