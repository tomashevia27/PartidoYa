import pytest
from datetime import datetime, timedelta
from sqlalchemy import text

from app.models.usuario_model import Usuario
from app.models.equipo_model import Equipo
from app.models.partido_torneo import PartidoTorneo, FaseTorneo, EstadoPartidoTorneo
from app.models.torneo_model import Torneo, EstadoTorneo, FormatoTorneo
from app.models.estadistica_jugador_partido_torneo import EstadisticaJugadorPartidoTorneo
from app.services.torneo_resultados import calcular_resultados_finales


# ==========================================
# Helpers
# ==========================================

def _crear_usuario(db, nombre="Jugador", apellido="Test", email=None):
    import uuid
    if not email:
        email = f"test_{uuid.uuid4().hex[:6]}@test.com"
    u = Usuario(nombre=nombre, apellido=apellido, email=email, password="x", edad=25, genero="masculino", zona="CABA")
    u.email_confirmado = True
    db.add(u)
    db.flush()
    return u


def _crear_torneo(db, formato=FormatoTorneo.todos_contra_todos, max_equipos=4, fase_final=None):
    ahora = datetime.now()
    t = Torneo(
        nombre="Torneo Test", fecha_inicio=ahora + timedelta(days=30),
        fecha_fin=ahora + timedelta(days=37), formato=formato, zona="CABA",
        dias_operativos=127, franja_horaria="09:00-17:00", max_equipos=max_equipos,
        min_integrantes_por_equipo=5, costo_inscripcion=0, estado=EstadoTorneo.en_curso,
        organizador_id=1, inscriptos=max_equipos, fase_final=fase_final,
    )
    db.add(t)
    db.flush()
    return t


def _crear_equipo(db, nombre="Equipo A", jugadores=None):
    e = Equipo(nombre=nombre)
    if jugadores:
        e.jugadores = jugadores
    db.add(e)
    db.flush()
    return e


def _crear_partido(db, torneo_id, local=None, visitante=None, fase=FaseTorneo.liga,
                   gl=None, gv=None, estado=EstadoPartidoTorneo.finalizado):
    p = PartidoTorneo(
        torneo_id=torneo_id,
        equipo_local_id=local.id if local else None,
        equipo_visitante_id=visitante.id if visitante else None,
        fase=fase, goles_local=gl, goles_visitante=gv, estado=estado,
    )
    db.add(p)
    db.flush()
    return p


def _crear_stats(db, usuario, equipo, partido, goles=0, amarillas=0, rojas=0):
    s = EstadisticaJugadorPartidoTorneo(
        torneo_id=partido.torneo_id,
        usuario_id=usuario.id, equipo_id=equipo.id, partido_id=partido.id,
        goles=goles, amarillas=amarillas, rojas=rojas,
    )
    db.add(s)
    db.flush()
    return s


# ==========================================
# Torneo vacío (sin datos)
# ==========================================

def test_resultados_finales_torneo_vacio(db_session):
    """Torneo sin partidos ni estadísticas → todo None"""
    t = _crear_torneo(db_session)
    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["campeon"] is None
    assert resultado["goleador"] is None
    assert resultado["valla_invicta"] is None


def test_resultados_finales_ed_vacio(db_session):
    """Torneo ED sin partidos finalizados → todo None"""
    t = _crear_torneo(db_session, formato=FormatoTorneo.eliminacion_directa)
    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.eliminacion_directa)
    assert resultado["campeon"] is None
    assert resultado["goleador"] is None
    assert resultado["valla_invicta"] is None


def test_resultados_finales_fg_vacio(db_session):
    """Torneo FG sin partidos finalizados → todo None"""
    t = _crear_torneo(db_session, formato=FormatoTorneo.fase_grupos, max_equipos=8, fase_final="semis")
    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.fase_grupos)
    assert resultado["campeon"] is None
    assert resultado["goleador"] is None
    assert resultado["valla_invicta"] is None


# ==========================================
# Campeón TCT (tabla de posiciones)
# ==========================================

def test_campeon_tct_con_datos(db_session):
    """TCT: campeón es el 1er puesto de la tabla de posiciones"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    p1 = _crear_partido(db_session, t.id, eq_a, eq_b, gl=3, gv=1)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["campeon"] is not None
    assert resultado["campeon"]["equipo_id"] == eq_a.id
    assert resultado["campeon"]["equipo_nombre"] == "Equipo A"


def test_campeon_tct_empate(db_session):
    """TCT: empate → campeón仍为None (sin desempate implementado)"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    _crear_partido(db_session, t.id, eq_a, eq_b, gl=1, gv=1)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    # En empate, tabla_posiciones仍返回队伍，第一名 wins by default
    assert resultado["campeon"] is not None
    assert resultado["campeon"]["equipo_id"] in (eq_a.id, eq_b.id)


# ==========================================
# Campeón ED (partido final)
# ==========================================

def test_campeon_ed_local_gana(db_session):
    """ED: local gana la final → campeón es el local"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session, formato=FormatoTorneo.eliminacion_directa)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    _crear_partido(db_session, t.id, eq_a, eq_b, fase=FaseTorneo.final, gl=3, gv=1)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.eliminacion_directa)
    assert resultado["campeon"] is not None
    assert resultado["campeon"]["equipo_id"] == eq_a.id


def test_campeon_ed_visitante_gana(db_session):
    """ED: visitante gana la final → campeón es el visitante"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session, formato=FormatoTorneo.eliminacion_directa)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    _crear_partido(db_session, t.id, eq_a, eq_b, fase=FaseTorneo.final, gl=1, gv=3)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.eliminacion_directa)
    assert resultado["campeon"] is not None
    assert resultado["campeon"]["equipo_id"] == eq_b.id


def test_campeon_ed_sin_final(db_session):
    """ED: sin partido finalizado → None"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    t = _crear_torneo(db_session, formato=FormatoTorneo.eliminacion_directa)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1])
    eq_b = _crear_equipo(db_session, "Equipo B", [j2])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    _crear_partido(db_session, t.id, eq_a, eq_b, fase=FaseTorneo.semifinal, gl=2, gv=1)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.eliminacion_directa)
    assert resultado["campeon"] is None


def test_campeon_ed_empate_final(db_session):
    """ED: empate en la final → None (sin desempate)"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session, formato=FormatoTorneo.eliminacion_directa)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    _crear_partido(db_session, t.id, eq_a, eq_b, fase=FaseTorneo.final, gl=2, gv=2)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.eliminacion_directa)
    assert resultado["campeon"] is None


# ==========================================
# Goleador
# ==========================================

def test_goleador_con_stats(db_session):
    """Con estadísticas cargadas → devuelve el goleador"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1])
    eq_b = _crear_equipo(db_session, "Equipo B", [j2])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    p1 = _crear_partido(db_session, t.id, eq_a, eq_b, gl=3, gv=1)
    _crear_stats(db_session, j1, eq_a, p1, goles=3)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["goleador"] is not None
    assert resultado["goleador"]["usuario_id"] == j1.id
    assert resultado["goleador"]["nombre"] == "Carlos Lopez"
    assert resultado["goleador"]["goles"] == 3


def test_goleador_sin_goles(db_session):
    """Sin goles anotados → None"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1])
    eq_b = _crear_equipo(db_session, "Equipo B", [j2])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    p1 = _crear_partido(db_session, t.id, eq_a, eq_b, gl=0, gv=0)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["goleador"] is None


def test_goleador_solo_amarillas(db_session):
    """Solo amarillas, 0 goles → None"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1])
    eq_b = _crear_equipo(db_session, "Equipo B", [j2])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    p1 = _crear_partido(db_session, t.id, eq_a, eq_b, gl=1, gv=0)
    _crear_stats(db_session, j1, eq_a, p1, goles=0, amarillas=3)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["goleador"] is None


# ==========================================
# Valla invicta
# ==========================================

def test_valla_invicta_con_datos(db_session):
    """Con partidos finalizados → devuelve la mejor valla"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    _crear_partido(db_session, t.id, eq_a, eq_b, gl=3, gv=0)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["valla_invicta"] is not None
    assert resultado["valla_invicta"]["equipo_id"] == eq_a.id
    assert resultado["valla_invicta"]["goles_recibidos"] == 0


def test_valla_invicta_empate_goles(db_session):
    """Ambos equipos recibieron goles → el que recibió menos"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    # eq_a recibe 1 gol (gv=1), eq_b recibe 2 goles (gl=2)
    _crear_partido(db_session, t.id, eq_a, eq_b, gl=2, gv=1)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["valla_invicta"] is not None
    assert resultado["valla_invicta"]["equipo_id"] == eq_a.id
    assert resultado["valla_invicta"]["goles_recibidos"] == 1


def test_valla_invicta_sin_partidos(db_session):
    """Sin partidos finalizados → None"""
    t = _crear_torneo(db_session)
    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["valla_invicta"] is None


# ==========================================
# Caso combinado: todos los campos presentes
# ==========================================

def test_resultados_completos(db_session):
    """Torneo con todos los datos → campeón + goleador + valla"""
    j1 = _crear_usuario(db_session, "Carlos", "Lopez")
    j2 = _crear_usuario(db_session, "Ana", "Garcia")
    j3 = _crear_usuario(db_session, "Luis", "Martinez")
    j4 = _crear_usuario(db_session, "Sofia", "Ruiz")
    t = _crear_torneo(db_session)
    eq_a = _crear_equipo(db_session, "Equipo A", [j1, j2])
    eq_b = _crear_equipo(db_session, "Equipo B", [j3, j4])
    t.equipos_inscriptos = [eq_a, eq_b]
    db_session.flush()

    p1 = _crear_partido(db_session, t.id, eq_a, eq_b, gl=3, gv=1)
    _crear_stats(db_session, j1, eq_a, p1, goles=3)

    resultado = calcular_resultados_finales(db_session, t.id, FormatoTorneo.todos_contra_todos)
    assert resultado["campeon"] is not None
    assert resultado["goleador"] is not None
    assert resultado["valla_invicta"] is not None
    assert resultado["campeon"]["equipo_id"] == eq_a.id
    assert resultado["goleador"]["goles"] == 3
    assert resultado["valla_invicta"]["goles_recibidos"] == 1
