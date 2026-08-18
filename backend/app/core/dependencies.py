from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from .db import SessionLocal
from .security import verify_token
from ..repositories import usuario_repository
from ..models.usuario_model import Usuario, RolUsuario

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Usuario:
    """Dependency para proteger rutas. Extrae el usuario del token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    usuario_id = payload.get("sub")
    if not usuario_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    usuario = usuario_repository.obtener_por_id(db, int(usuario_id))
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    return usuario


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependency que exige rol admin (dueño de cancha)."""
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acción permitida solo para dueños de canchas"
        )
    return current_user


def require_jugador(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependency que exige rol jugador."""
    if current_user.rol != RolUsuario.jugador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acción permitida solo para jugadores"
        )
    return current_user
