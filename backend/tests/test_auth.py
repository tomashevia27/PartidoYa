from app.models.usuario_model import Usuario

# ==========================================
# US 1: Registro de Usuario
# ==========================================

def test_us1_registro_falla_campos_obligatorios(client, usuario_comun_payload):
    """Rechazar falta de campos obligatorios: Status 422"""
    datos = usuario_comun_payload.copy()
    del datos["nombre"]
    del datos["zona"]
    
    response = client.post("/registro", json=datos)
    assert response.status_code == 422
    errores = response.json().get("detail", [])
    assert any(err["loc"] == ["body", "nombre"] for err in errores)
    assert any(err["loc"] == ["body", "zona"] for err in errores)

def test_us1_registro_falla_email_invalido(client, usuario_comun_payload):
    """Rechazar email inválido: Status 422"""
    datos = usuario_comun_payload.copy()
    datos["email"] = "email_sin_arroba_ni_dominio"
    
    response = client.post("/registro", json=datos)
    assert response.status_code == 422
    errores = response.json().get("detail", [])
    assert any(err["loc"] == ["body", "email"] for err in errores)

def test_us1_registro_falla_password_corta(client, usuario_comun_payload):
    """Rechazar contraseña corta (<8): Status 422"""
    datos = usuario_comun_payload.copy()
    datos["password"] = "1234567"
    
    response = client.post("/registro", json=datos)
    assert response.status_code == 422
    errores = response.json().get("detail", [])
    assert any(err["loc"] == ["body", "password"] for err in errores)

def test_us1_registro_exitoso_sin_foto(client, usuario_comun_payload):
    """Registro exitoso (sin foto): Status 200"""
    response = client.post("/registro", json=usuario_comun_payload)
    assert response.status_code == 200
    assert "mensaje" in response.json()

def test_us1_registro_falla_email_duplicado(client, usuario_comun_payload):
    """Rechazar email duplicado: Status 400"""
    # Primer registro
    client.post("/registro", json=usuario_comun_payload)
    # Segundo registro con el mismo email
    response = client.post("/registro", json=usuario_comun_payload)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "El email ya está registrado"

# ==========================================
# US 2: Inicio de Sesión
# ==========================================

def test_us2_login_falla_faltan_credenciales(client):
    """Faltan credenciales: Status 422"""
    response = client.post("/login", json={"email": "test@dominio.com"}) # Falta password
    assert response.status_code == 422

def test_us2_login_falla_credenciales_incorrectas(client, usuario_comun_activo):
    """Credenciales incorrectas: Status 401"""
    datos_login = {
        "email": usuario_comun_activo["payload"]["email"],
        "password": "wrongpassword"
    }
    response = client.post("/login", json=datos_login)
    assert response.status_code == 401
    assert response.json()["detail"] == "Email o contraseña incorrectos"

def test_us2_login_falla_usuario_no_existe(client):
    """Usuario no existe (Error genérico): Status 401"""
    datos_login = {
        "email": "no_existo@dominio.com",
        "password": "password123"
    }
    response = client.post("/login", json=datos_login)
    assert response.status_code == 401
    assert response.json()["detail"] == "Email o contraseña incorrectos"

def test_us2_login_falla_bloqueo_cuenta_no_confirmada(client, db_session, usuario_comun_payload):
    """Bloqueo por cuenta no confirmada: Status 403"""
    # Registrar usuario pero NO confirmarlo
    client.post("/registro", json=usuario_comun_payload)
    
    datos_login = {
        "email": usuario_comun_payload["email"],
        "password": usuario_comun_payload["password"]
    }
    response = client.post("/login", json=datos_login)
    assert response.status_code == 403
    assert response.json()["detail"] == "La cuenta no está activa aún"

def test_us2_login_exitoso(client, usuario_comun_activo):
    """Login exitoso: Status 200"""
    datos_login = {
        "email": usuario_comun_activo["payload"]["email"],
        "password": usuario_comun_activo["payload"]["password"]
    }
    response = client.post("/login", json=datos_login)
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "usuario_id" in response.json()

# ==========================================
# US 3: Edición de Perfil
# ==========================================

def test_us3_edicion_falla_campos_obligatorios_vacios(client, usuario_comun_activo):
    """Rechazar campos obligatorios vacíos: Status 422"""
    headers = usuario_comun_activo["headers"]
    
    datos_edicion = {
        "nombre": "", "apellido": "", "edad": 26, "genero": "masculino", "zona": "GBA Sur"
    }
    response = client.put("/usuarios/me", json=datos_edicion, headers=headers)
    assert response.status_code == 422

def test_us3_edicion_ignora_modificacion_email(client, db_session, usuario_comun_activo):
    """El email no puede ser modificado: Email devuelto = original"""
    headers = usuario_comun_activo["headers"]
    email_original = usuario_comun_activo["payload"]["email"]
    
    datos_edicion = {
        "nombre": "TestEditado",
        "apellido": "UserEditado",
        "edad": 26,
        "genero": "masculino",
        "zona": "GBA Sur",
        "email": "hacker@dominio.com"
    }
    
    response = client.put("/usuarios/me", json=datos_edicion, headers=headers)
    assert response.status_code == 200
    
    # Verificar que el email devuelto es el original y no se modificó
    assert response.json().get("email") == email_original

def test_us3_edicion_general_exitosa(client, db_session, usuario_comun_activo):
    """Edición general exitosa: Status 200"""
    headers = usuario_comun_activo["headers"]
    
    datos_edicion = {
        "nombre": "TestEditado",
        "apellido": "UserEditado",
        "edad": 26,
        "genero": "masculino",
        "zona": "GBA Sur"
    }
    
    response = client.put("/usuarios/me", json=datos_edicion, headers=headers)
    assert response.status_code == 200

