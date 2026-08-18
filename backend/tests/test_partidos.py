import pytest
from datetime import datetime, timedelta

@pytest.fixture
def cancha_creada(client, organizador_activo):
    payload = {
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
    res = client.post("/canchas", json=payload, headers=organizador_activo["headers"])
    return res.json()["cancha"]

# ==========================================
# Crear Partido
# ==========================================

def test_crear_partido_falla_campos_obligatorios(client, organizador_activo, cancha_creada):
    """Rechazar faltan campos obligatorios: Status 422"""
    datos = {
        "cancha_id": cancha_creada["id"],
        "fecha": "2030-12-01"
        # Falta "horario" y otros obligatorios si aplican
    }
    response = client.post("/partidos", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 422

def test_crear_partido_falla_pasado(client, organizador_activo, cancha_creada):
    """Rechazar partido en el pasado: Status 400"""
    datos = {
        "cancha_id": cancha_creada["id"],
        "fecha": "2020-01-01",
        "horario": "15:00",
        "tipo": "abierto",
        "cupos_disponibles": 9,
        "descripcion": "Pasado"
    }
    response = client.post("/partidos", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 400

def test_crear_partido_falla_jugadores_fuera_rango(client, organizador_activo, cancha_creada):
    """Rechazar jugadores fuera de rango (ej. 10 cupos en cancha de 10 donde 1 es el organizador): Status 400"""
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    datos = {
        "cancha_id": cancha_creada["id"],
        "fecha": futuro,
        "horario": "15:00",
        "tipo": "abierto",
        "cupos_disponibles": 10, # Debería ser máximo 9 para tamano 5 (10 jug. - 1 org.)
        "descripcion": "Fuera de rango"
    }
    response = client.post("/partidos", json=datos, headers=organizador_activo["headers"])
    assert response.status_code in (400, 422)

def test_crear_partido_falla_tipo_invalido(client, organizador_activo, cancha_creada):
    """Rechazar tipo de partido inválido: Status 422/400"""
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    datos = {
        "cancha_id": cancha_creada["id"],
        "fecha": futuro,
        "horario": "15:00",
        "tipo": "cualquiera",
        "cupos_disponibles": 5,
        "descripcion": "Inválido"
    }
    response = client.post("/partidos", json=datos, headers=organizador_activo["headers"])
    assert response.status_code in (400, 422)

def test_crear_partido_cerrado_exitoso(client, organizador_activo, cancha_creada):
    """Crear partido CERRADO exitoso: Status 200"""
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    datos = {
        "cancha_id": cancha_creada["id"],
        "fecha": futuro,
        "horario": "15:00",
        "tipo": "cerrado",
        "descripcion": "Cerrado"
    }
    response = client.post("/partidos", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 200
    assert response.json()["tipo"] == "cerrado"

def test_crear_partido_abierto_exitoso(client, organizador_activo, cancha_creada):
    """Crear partido ABIERTO exitoso: Status 200"""
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    datos = {
        "cancha_id": cancha_creada["id"],
        "fecha": futuro,
        "horario": "16:00",
        "tipo": "abierto",
        "cupos_disponibles": 9,
        "descripcion": "Abierto"
    }
    response = client.post("/partidos", json=datos, headers=organizador_activo["headers"])
    assert response.status_code == 200
    assert response.json()["tipo"] == "abierto"

# ==========================================
# Listado de Partidos Disponibles
# ==========================================

@pytest.fixture
def partidos_abierto_cerrado(client, organizador_activo, cancha_creada):
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    res_cerrado = client.post("/partidos", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "15:00",
        "tipo": "cerrado", "descripcion": "Cerrado"
    }, headers=organizador_activo["headers"])
    
    res_abierto = client.post("/partidos", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "16:00",
        "tipo": "abierto", "cupos_disponibles": 9, "descripcion": "Abierto"
    }, headers=organizador_activo["headers"])
    
    return {"cerrado": res_cerrado.json(), "abierto": res_abierto.json()}

def test_obtener_disponibles_solo_abiertos_y_filtro_zona(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Obtener listado: Status 200. El cerrado NO aparece. Filtro por zona."""
    headers = usuario_comun_activo["headers"]
    
    # 1. Obtener disponibles sin filtros
    res = client.get("/partidos/disponibles", headers=headers)
    assert res.status_code == 200
    partidos = res.json()
    
    # El cerrado no debe estar
    assert not any(p["id"] == partidos_abierto_cerrado["cerrado"]["id"] for p in partidos)
    # El abierto sí
    assert any(p["id"] == partidos_abierto_cerrado["abierto"]["id"] for p in partidos)
    
    # 2. Obtener filtrando por zona
    res_zona = client.get("/partidos/disponibles?zona=CABA", headers=headers)
    assert res_zona.status_code == 200
    partidos_zona = res_zona.json()
    assert any(p["id"] == partidos_abierto_cerrado["abierto"]["id"] for p in partidos_zona)

def test_obtener_detalle_partido(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Obtener detalle de un partido (Ver detalle): Status 200"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.get(f"/partidos/{p_id}", headers=usuario_comun_activo["headers"])
    assert res.status_code == 200
    assert "cancha" in res.json()
    assert res.json()["descripcion"] == "Abierto"

# ==========================================
# Mis Partidos
# ==========================================

def test_obtener_mis_partidos(client, organizador_activo, partidos_abierto_cerrado):
    """Obtener Mis Partidos con 'organizados' e 'inscritos': Status 200"""
    res = client.get("/partidos/mis-partidos", headers=organizador_activo["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "organizados" in data
    assert "inscritos" in data
    
    # El partido creado aparece en organizados
    assert any(p["id"] == partidos_abierto_cerrado["abierto"]["id"] for p in data["organizados"])

# ==========================================
# Unirse a Partido
# ==========================================

def test_unirse_falla_organizador(client, organizador_activo, partidos_abierto_cerrado):
    """Rechazar si usuario es organizador: Status 400/403"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.post(f"/partidos/{p_id}/inscribirse", headers=organizador_activo["headers"])
    assert res.status_code in (400, 403)

def test_unirse_falla_partido_cerrado(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Rechazar unirse a partido cerrado: Status 400"""
    p_id = partidos_abierto_cerrado["cerrado"]["id"]
    res = client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 400

def test_unirse_partido_abierto_exitoso(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Unirse a partido abierto exitoso: Status 200"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 200

def test_unirse_falla_ya_inscripto(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Rechazar si ya está inscripto: Status 400"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    
    res = client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 400

def test_unirse_falla_partido_pasado(client, organizador_activo, usuario_comun_activo, cancha_creada, db_session):
    """Rechazar unirse a partido pasado: Status 400"""
    from sqlalchemy import text
    
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    res_abierto = client.post("/partidos", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "16:00",
        "tipo": "abierto", "cupos_disponibles": 9, "descripcion": "Futuro"
    }, headers=organizador_activo["headers"])
    p_id = res_abierto.json()["id"]
    
    # Hacemos trampa: cambiamos la fecha a pasado en BD
    db_session.execute(text(f"UPDATE partidos SET fecha = '2020-01-01' WHERE id = {p_id}"))
    db_session.commit()

    res = client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 400
    assert "pasó" in res.json()["detail"].lower()

def test_unirse_falla_lleno(client, organizador_activo, usuario_comun_activo, cancha_creada, db_session):
    """Rechazar unirse a partido lleno: Status 400"""
    # Creamos partido con solo 1 cupo
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    res_abierto = client.post("/partidos", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "18:00",
        "tipo": "abierto", "cupos_disponibles": 1, "descripcion": "Por llenarse"
    }, headers=organizador_activo["headers"])
    p_id = res_abierto.json()["id"]
    
    # Usuario 1 se inscribe (ocupa el único cupo)
    res_u1 = client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    assert res_u1.status_code == 200
    
    # Necesitamos otro usuario para intentar unirse cuando ya está lleno
    client.post("/registro", json={"nombre": "Extra", "apellido": "User", "email": "extra@mail.com", "password": "password123", "edad": 20, "genero": "masculino", "zona": "CABA"})
    from app.models.usuario_model import Usuario
    u = db_session.query(Usuario).filter_by(email="extra@mail.com").first()
    u.email_confirmado = True
    db_session.commit()
    
    res_login = client.post("/login", json={"email": "extra@mail.com", "password": "password123"})
    token_extra = res_login.json()["access_token"]
    
    # Intenta inscribirse pero ya está lleno
    res_extra = client.post(f"/partidos/{p_id}/inscribirse", headers={"Authorization": f"Bearer {token_extra}"})
    assert res_extra.status_code == 400
    assert "lleno" in res_extra.json()["detail"].lower() or "cupos" in res_extra.json()["detail"].lower()

# ==========================================
# Bajarse de Partido
# ==========================================

def test_bajarse_falla_no_inscripto(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Rechazar bajarse sin estar inscripto: Status 400"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.delete(f"/partidos/{p_id}/bajarse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 400

def test_bajarse_exitoso(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Bajarse de partido exitoso: Status 200"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    
    res = client.delete(f"/partidos/{p_id}/bajarse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 200

def test_bajarse_falla_fuera_de_tiempo(client, organizador_activo, usuario_comun_activo, cancha_creada, db_session):
    """Rechazar darse de baja si ya pasó el partido o está a punto de jugarse"""
    from sqlalchemy import text
    
    futuro = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    res_abierto = client.post("/partidos", json={
        "cancha_id": cancha_creada["id"], "fecha": futuro, "horario": "16:00",
        "tipo": "abierto", "cupos_disponibles": 9, "descripcion": "Futuro"
    }, headers=organizador_activo["headers"])
    p_id = res_abierto.json()["id"]
    
    # Usuario se inscribe cuando es futuro
    client.post(f"/partidos/{p_id}/inscribirse", headers=usuario_comun_activo["headers"])
    
    # Lo pasamos al pasado
    db_session.execute(text(f"UPDATE partidos SET fecha = '2020-01-01' WHERE id = {p_id}"))
    db_session.commit()

    res = client.delete(f"/partidos/{p_id}/bajarse", headers=usuario_comun_activo["headers"])
    assert res.status_code == 400
    assert "pasó" in res.json()["detail"].lower() or "curso" in res.json()["detail"].lower()

# ==========================================
# Editar Partido
# ==========================================

def test_editar_falla_no_organizador(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Rechazar editar si no es organizador: Status 403"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.put(f"/partidos/{p_id}", json={"descripcion": "hacked"}, headers=usuario_comun_activo["headers"])
    assert res.status_code == 403

def test_editar_falla_horario_ocupado(client, organizador_activo, partidos_abierto_cerrado):
    """Rechazar editar a horario ocupado: Status 400"""
    # El cerrado está a las 15:00. Editaremos el abierto (16:00) para que sea a las 15:00
    p_id_abierto = partidos_abierto_cerrado["abierto"]["id"]
    res = client.put(f"/partidos/{p_id_abierto}", json={"horario": "15:00"}, headers=organizador_activo["headers"])
    assert res.status_code == 400

def test_editar_partido_exitoso(client, organizador_activo, partidos_abierto_cerrado):
    """Editar partido exitoso: Status 200"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.put(f"/partidos/{p_id}", json={"horario": "17:00", "descripcion": "Editado"}, headers=organizador_activo["headers"])
    assert res.status_code == 200
    assert res.json()["descripcion"] == "Editado"

# ==========================================
# Cancelar Partido
# ==========================================

def test_cancelar_falla_no_organizador(client, usuario_comun_activo, partidos_abierto_cerrado):
    """Rechazar cancelar si no es organizador: Status 403"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.patch(f"/partidos/{p_id}/cancelar", headers=usuario_comun_activo["headers"])
    assert res.status_code == 403

def test_cancelar_partido_exitoso(client, organizador_activo, partidos_abierto_cerrado):
    """Cancelar partido exitoso: Status 200"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    res = client.patch(f"/partidos/{p_id}/cancelar", headers=organizador_activo["headers"])
    assert res.status_code == 200
    assert res.json()["estado"].lower() == "cancelado"

def test_cancelar_falla_ya_cancelado(client, organizador_activo, partidos_abierto_cerrado):
    """Rechazar si ya está cancelado: Status 400"""
    p_id = partidos_abierto_cerrado["abierto"]["id"]
    client.patch(f"/partidos/{p_id}/cancelar", headers=organizador_activo["headers"])
    
    res = client.patch(f"/partidos/{p_id}/cancelar", headers=organizador_activo["headers"])
    assert res.status_code == 400
