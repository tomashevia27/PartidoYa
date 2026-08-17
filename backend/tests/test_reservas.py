import pytest
from datetime import datetime, timedelta
from sqlalchemy import text

@pytest.fixture
def cancha_creada(client, organizador_activo):
    payload = {
        "nombre": "Cancha Reservas",
        "tipo_superficie": "cesped",
        "tamano": 5,
        "iluminacion": True,
        "techada": False,
        "precio_por_turno": 10000,
        "zona": "CABA",
        "direccion": "Av. Reservas 123",
        "hora_apertura": "10:00",
        "hora_cierre": "23:00",
        "duracion_turno": 60,
        "dias_operativos": 127
    }
    res = client.post("/canchas", json=payload, headers=organizador_activo["headers"])
    return res.json()["cancha"]

# ==========================================
# US 24: Cargar reserva manual
# ==========================================

def test_us24_crear_reserva_falla_no_organizador(client, usuario_comun_activo, cancha_creada):
    """Rechazar reserva manual si no es dueño: Status 403"""
    futuro = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    res = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "15:00"
    }, headers=usuario_comun_activo["headers"])
    assert res.status_code == 403

def test_us24_crear_reserva_falla_pasada(client, organizador_activo, cancha_creada):
    """Rechazar reserva pasada: Status 400"""
    pasado = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    res = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": pasado, "horario": "15:00"
    }, headers=organizador_activo["headers"])
    assert res.status_code == 400
    assert "pasó" in res.json()["detail"].lower() or "pasado" in res.json()["detail"].lower()

def test_us24_crear_reserva_exitosa(client, organizador_activo, cancha_creada):
    """Crear reserva manual exitosa: Status 200"""
    futuro = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    res = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "15:00"
    }, headers=organizador_activo["headers"])
    assert res.status_code == 200
    assert res.json()["estado"] == "pendiente"

# ==========================================
# US 25: Reprogramar reserva
# ==========================================

def test_us25_reprogramar_falla_ocupado(client, organizador_activo, cancha_creada):
    """Rechazar reprogramar a horario ocupado: Status 400"""
    futuro = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    # Reserva 1 a las 16:00
    res_1 = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "16:00"
    }, headers=organizador_activo["headers"])
    r1_id = res_1.json()["id"]

    # Reserva 2 a las 17:00
    client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "17:00"
    }, headers=organizador_activo["headers"])

    # Intentar reprogramar R1 a las 17:00
    res_reprog = client.put(f"/reservas/{r1_id}/reprogramar", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "17:00"
    }, headers=organizador_activo["headers"])
    assert res_reprog.status_code == 400
    assert "disponible" in res_reprog.json()["detail"].lower()
def test_us25_reprogramar_exitoso(client, organizador_activo, cancha_creada):
    """Reprogramar reserva exitoso: Status 200"""
    futuro = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    # Reserva a las 18:00
    res_1 = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "18:00"
    }, headers=organizador_activo["headers"])
    r1_id = res_1.json()["id"]

    # Reprogramar a las 19:00
    res_reprog = client.put(f"/reservas/{r1_id}/reprogramar", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "19:00"
    }, headers=organizador_activo["headers"])
    assert res_reprog.status_code == 200
    assert res_reprog.json()["horario"] == "19:00:00"

# ==========================================
# US 27: Ver Agenda
# ==========================================

def test_us27_obtener_agenda(client, organizador_activo, cancha_creada):
    """Obtener agenda de la cancha: Status 200"""
    futuro = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    res = client.get(f"/canchas/{cancha_creada['id']}/agenda?fecha={futuro}", headers=organizador_activo["headers"])
    assert res.status_code == 200
    agenda = res.json()
    assert "slots" in agenda    # Debería tener las reservas que creamos en los tests de US 25
    assert len(agenda["slots"]) > 0

# ==========================================
# US 26: Cancelar Reserva (Dueño)
# ==========================================

def test_us26_cancelar_reserva_falla_pasada(client, organizador_activo, cancha_creada, db_session):
    """Rechazar cancelar reserva si ya pasó (Bug fix comprobado): Status 400"""
    futuro = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    # Crear reserva a futuro
    res = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "20:00"
    }, headers=organizador_activo["headers"])
    r_id = res.json()["id"]

    # Hackear la BD para envejecerla (enviar al pasado)
    db_session.execute(text(f"UPDATE partidos SET fecha = '2020-01-01' WHERE id = {r_id}"))
    db_session.commit()

    # Intentar cancelarla
    res_cancel = client.delete(f"/reservas/{r_id}", headers=organizador_activo["headers"])
    assert res_cancel.status_code == 400
    assert "ocurrió" in res_cancel.json()["detail"].lower()
def test_us26_cancelar_reserva_exitosa(client, organizador_activo, cancha_creada):
    """Cancelar reserva futura exitosa: Status 200"""
    futuro = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    res = client.post("/reservas/manual", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "21:00"
    }, headers=organizador_activo["headers"])
    r_id = res.json()["id"]

    res_cancel = client.delete(f"/reservas/{r_id}", headers=organizador_activo["headers"])
    assert res_cancel.status_code == 200
    assert res_cancel.json()["estado"].lower() == "cancelado"
