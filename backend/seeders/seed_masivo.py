import sys
import os
import random
import unicodedata
from datetime import datetime, timedelta, date, time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from faker import Faker

from app.core.db import Base 
from app.models.usuario_model import Usuario, RolUsuario
from app.models.cancha_model import Cancha
from app.models.partido_model import Partido
from app.models.torneo_model import Torneo
from app.models.partido_torneo import PartidoTorneo
from app.models.equipo_model import Equipo, equipo_jugadores
from app.models.notificacion_model import Notificacion
from app.core.security import get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://admin:admin123@postgres:5432/bdd_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

fake = Faker('es_AR')

def limpiar_string_para_email(texto: str) -> str:
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    return ''.join(e for e in texto if e.isalnum()).lower()

def run_seed():
    print("Iniciando Seeder Masivo...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        password_hash = get_password_hash("password123")

        # 1. Héroes
        print("1. Creando Usuarios Héroe...")
        heroes = [
            {"nombre": "Super", "apellido": "Admin", "email": "admin@test.com", "password": password_hash, "rol": RolUsuario.admin, "edad": 30, "genero": "Masculino", "zona": "CABA", "email_confirmado": True},
            {"nombre": "Super", "apellido": "Dueno", "email": "dueno@test.com", "password": password_hash, "rol": RolUsuario.admin, "edad": 40, "genero": "Masculino", "zona": "CABA", "email_confirmado": True},
            {"nombre": "Supa", "apellido": "Jugador", "email": "jugador@test.com", "password": password_hash, "rol": RolUsuario.jugador, "edad": 25, "genero": "Femenino", "zona": "CABA", "email_confirmado": True},
        ]
        
        usuarios_obj = []
        for h in heroes:
            if not db.query(Usuario).filter(Usuario.email == h["email"]).first():
                usuarios_obj.append(Usuario(**h))

        # 2. Faker Usuarios (500)
        print("2. Generando 500 Usuarios Faker...")
        emails_usados = set([h["email"] for h in heroes])
        
        for _ in range(500):
            nombre = fake.first_name()
            apellido = fake.last_name()
            base_email = f"{limpiar_string_para_email(nombre)}{limpiar_string_para_email(apellido)}@gmail.com"
            
            # Asegurar unicidad
            email = base_email
            counter = 1
            while email in emails_usados:
                email = f"{limpiar_string_para_email(nombre)}{limpiar_string_para_email(apellido)}{counter}@gmail.com"
                counter += 1
            emails_usados.add(email)

            usuarios_obj.append(Usuario(
                nombre=nombre,
                apellido=apellido,
                email=email,
                password=password_hash,
                rol=RolUsuario.jugador if random.random() > 0.1 else RolUsuario.admin,
                edad=random.randint(18, 50),
                genero=random.choice(["Masculino", "Femenino", "Otro"]),
                zona=fake.city(),
                email_confirmado=True,
                partidos_a_favor=random.randint(0, 10)
            ))
        
        db.add_all(usuarios_obj)
        db.commit()

        # Obtener IDs de usuarios guardados
        todos_usuarios = db.query(Usuario).all()
        admins = [u for u in todos_usuarios if u.rol == RolUsuario.admin]
        jugadores = [u for u in todos_usuarios if u.rol == RolUsuario.jugador]

        if not admins or not jugadores:
            print("Error: No hay suficientes usuarios para generar canchas o partidos.")
            return

        # 3. Faker Canchas (50)
        print("3. Generando 50 Canchas...")
        canchas_obj = []
        tamanos_modalidad = {5: "futbol 5", 7: "futbol 7", 9: "futbol 9", 11: "futbol 11"}
        
        for _ in range(50):
            tamano = random.choice(list(tamanos_modalidad.keys()))
            canchas_obj.append(Cancha(
                nombre=f"Cancha {fake.company()}",
                tipo_superficie=random.choice(["cesped", "sintetico", "cemento"]),
                tamano=tamano,
                iluminacion=random.choice([True, False]),
                zona=fake.city(),
                direccion=fake.address(),
                precio_por_turno=random.uniform(50000, 150000),
                dias_operativos=127, # Lunes a Domingo
                hora_apertura=time(8, 0),
                hora_cierre=time(23, 0),
                duracion_turno=60,
                propietario_id=random.choice(admins).id
            ))
        
        db.add_all(canchas_obj)
        db.commit()
        todas_canchas = db.query(Cancha).all()

        # 4. Faker Partidos / Reservas (2000)
        print("4. Generando 2000 Reservas...")
        partidos_obj = []
        for _ in range(2000):
            cancha = random.choice(todas_canchas)
            fecha = fake.date_between(start_date='-30d', end_date='+30d')
            horario = time(random.randint(8, 22), 0)
            modalidad = tamanos_modalidad.get(cancha.tamano, "futbol 5")
            cantidad_jugadores = cancha.tamano * 2
            
            # Mezclar abiertos, cerrados, reservas manuales
            tipo_rand = random.random()
            if tipo_rand < 0.6:
                # Partido abierto organizado por un jugador
                org = random.choice(jugadores)
                partido = Partido(
                    cancha_id=cancha.id,
                    fecha=fecha,
                    horario=horario,
                    modalidad=modalidad,
                    cantidad_jugadores=cantidad_jugadores,
                    tipo="abierto",
                    estado="pendiente",
                    cupos_disponibles=cantidad_jugadores - 1,
                    organizador_id=org.id,
                    reserva_manual=False
                )
            elif tipo_rand < 0.8:
                # Partido cerrado
                org = random.choice(jugadores)
                partido = Partido(
                    cancha_id=cancha.id,
                    fecha=fecha,
                    horario=horario,
                    modalidad=modalidad,
                    cantidad_jugadores=cantidad_jugadores,
                    tipo="cerrado",
                    estado="pendiente",
                    organizador_id=org.id,
                    reserva_manual=False
                )
            else:
                # Reserva manual por el dueño
                partido = Partido(
                    cancha_id=cancha.id,
                    fecha=fecha,
                    horario=horario,
                    modalidad=modalidad,
                    cantidad_jugadores=cantidad_jugadores,
                    tipo="cerrado",
                    estado="pendiente",
                    organizador_id=cancha.propietario_id,
                    reserva_manual=True,
                    cliente_nombre=fake.first_name(),
                    cliente_apellido=fake.last_name(),
                    cliente_telefono=fake.phone_number()
                )
            partidos_obj.append(partido)
            
        # Inserción en lote (bulk_save_objects es muy eficiente en SQLAlchemy)
        db.bulk_save_objects(partidos_obj)
        db.commit()

        print("¡Seeder masivo completado con éxito! ✅")
        print("Los usuarios pueden iniciar sesión con 'password123'")

    except Exception as e:
        print(f"Error en seeder masivo: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
