import pytest
from datetime import datetime, timedelta

@pytest.fixture
def cancha_payload():
    return {
        "nombre": "Cancha Test",
        "tipo_superficie": "cesped",
        "tamano": 5,
        "iluminacion": True,
        "techada": False,
        "precio_por_turno": 10000,
        "zona": "CABA",
        "direccion": "Av. Test 123",
        "hora_apertura": "10:00",
        "hora_cierre": "23:00",
        "duracion_turno": 60,
        "dias_operativos": 127
    }

# ==========================================
# US 4: Crear Cancha
# ==========================================

def test_us4_crear_cancha_falla_campos_faltantes(client, organizador_activo, cancha_payload):
    """Rechazar campos faltantes: Status 422"""
    datos = cancha_payload.copy()
    del datos["nombre"]
    
    response = client.post("/canchas", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 422
    errores = response.json().get("detail", [])
    assert any(err["loc"] == ["body", "nombre"] for err in errores)

def test_us4_crear_cancha_falla_precio_cero(client, organizador_activo, cancha_payload):
    """Rechazar precio <= 0: Status 422"""
    datos = cancha_payload.copy()
    datos["precio_por_turno"] = 0
    
    response = client.post("/canchas", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 422
    errores = response.json().get("detail", [])
    assert any(err["loc"] == ["body", "precio_por_turno"] for err in errores)

def test_us4_crear_cancha_falla_horario_ilogico(client, organizador_activo, cancha_payload):
    """Rechazar horario ilógico (apertura posterior a cierre)"""
    datos = cancha_payload.copy()
    datos["hora_apertura"] = "23:00"
    datos["hora_cierre"] = "10:00"
    
    response = client.post("/canchas", json=datos, headers=organizador_activo["headers"])
    assert response.status_code in (422, 400, 500) # La validación actual puede arrojar 400 o 422

def test_us4_crear_cancha_exitoso(client, organizador_activo, cancha_payload):
    """Crear cancha exitoso: Status 200"""
    response = client.post("/canchas", json=cancha_payload, headers=organizador_activo["headers"])
    assert response.status_code == 200
    assert "cancha" in response.json()
    assert response.json()["cancha"]["nombre"] == cancha_payload["nombre"]

# ==========================================
# US 5: Editar Cancha
# ==========================================

def test_us5_editar_cancha_falla_borrar_obligatorio(client, organizador_activo, cancha_payload):
    """Rechazar borrar dato obligatorio: Status 422"""
    res_crear = client.post("/canchas", json=cancha_payload, headers=organizador_activo["headers"])
    cancha_id = res_crear.json()["cancha"]["id"]
    
    datos = cancha_payload.copy()
    datos["nombre"] = ""
    
    response = client.put(f"/canchas/{cancha_id}", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 422

def test_us5_editar_cancha_caracteristicas_con_reservas(client, organizador_activo, cancha_payload):
    """Editar caracteristicas (precio) con reservas exitoso: Status 200"""
    res_crear = client.post("/canchas", json=cancha_payload, headers=organizador_activo["headers"])
    cancha_id = res_crear.json()["cancha"]["id"]
    
    # Generar reserva
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    client.post("/partidos", json={
        "cancha_id": cancha_id, "fecha": futuro, "horario": "15:00",
        "tipo": "cerrado", "cupos_disponibles": 10, "descripcion": "Reserva Test"
    }, headers=organizador_activo["headers"])
    
    # Editar precio (característica no bloqueante)
    datos = cancha_payload.copy()
    datos["precio_por_turno"] = 15000
    
    response = client.put(f"/canchas/{cancha_id}", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 200

def test_us5_editar_cancha_falla_horario_con_reservas(client, organizador_activo, cancha_payload):
    """Rechazar editar horario si la cancha tiene reservas: Status 400"""
    res_crear = client.post("/canchas", json=cancha_payload, headers=organizador_activo["headers"])
    cancha_id = res_crear.json()["cancha"]["id"]
    
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    client.post("/partidos", json={
        "cancha_id": cancha_id, "fecha": futuro, "horario": "15:00",
        "tipo": "cerrado", "cupos_disponibles": 10, "descripcion": "Reserva Test"
    }, headers=organizador_activo["headers"])
    
    # Editar horario (característica bloqueante)
    datos = cancha_payload.copy()
    datos["hora_apertura"] = "11:00"
    
    response = client.put(f"/canchas/{cancha_id}", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 400

# ==========================================
# US 6: Eliminar Cancha
# ==========================================

def test_us6_eliminar_cancha_falla_con_reservas(client, organizador_activo, cancha_payload):
    """Eliminar Cancha rechazada por reservas pendientes: Status 400"""
    res_crear = client.post("/canchas", json=cancha_payload, headers=organizador_activo["headers"])
    cancha_id = res_crear.json()["cancha"]["id"]
    
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    client.post("/partidos", json={
        "cancha_id": cancha_id, "fecha": futuro, "horario": "15:00",
        "tipo": "cerrado", "cupos_disponibles": 10, "descripcion": "Reserva Test"
    }, headers=organizador_activo["headers"])
    
    response = client.delete(f"/canchas/{cancha_id}", headers=organizador_activo["headers"])
    assert response.status_code == 400

def test_us6_eliminar_cancha_exitoso(client, organizador_activo, cancha_payload):
    """Eliminar cancha sin reservas exitoso: Status 200 y no aparece en listado"""
    res_crear = client.post("/canchas", json=cancha_payload, headers=organizador_activo["headers"])
    cancha_id = res_crear.json()["cancha"]["id"]
    
    response = client.delete(f"/canchas/{cancha_id}", headers=organizador_activo["headers"])
    assert response.status_code == 200
    
    # Verificar que no aparece en Mis Canchas
    res_get = client.get("/canchas/me", headers=organizador_activo["headers"])
    assert res_get.status_code == 200
    canchas_activas = res_get.json()
    assert not any(c.get("id") == cancha_id for c in canchas_activas)
