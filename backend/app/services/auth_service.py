from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
import secrets
import time
import logging

logger = logging.getLogger(__name__)

RESEND_COOLDOWN_SECONDS = 60
_last_resend: dict[str, float] = {}

from ..models.usuario_model import Usuario
from ..repositories import usuario_repository
from ..schemas.usuario_schemas import UsuarioRegistro, UsuarioLogin
from . import email_service
from ..core.security import create_access_token, get_password_hash, verify_password


def registrar(db: Session, usuario: UsuarioRegistro, background_tasks: BackgroundTasks) -> dict:
    """Registra un nuevo usuario y envía código de confirmación por email de forma asíncrona.

    Retorna dict con mensaje.
    """
    usuario_existente = usuario_repository.obtener_por_email(db, usuario.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    code = f"{secrets.randbelow(10**6):06d}"

    datos_usuario = {**usuario.model_dump(), "password": get_password_hash(usuario.password)}
    nuevo_usuario = Usuario(**datos_usuario, confirmation_code=code, email_confirmado=False)

    db.add(nuevo_usuario)
    db.commit()

    background_tasks.add_task(
        email_service.send_confirmation_email, nuevo_usuario.email, code
    )

    return {"mensaje": "Usuario registrado. Revisa tu email para confirmar la cuenta."}


def login(db: Session, datos: UsuarioLogin) -> dict:
    """Valida credenciales y devuelve JWT."""
    usuario = usuario_repository.obtener_por_email(db, datos.email)
    if not usuario or not verify_password(datos.password, usuario.password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    if not usuario.email_confirmado:
        raise HTTPException(status_code=403, detail="La cuenta no está activa aún")

    # Generar JWT con el ID del usuario
    token = create_access_token({"sub": str(usuario.id), "rol": usuario.rol.value})
    
    return {
        "mensaje": "Login exitoso",
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "rol": usuario.rol
    }


def confirmar_email(db: Session, email: str, code: str) -> dict:
    """Confirma el email si el código coincide."""
    usuario = usuario_repository.obtener_por_email(db, email)
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    if usuario.confirmation_code != code:
        raise HTTPException(status_code=400, detail="Código inválido")

    usuario.email_confirmado = True
    usuario.confirmation_code = None
    usuario_repository.guardar(db, usuario)

    return {"mensaje": "Email confirmado exitosamente"}


def reenviar_codigo(db: Session, email: str) -> dict:
    """Genera y reenvía código de confirmación a un email existente."""
    usuario = usuario_repository.obtener_por_email(db, email)
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    now = time.monotonic()
    last = _last_resend.get(email, 0)
    if now - last < RESEND_COOLDOWN_SECONDS:
        remaining = int(RESEND_COOLDOWN_SECONDS - (now - last))
        raise HTTPException(
            status_code=429,
            detail=f"Debes esperar {remaining} segundos antes de solicitar otro código."
        )

    code = f"{secrets.randbelow(10**6):06d}"
    usuario.confirmation_code = code

    try:
        email_service.send_confirmation_email(usuario.email, code)
        usuario_repository.guardar(db, usuario)
    except Exception as e:
        logger.error(f"Error reenviando email: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de correo no disponible. Por favor intenta más tarde."
        )

    _last_resend[email] = now
    return {"mensaje": "Código reenviado (revisa tu email o consola)."}



