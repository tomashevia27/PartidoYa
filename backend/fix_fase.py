import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from app.core.db import Base, SessionLocal
from app.models.usuario_model import Usuario
from app.models.torneo_model import Torneo
from app.models.partido_model import Partido
from app.models.partido_torneo import PartidoTorneo
from app.models.cancha_model import Cancha
from app.models.equipo_model import Equipo
from app.models.notificacion_model import Notificacion

db = SessionLocal()
try:
    torneos = db.query(Torneo).filter(Torneo.nombre.like('Torneo de Prueba QA%')).all()
    for torneo in torneos:
        if torneo.fase_final == 'semifinal':
            torneo.fase_final = 'semis'
    db.commit()
    print('Fase final corregida a semis en la base de datos')
finally:
    db.close()
