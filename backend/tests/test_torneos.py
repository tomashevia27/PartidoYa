import pytest
from datetime import datetime, timedelta
from sqlalchemy import text
from unittest.mock import patch

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
# ABM de Torneos
# ==========================================

def test_crear_torneo_falla_fecha_pasada(client, organizador_activo, torneo_payload):
    torneo_payload["fecha_inicio"] = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 422

def test_crear_torneo_falla_formato_inconsistente(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "eliminacion_directa"
    torneo_payload["max_equipos"] = 6  # Inválido para ED, debe ser potencia de 2 (4, 8, 16)
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 422

def test_crear_torneo_ed_exitoso(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "eliminacion_directa"
    torneo_payload["max_equipos"] = 8
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 201

def test_crear_torneo_fg_exitoso(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "fase_grupos"
    torneo_payload["max_equipos"] = 8
    torneo_payload["fase_final"] = "semis"
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 201

def test_crear_torneo_tct_exitoso(client, organizador_activo, torneo_payload):
    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 6
    res = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    assert res.status_code == 201

# ==========================================
# Inscripciones
# ==========================================

def test_inscribir_equipo_falla_faltan_jugadores(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    
    jugadores = crear_jugadores(client, db_session, 4, capitan_email=usuario_comun_activo["payload"]["email"])
    res = client.post(f"/api/torneos/{t_id}/inscripciones", json={
        "nombre": "Equipo Incompleto", "jugadores_emails": jugadores
    }, headers=usuario_comun_activo["headers"])
    assert res.status_code == 400

def test_inscribir_equipo_exitosa_y_baja(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
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

def test_inscribir_equipo_falla_torneo_caducado(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
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
# Listar Torneos
# ==========================================

def test_listar_torneos_oculta_cancelados_y_en_curso(client, usuario_comun_activo, organizador_activo, torneo_payload, db_session):
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
# Fixture y Resultados
# ==========================================

def test_generar_fixture_tct(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
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

def test_cargar_resultado_falla_partido_no_programado(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
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

def test_programar_y_cargar_resultado(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
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

        # Programar partido para mañana a las 15:00 (siempre futuro y dentro de la franja 10:00-20:00)
        manana = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        res_prog = client.put(f"/api/torneos/partidos/{p_id}", json={
            "fecha": manana, "horario": "15:00", "cancha_id": cancha_id
        }, headers=organizador_activo["headers"])
        assert res_prog.status_code == 200, res_prog.json()

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
        with open("/tmp/traceback_us19.txt", "w") as f:
            f.write(traceback.format_exc())
        raise e

# ==========================================
# Cobertura de funciones N+1 refactorizadas (Fase 3)
# ==========================================

def test_estadisticas_torneo_vacio(client, organizador_activo, torneo_payload):
    """obtener_estadisticas_torneo: torneo sin partidos ni estadísticas → listas vacías"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    res = client.get(f"/api/torneos/{t_id}/estadisticas")
    assert res.status_code == 200
    data = res.json()
    assert data["jugadores"] == []
    assert data["equipos"] == []


def test_top_goleadores_vacio(client, organizador_activo, torneo_payload):
    """top_jugadores_por_goles: torneo sin stats → lista vacía"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    res = client.get(f"/api/torneos/{t_id}/top/goleadores")
    assert res.status_code == 200
    assert res.json() == []


def test_top_amarillas_vacio(client, organizador_activo, torneo_payload):
    """top_jugadores_por_amarillas: torneo sin stats → lista vacía"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    res = client.get(f"/api/torneos/{t_id}/top/amarillas")
    assert res.status_code == 200
    assert res.json() == []


def test_top_rojas_vacio(client, organizador_activo, torneo_payload):
    """top_jugadores_por_rojas: torneo sin stats → lista vacía"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    res = client.get(f"/api/torneos/{t_id}/top/rojas")
    assert res.status_code == 200
    assert res.json() == []


def test_vallas_invictas_vacio(client, organizador_activo, torneo_payload):
    """top_equipos_vallas_invictas: torneo sin partidos finalizados → lista vacía"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    res = client.get(f"/api/torneos/{t_id}/top/vallas-invictas")
    assert res.status_code == 200
    assert res.json() == []


def test_tabla_posiciones_sin_fixture(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """tabla_posiciones_torneo: equipos inscriptos sin fixture → todos con 0 puntos"""
    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res = client.get(f"/api/torneos/{t_id}/tabla-posiciones")
    assert res.status_code == 200
    tabla = res.json()
    assert len(tabla) == 4
    for pos in tabla:
        assert pos["pts"] == 0
        assert pos["pj"] == 0
        assert pos["gf"] == 0
        assert pos["gc"] == 0
        assert pos["dg"] == 0


def test_estadisticas_jugador_torneo_vacio(client, organizador_activo, usuario_comun_activo, torneo_payload):
    """estadisticas_jugador_por_torneo: jugador sin stats en un torneo → lista vacía"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]
    uid = usuario_comun_activo["usuario"].id

    res = client.get(f"/api/torneos/{t_id}/jugador/{uid}/estadisticas")
    assert res.status_code == 200
    assert res.json() == []


def test_top_goleadores_con_datos(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """top_jugadores_por_goles: con stats cargadas, verifica ranking correcto"""
    from app.models.usuario_model import Usuario
    import uuid

    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
    assert res_fix.status_code == 200
    p_id = res_fix.json()[0]["id"]

    res_cancha = client.post("/canchas", json={
        "nombre": "Cancha Test", "tipo_superficie": "cesped", "tamano": 5, "iluminacion": True,
        "techada": False, "precio_por_turno": 10000, "zona": "CABA", "direccion": "Dir",
        "hora_apertura": "10:00", "hora_cierre": "23:00", "duracion_turno": 60, "dias_operativos": 127
    }, headers=organizador_activo["headers"])
    cancha_id = res_cancha.json()["cancha"]["id"]

    hoy = datetime.now().strftime("%Y-%m-%d")
    client.put(f"/api/torneos/partidos/{p_id}", json={
        "fecha": hoy, "horario": "15:00", "cancha_id": cancha_id
    }, headers=organizador_activo["headers"])

    db_session.execute(text(f"UPDATE partidos_torneo SET fecha = '2020-01-01' WHERE id = {p_id}"))
    db_session.commit()

    partidos_row = res_fix.json()
    eq_local_id = partidos_row[0].get("equipo_local", {})
    eq_visit_id = partidos_row[0].get("equipo_visitante", {})
    eq_local_id = eq_local_id.get("id") if isinstance(eq_local_id, dict) else eq_local_id
    eq_visit_id = eq_visit_id.get("id") if isinstance(eq_visit_id, dict) else eq_visit_id

    uid_jugador_local = None
    uid_jugador_visitante = None
    from app.models.equipo_model import Equipo
    eq_local = db_session.query(Equipo).filter_by(id=eq_local_id).first()
    eq_visit = db_session.query(Equipo).filter_by(id=eq_visit_id).first()
    if eq_local and eq_local.jugadores:
        uid_jugador_local = eq_local.jugadores[0].id
    if eq_visit and eq_visit.jugadores:
        uid_jugador_visitante = eq_visit.jugadores[0].id

    stats = []
    if uid_jugador_local:
        stats.append({"usuario_id": uid_jugador_local, "equipo_id": eq_local_id, "goles": 3, "amarillas": 0, "rojas": 0})
    if uid_jugador_visitante:
        stats.append({"usuario_id": uid_jugador_visitante, "equipo_id": eq_visit_id, "goles": 1, "amarillas": 1, "rojas": 0})

    client.post(f"/api/torneos/partidos/{p_id}/resultado", json={
        "goles_local": 3, "goles_visitante": 1, "estadisticas_jugadores": stats
    }, headers=organizador_activo["headers"])

    res_top = client.get(f"/api/torneos/{t_id}/top/goleadores")
    assert res_top.status_code == 200
    top = res_top.json()
    assert len(top) > 0
    assert top[0]["valor"] >= top[-1]["valor"]


def test_tabla_posiciones_despues_de_resultado(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """tabla_posiciones_torneo: después de cargar resultado, puntos se reflejan correctamente"""
    from app.models.equipo_model import Equipo

    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
    assert res_fix.status_code == 200
    p_id = res_fix.json()[0]["id"]

    res_cancha = client.post("/canchas", json={
        "nombre": "Cancha T", "tipo_superficie": "cesped", "tamano": 5, "iluminacion": True,
        "techada": False, "precio_por_turno": 10000, "zona": "CABA", "direccion": "Dir",
        "hora_apertura": "10:00", "hora_cierre": "23:00", "duracion_turno": 60, "dias_operativos": 127
    }, headers=organizador_activo["headers"])
    cancha_id = res_cancha.json()["cancha"]["id"]

    hoy = datetime.now().strftime("%Y-%m-%d")
    client.put(f"/api/torneos/partidos/{p_id}", json={
        "fecha": hoy, "horario": "16:00", "cancha_id": cancha_id
    }, headers=organizador_activo["headers"])
    db_session.execute(text(f"UPDATE partidos_torneo SET fecha = '2020-01-01' WHERE id = {p_id}"))
    db_session.commit()

    client.post(f"/api/torneos/partidos/{p_id}/resultado", json={
        "goles_local": 2, "goles_visitante": 0, "jugadores_stats": []
    }, headers=organizador_activo["headers"])

    res_tabla = client.get(f"/api/torneos/{t_id}/tabla-posiciones")
    assert res_tabla.status_code == 200
    tabla = res_tabla.json()
    assert len(tabla) == 4

    ganador = next((p for p in tabla if p["pts"] == 3), None)
    perdedor = next((p for p in tabla if p["pts"] == 0 and p["pj"] == 1), None)
    assert ganador is not None
    assert perdedor is not None
    assert ganador["pg"] == 1
    assert ganador["gf"] == 2
    assert perdedor["pp"] == 1
    assert perdedor["gc"] == 2


def test_estadisticas_torneo_con_datos(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """obtener_estadisticas_torneo: con datos, verifica agregación por jugador y equipo"""
    from app.models.equipo_model import Equipo

    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
    assert res_fix.status_code == 200
    p_id = res_fix.json()[0]["id"]

    res_cancha = client.post("/canchas", json={
        "nombre": "Cancha E", "tipo_superficie": "cesped", "tamano": 5, "iluminacion": True,
        "techada": False, "precio_por_turno": 10000, "zona": "CABA", "direccion": "Dir",
        "hora_apertura": "10:00", "hora_cierre": "23:00", "duracion_turno": 60, "dias_operativos": 127
    }, headers=organizador_activo["headers"])
    cancha_id = res_cancha.json()["cancha"]["id"]

    hoy = datetime.now().strftime("%Y-%m-%d")
    client.put(f"/api/torneos/partidos/{p_id}", json={
        "fecha": hoy, "horario": "17:00", "cancha_id": cancha_id
    }, headers=organizador_activo["headers"])
    db_session.execute(text(f"UPDATE partidos_torneo SET fecha = '2020-01-01' WHERE id = {p_id}"))
    db_session.commit()

    partidos_data = res_fix.json()
    eq_local_id = partidos_data[0].get("equipo_local", {})
    eq_visit_id = partidos_data[0].get("equipo_visitante", {})
    eq_local_id = eq_local_id.get("id") if isinstance(eq_local_id, dict) else eq_local_id
    eq_visit_id = eq_visit_id.get("id") if isinstance(eq_visit_id, dict) else eq_visit_id

    eq_local = db_session.query(Equipo).filter_by(id=eq_local_id).first()
    eq_visit = db_session.query(Equipo).filter_by(id=eq_visit_id).first()
    uid_local = eq_local.jugadores[0].id if eq_local and eq_local.jugadores else None
    uid_visit = eq_visit.jugadores[0].id if eq_visit and eq_visit.jugadores else None

    stats = []
    if uid_local:
        stats.append({"usuario_id": uid_local, "equipo_id": eq_local_id, "goles": 2, "amarillas": 1, "rojas": 0})
    if uid_visit:
        stats.append({"usuario_id": uid_visit, "equipo_id": eq_visit_id, "goles": 0, "amarillas": 0, "rojas": 1})

    client.post(f"/api/torneos/partidos/{p_id}/resultado", json={
        "goles_local": 2, "goles_visitante": 0, "estadisticas_jugadores": stats
    }, headers=organizador_activo["headers"])

    res_est = client.get(f"/api/torneos/{t_id}/estadisticas")
    assert res_est.status_code == 200
    data = res_est.json()

    assert len(data["jugadores"]) > 0
    assert len(data["equipos"]) > 0

    if uid_local:
        j_local = next((j for j in data["jugadores"] if j["usuario_id"] == uid_local), None)
        assert j_local is not None
        assert j_local["goles"] == 2
        assert j_local["amarillas"] == 1


def test_estadisticas_jugador_por_torneo_con_datos(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """estadisticas_jugador_por_torneo: con datos, verifica respuesta por partido"""
    from app.models.equipo_model import Equipo

    torneo_payload["formato"] = "todos_contra_todos"
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res_fix = client.post(f"/api/torneos/{t_id}/fixture", headers=organizador_activo["headers"])
    assert res_fix.status_code == 200
    p_id = res_fix.json()[0]["id"]

    res_cancha = client.post("/canchas", json={
        "nombre": "Cancha J", "tipo_superficie": "cesped", "tamano": 5, "iluminacion": True,
        "techada": False, "precio_por_turno": 10000, "zona": "CABA", "direccion": "Dir",
        "hora_apertura": "10:00", "hora_cierre": "23:00", "duracion_turno": 60, "dias_operativos": 127
    }, headers=organizador_activo["headers"])
    cancha_id = res_cancha.json()["cancha"]["id"]

    hoy = datetime.now().strftime("%Y-%m-%d")
    client.put(f"/api/torneos/partidos/{p_id}", json={
        "fecha": hoy, "horario": "18:00", "cancha_id": cancha_id
    }, headers=organizador_activo["headers"])
    db_session.execute(text(f"UPDATE partidos_torneo SET fecha = '2020-01-01' WHERE id = {p_id}"))
    db_session.commit()

    partidos_data = res_fix.json()
    eq_local_id = partidos_data[0].get("equipo_local", {})
    eq_visit_id = partidos_data[0].get("equipo_visitante", {})
    eq_local_id = eq_local_id.get("id") if isinstance(eq_local_id, dict) else eq_local_id
    eq_visit_id = eq_visit_id.get("id") if isinstance(eq_visit_id, dict) else eq_visit_id

    eq_local = db_session.query(Equipo).filter_by(id=eq_local_id).first()
    uid_jugador = eq_local.jugadores[0].id if eq_local and eq_local.jugadores else None

    if uid_jugador:
        stats = [{"usuario_id": uid_jugador, "equipo_id": eq_local_id, "goles": 1, "amarillas": 0, "rojas": 0}]
        client.post(f"/api/torneos/partidos/{p_id}/resultado", json={
            "goles_local": 1, "goles_visitante": 0, "estadisticas_jugadores": stats
        }, headers=organizador_activo["headers"])

        res = client.get(f"/api/torneos/{t_id}/jugador/{uid_jugador}/estadisticas")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["goles"] == 1
        assert data[0]["equipo_id"] == eq_local_id


def test_listar_torneos_no_muestra_llenos(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """Torneo lleno (inscriptos == max_equipos) NO debe aparecer en la lista de disponibles"""
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(4):
        inscribir_equipo(client, db_session, t_id, i)

    res_lista = client.get("/api/torneos/")
    assert res_lista.status_code == 200
    ids = [t["id"] for t in res_lista.json()]
    assert t_id not in ids


def test_listar_torneos_muestra_con_cupo(client, organizador_activo, usuario_comun_activo, torneo_payload, db_session):
    """Torneo con 1 cupo restante SÍ debe aparecer en la lista de disponibles"""
    torneo_payload["max_equipos"] = 4
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    for i in range(3):
        inscribir_equipo(client, db_session, t_id, i)

    res_lista = client.get("/api/torneos/")
    assert res_lista.status_code == 200
    ids = [t["id"] for t in res_lista.json()]
    assert t_id in ids


def test_listar_torneos_no_muestra_fecha_pasada(client, organizador_activo, torneo_payload, db_session):
    """Torneo con fecha_inicio en el pasado NO debe aparecer en la lista de disponibles"""
    res_t = client.post("/api/torneos/", json=torneo_payload, headers=organizador_activo["headers"])
    t_id = res_t.json()["id"]

    db_session.execute(text(f"UPDATE torneos SET fecha_inicio = '2020-01-01' WHERE id = {t_id}"))
    db_session.commit()

    res_lista = client.get("/api/torneos/")
    assert res_lista.status_code == 200
    ids = [t["id"] for t in res_lista.json()]
    assert t_id not in ids
