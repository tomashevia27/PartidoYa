import sys
import os
import random
from datetime import datetime, timedelta, date, time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from app.core.db import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://teamup_user:oLnFneAtzOS1KrW0EBCl9KBs6BYQIcjh@dpg-d8bqhul8nd3s738tbc20-a.virginia-postgres.render.com/teamup_db_yilz")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.models.usuario_model import Usuario, RolUsuario
from app.models.torneo_model import Torneo, FormatoTorneo, EstadoTorneo
from app.models.partido_model import Partido
from app.models.cancha_model import Cancha
from app.models.equipo_model import Equipo
from app.models.notificacion_model import Notificacion
from app.schemas.equipo_schemas import InscripcionEquipoCreate
from app.services import torneo_service
from app.core.security import get_password_hash

def cargar_torneo_prueba():
    db = SessionLocal()
    try:
        print("Iniciando carga de torneo de prueba...")
        
        # Parche de emergencia: hashear contraseñas en texto plano que ya se guardaron
        usuarios_rotos = db.query(Usuario).filter(Usuario.password == "password123").all()
        if usuarios_rotos:
            for u in usuarios_rotos:
                u.password = get_password_hash("password123")
            db.commit()
            print(f"Se arreglaron las contraseñas de {len(usuarios_rotos)} usuarios.")
        
        # Buscar un admin/organizador
        organizador = db.query(Usuario).filter(Usuario.rol == RolUsuario.admin).first()
        if not organizador:
            organizador = Usuario(
                nombre="Admin",
                apellido="Test",
                email="admin@test.com",
                password=get_password_hash("password123"),
                edad=30,
                genero="Masculino",
                zona="Caballito",
                rol=RolUsuario.admin,
                email_confirmado=True,
                partidos_a_favor=0
            )
            db.add(organizador)
            db.commit()
            db.refresh(organizador)
            print("Creado admin@test.com (password123)")

        print("1. Creando/Recuperando jugadores...")
        # Asegurar que hay al menos 20 jugadores (4 equipos de 5)
        jugadores = []
        for i in range(1, 21):
            email = f"jugador{i}@test.com"
            usuario = db.query(Usuario).filter(Usuario.email == email).first()
            if not usuario:
                usuario = Usuario(
                    nombre=f"Jugador{i}",
                    apellido="Test",
                    email=email,
                    password=get_password_hash("password123"),
                    edad=25,
                    genero="Masculino",
                    zona="Caballito",
                    rol=RolUsuario.jugador,
                    email_confirmado=True,
                    partidos_a_favor=0
                )
                db.add(usuario)
                db.commit()
                db.refresh(usuario)
            jugadores.append(usuario)
        
        print("Jugadores listos. Pueden loguearse con jugador1@test.com y password 'password123'")
        
        print("2. Creando Torneo 'Abierto para inscripción'...")
        datos_torneo = Torneo(
            nombre=f"Torneo de Prueba QA {random.randint(1000, 9999)}",
            fecha_inicio=datetime.now() + timedelta(days=10),
            fecha_fin=datetime.now() + timedelta(days=30),
            formato=FormatoTorneo.fase_grupos,
            zona="Caballito",
            dias_operativos=127,
            franja_horaria="18:00-23:00",
            max_equipos=8,
            min_integrantes_por_equipo=5,
            costo_inscripcion=35000.0,
            fase_final="semifinal",
            ida_y_vuelta=False,
            estado=EstadoTorneo.abierto,
            organizador_id=organizador.id
        )
        
        db.add(datos_torneo)
        db.commit()
        db.refresh(datos_torneo)
        
        print("3. Inscribiendo 4 equipos (dejando 4 cupos libres)...")
        nombres_equipos = ["Los QA", "Deportivo Frontend", "Backend FC", "DevOps United"]
        
        for i in range(4):
            start_idx = i * 5
            equipo_jugadores = jugadores[start_idx:start_idx+5]
            emails = [j.email for j in equipo_jugadores]
            
            inscripcion = InscripcionEquipoCreate(
                nombre=nombres_equipos[i],
                jugadores_emails=emails
            )
            capitan_id = equipo_jugadores[0].id
            torneo_service.inscribir_equipo(db, datos_torneo.id, inscripcion, capitan_id)
            print(f"Equipo {nombres_equipos[i]} inscrito exitosamente con capitan {equipo_jugadores[0].email}")
            
        print(f"¡Torneo ID {datos_torneo.id} creado con éxito y listo para tests!")

    except Exception as e:
        print(f"Error durante la carga: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cargar_torneo_prueba()
