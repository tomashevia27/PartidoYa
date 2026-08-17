import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from app.main import app
from app.core.db import Base
from app.core.dependencies import get_db
from app.models.usuario_model import Usuario, RolUsuario

# Configuración de base de datos SQLite en memoria para tests rápidos y aislados
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def client():
    """Provee un TestClient de FastAPI para ejecutar endpoints en memoria."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def limpiar_db():
    """Recrea la base de datos limpia antes de cada test para asegurar 100% de aislamiento."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # No es estrictamente necesario hacer un drop aquí gracias a autouse,
    # pero mantiene la limpieza explícita.

@pytest.fixture
def db_session():
    """Provee una sesión de SQLAlchemy directamente a los tests para setup/verificaciones."""
    db = TestingSessionLocal()
    yield db
    db.close()

# ─────────────────────────────────────────────
# Fixtures Reutilizables de Autenticación
# ─────────────────────────────────────────────

@pytest.fixture
def usuario_comun_payload():
    unique = str(uuid.uuid4())[:8]
    return {
        "nombre": "Test",
        "apellido": "User",
        "email": f"user_{unique}@dominio.com",
        "password": "password123",
        "edad": 25,
        "genero": "masculino",
        "zona": "CABA"
    }

@pytest.fixture
def organizador_payload():
    unique = str(uuid.uuid4())[:8]
    return {
        "nombre": "Admin",
        "apellido": "User",
        "email": f"admin_{unique}@dominio.com",
        "password": "password123",
        "edad": 35,
        "genero": "masculino",
        "zona": "CABA"
    }

@pytest.fixture
def usuario_comun_db(db_session, usuario_comun_payload):
    """Crea un usuario común ya activado en la base de datos."""
    nuevo_usuario = Usuario(**usuario_comun_payload)
    nuevo_usuario.email_confirmado = True
    # Hashear contraseña (simplificado o usando la librería de hashing si hiciera falta, 
    # pero como no tenemos el hash en texto plano, usamos el endpoint de registro para 
    # que cree todo correcto, y luego lo activamos).
    pass

@pytest.fixture
def usuario_comun_activo(client, db_session, usuario_comun_payload):
    """Registra y activa un usuario común por base de datos, retornando payload y token."""
    client.post("/registro", json=usuario_comun_payload)
    usuario = db_session.query(Usuario).filter_by(email=usuario_comun_payload["email"]).first()
    usuario.email_confirmado = True
    db_session.commit()
    
    res = client.post("/login", json={"email": usuario_comun_payload["email"], "password": usuario_comun_payload["password"]})
    token = res.json().get("access_token")
    return {"usuario": usuario, "payload": usuario_comun_payload, "token": token, "headers": {"Authorization": f"Bearer {token}"}}

@pytest.fixture
def organizador_activo(client, db_session, organizador_payload):
    """Registra, activa y da permisos de admin a un usuario."""
    client.post("/registro", json=organizador_payload)
    usuario = db_session.query(Usuario).filter_by(email=organizador_payload["email"]).first()
    usuario.email_confirmado = True
    usuario.rol = RolUsuario.admin
    db_session.commit()
    
    res = client.post("/login", json={"email": organizador_payload["email"], "password": organizador_payload["password"]})
    token = res.json().get("access_token")
    return {"usuario": usuario, "payload": organizador_payload, "token": token, "headers": {"Authorization": f"Bearer {token}"}}
