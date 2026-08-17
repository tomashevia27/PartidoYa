import pytest
from datetime import datetime, timedelta
from sqlalchemy import text

@pytest.fixture
def torneo_payload():
    futuro_1 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    futuro_2 = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    return {
        "nombre": "Torneo Base",
        "fecha_inicio": futuro_1,
        "fecha_fin": futuro_2,
        "formato": "eliminacion_directa",
        "zona": "CABA",
        "dias_operativos": 127,
        "franja_horaria": "10:00-20:00",
        "max_equipos": 8,
        "min_integrantes_por_equipo": 5,
        "costo_inscripcion": 1000
    }

def crear_jugadores(client, db_session, count=5, capitan_email=None):
    """Crea y retorna una lista de emails de jugadores activos"""
    from app.models.usuario_model import Usuario
    import uuid
    emails = []
    if capitan_email:
        emails.append(capitan_email)
        count -= 1
    for i in range(count):
        unique = str(uuid.uuid4())[:6]
        email = f"jugador_{i}_{unique}@test.com"
        client.post("/registro", json={
            "nombre": f"J{i}", "apellido": "Test", "email": email, "password": "password123",
            "edad": 20, "genero": "masculino", "zona": "CABA"
        })
        u = db_session.query(Usuario).filter_by(email=email).first()
        u.email_confirmado = True
        emails.append(email)
    db_session.commit()
    return emails

def inscribir_equipo(client, db_session, t_id, index):
    jugadores = crear_jugadores(client, db_session, 5)
    capitan = jugadores[0]
    res_login = client.post("/login", json={"email": capitan, "password": "password123"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post(f"/api/torneos/{t_id}/inscripciones", json={
        "nombre": f"Equipo {index}", "jugadores_emails": jugadores
    }, headers=headers)
    assert res.status_code == 201

# ==========================================
# US 14: ABM de Torneos
# ==========================================

def test_us14_crear_falla_fecha_pasada(client, organizador_activo, torneo_payload):
    torneo_payload["fecha_inicio"] = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 422

def test_us14_crear_falla_formato_inconsistente(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "eliminacion_directa"
    torneo_payload["max_equipos"] = 6  # Inválido para ED, debe ser potencia de 2 (4, 8, 16)
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 422

def test_us14_crear_ed_exitoso(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "eliminacion_directa"
    torneo_payload["max_equipos"] = 8
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 201

def test_us14_crear_fg_exitoso(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "fase_grupos"
    torneo_payload["max_equipos"] = 8
    torneo_payload["fase_final"] = "semis"
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 201

def test_us14_crear_tct_exitoso(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 6
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 201

# ==========================================
# US 15 y Bugs (Bloque 3): Inscripciones
# ==========================================

def test_us15_inscripcion_falla_faltan_jugadores(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    jugadores = crear_jugadores(client, db_session, 4, capitan_email=usuario_comun_activo["payload"]["email"])
    res = client.post(f"/api/torneos/{t_id}/inscripciones", json={
        "nombre": "Equipo Incompleto", "jugadores_emails": jugadores
    }, headers=usuario_comun_activo["headers"])
    assert res.status_code == 400

def test_us15_inscripcion_exitosa_y_baja(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    jugadores = crear_jugadores(client, db_session, 5, capitan_email=usuario_comun_activo["payload"]["email"])
    # Inscripción
    res_ins = client.post(f"/api/torneos/{t_id}/inscripciones", json={
        "nombre": "Equipo Completo", "jugadores_emails": jugadores
    }, headers=usuario_comun_activo["headers"])
    assert res_ins.status_code == 201

    # Baja
    res_baja = client.delete(f"/api/torneos/{t_id}/inscripciones", headers=usuario_comun_activo["headers"])
    assert res_baja.status_code == 200

def test_bug_inscripcion_torneo_caducado(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    # Hack DB para pasarlo al pasado (Torneo vencido)
    db_session.execute(text(f"UPDATE torneos SET fecha_inicio = '2020-01-01' WHERE id = {t_id}"))
    db_session.commit()

    jugadores = crear_jugadores(client, db_session, 5, capitan_email=usuario_comun_activo["payload"]["email"])
    res = client.post(f"/api/torneos/{t_id}/inscripciones", json={
        "nombre": "Equipo Tarde", "jugadores_emails": jugadores
    }, headers=usuario_comun_activo["headers"])
    assert res.status_code == 400

# ==========================================
# US 16 y Torneos Fantasmas: Ver Torneos
# ==========================================

def test_us16_listar_y_fantasmas(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
    # Torneo Normal Abierto
    res_t1 = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t1_id = res_t1.json()["id"]

    # Torneo Cancelado (Fantasma)
    res_t2 = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t2_id = res_t2.json()["id"]
    client.post(f"/api/torneos/{t2_id}/cancelar", headers=organizador_activo["headers"])

    # Torneo En Curso (Generado Fixture)
    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t3 = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t3_id = res_t3.json()["id"]
    
    # Llenamos T3
    for i in range(4):
        inscribir_equipo(client, db_session, t3_id, i)

    client.post(f"/api/torneos/{t3_id}/fixture", headers=organizador_activo["headers"])

    # Consultamos disponibles
    res_lista = client.get("/api/torneos/", headers=usuario_comun_activo["headers"])
    assert res_lista.status_code == 200
    torneos = res_lista.json()
    ids = [t["id"] for t in torneos]

    # Validaciones
    assert t1_id in ids  # Abierto aparece
    assert t2_id not in ids  # Cancelado NO aparece (Fantasma solucionado)
    assert t3_id not in ids  # En curso NO aparece en disponibles

# ==========================================
# US 18-21 y Bug Bloque 4: Fixture y Resultados
# ==========================================

def test_us18_generar_fixture_tct(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    # Inscribir 4 equipos
    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
    assert res_fix.status_code == 200
    assert len(res_fix.json()) > 0

def test_bug_resultado_sin_programar_none_type(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """
    Simula el Bug Crítico 4: Intentar cargar un resultado a un partido (ej. Semifinal) 
    que no ha sido programado (tiene fecha=None).
    """
    torneo_payload["formato"] = "eliminacion_directa"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    # Inscribir 4 equipos (Semis y Final)
    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    try:
        # Generamos fixture (se crean 2 Semis y 1 Final con fecha=None)
        res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
        partidos = res_fix.json()
        
        # Tomamos un partido cualquiera (está sin programar)
        p_id = res_fix.json()[0]["id"]

        # Intentamos cargar resultado
        res_res = client.post(f"/api/torneos/partidos/{p_id}/resultado", json={
            "goles_local": 2, "goles_visitante": 1, "jugadores_stats": []
        }, headers=organizador_activo["headers"])

        # Verificamos que frene controladamente con 400 y NO con 500 NoneType
        assert res_res.status_code == 400
        assert "no fue programado" in res_res.json()["detail"].lower()
    except Exception as e:
        import traceback
        with open("/app/backend/traceback.txt", "w") as f:
            f.write(traceback.format_exc())
        raise e

def test_us19_21_programar_y_cargar_resultado(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    # Inscribir 4 equipos
    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    try:
        res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
        assert res_fix.status_code == 200, res_fix.json()
        p_id = res_fix.json()[0]["id"]

        # Crear cancha
        res_cancha = client.post("/canchas", json={
            "nombre": "Cancha Torneo", "tipo_superficie": "cesped", "tamano": 5, "iluminacion": True,
            "techada": False, "precio_por_turno": 10000, "zona": "CABA", "direccion": "Dir",
            "hora_apertura": "10:00", "hora_cierre": "23:00", "duracion_turno": 60, "dias_operativos": 127
        }, headers=organizador_activo["headers"])
        cancha_id = res_cancha.json()["cancha"]["id"]

        # Programar partido
        hoy = datetime.now().strftime("%Y-%m-%d")
        res_prog = client.put(f"/api/torneos/partidos/{p_id}", json={
            "fecha": hoy, "horario": "15:00", "cancha_id": cancha_id
        }, headers=organizador_activo["headers"])
        assert res_prog.status_code == 200

        # Hackear la BD para pasarlo al pasado así podemos cargar el resultado (No se puede en futuros)
        db_session.execute(text(f"UPDATE partidos_torneo SET fecha = '2020-01-01' WHERE id = {p_id}"))
        db_session.commit()

        # Cargar resultado
        res_res = client.post(f"/api/torneos/partidos/{p_id}/resultado", json={
            "goles_local": 2, "goles_visitante": 1, "jugadores_stats": []
        }, headers=organizador_activo["headers"])
        assert res_res.status_code == 200
        assert res_res.json()["estado"] == "finalizado"

        # Tabla de Posiciones
        res_pos = client.get(f"/api/torneos/{t_id}/tabla-posiciones", headers=usuario_comun_activo["headers"])
        assert res_pos.status_code == 200
        assert len(res_pos.json()) > 0
    except Exception as e:
        import traceback
        with open("/app/backend/traceback_us19.txt", "w") as f:
            f.write(traceback.format_exc())
        raise e
