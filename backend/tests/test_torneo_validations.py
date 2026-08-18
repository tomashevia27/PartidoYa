import pytest
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError

from app.schemas.torneo_schemas import (
    validar_fechas_torneo,
    validar_franja_horaria,
    validar_tamano_equipo,
    validar_max_equipos_por_formato,
    TorneoCreate,
)
from app.models.torneo_model import FormatoTorneo


# ==========================================
# validar_fechas_torneo
# ==========================================

def test_validar_fechas_futuras_ok():
    """Fechas válidas: inicio futuro, fin después de inicio"""
    ahora = datetime.now()
    inicio = ahora + timedelta(days=1)
    fin = inicio + timedelta(days=5)
    validar_fechas_torneo(inicio, fin)


def test_validar_fechas_inicio_pasado_falla():
    """Fecha de inicio en el pasado → ValueError"""
    inicio = datetime.now() - timedelta(days=2)
    fin = inicio + timedelta(days=5)
    with pytest.raises(ValueError, match="pasado"):
        validar_fechas_torneo(inicio, fin)


def test_validar_fechas_fin_igual_inicio_falla():
    """Fecha_fin == fecha_inicio → ValueError (debe ser posterior)"""
    base = datetime.now() + timedelta(days=7)
    with pytest.raises(ValueError, match="posterior"):
        validar_fechas_torneo(base, base)


def test_validar_fechas_fin_anterior_inicio_falla():
    """Fecha_fin < fecha_inicio → ValueError"""
    inicio = datetime.now() + timedelta(days=10)
    fin = inicio - timedelta(days=1)
    with pytest.raises(ValueError, match="posterior"):
        validar_fechas_torneo(inicio, fin)


# ==========================================
# validar_franja_horaria
# ==========================================

def test_franja_horaria_valida():
    """Formato HH:MM-HH:MM correcto"""
    validar_franja_horaria("09:00-17:00")


def test_franja_horaria_con_espacios():
    """Formato con espacios alrededor del guion → válido"""
    validar_franja_horaria("09:00 - 17:00")


def test_franja_horaria_formato_invalido():
    """Formato sin guion → ValueError"""
    with pytest.raises(ValueError, match="franja horaria"):
        validar_franja_horaria("0900-1700")


def test_franja_horaria_formato_incompleto():
    """Solo una hora → ValueError"""
    with pytest.raises(ValueError, match="franja horaria"):
        validar_franja_horaria("09:00")


def test_franja_horaria_cierre_igual_apertura():
    """Cierre == apertura → ValueError"""
    with pytest.raises(ValueError, match="franja horaria"):
        validar_franja_horaria("09:00-09:00")


def test_franja_horaria_cierre_anterior_apertura():
    """Cierre anterior a apertura → ValueError"""
    with pytest.raises(ValueError, match="franja horaria"):
        validar_franja_horaria("17:00-09:00")


def test_franja_horaria_formato_hora_invalido():
    """Hora inválida (99:99) → ValueError"""
    with pytest.raises(ValueError, match="franja horaria"):
        validar_franja_horaria("99:99-17:00")


# ==========================================
# validar_tamano_equipo
# ==========================================

@pytest.mark.parametrize("tamano", [5, 7, 9, 11])
def test_tamano_equipo_valido(tamano):
    """Tamaños válidos: 5, 7, 9, 11"""
    validar_tamano_equipo(tamano)


@pytest.mark.parametrize("tamano", [1, 3, 6, 8, 10, 100])
def test_tamano_equipo_invalido(tamano):
    """Tamaños inválidos → ValueError"""
    with pytest.raises(ValueError, match="tamaño del equipo"):
        validar_tamano_equipo(tamano)


# ==========================================
# validar_max_equipos_por_formato
# ==========================================

# Eliminación directa
@pytest.mark.parametrize("n", [2, 4, 8, 16, 32, 64])
def test_ed_equipos_validos(n):
    """ED acepta potencias de 2"""
    validar_max_equipos_por_formato(FormatoTorneo.eliminacion_directa, n)


@pytest.mark.parametrize("n", [3, 5, 6, 7, 9, 10, 12, 13, 14, 15, 17])
def test_ed_equipos_invalidos(n):
    """ED rechaza no potencias de 2"""
    with pytest.raises(ValueError, match="Eliminación Directa"):
        validar_max_equipos_por_formato(FormatoTorneo.eliminacion_directa, n)


# Todos contra todos
@pytest.mark.parametrize("n", [4, 10, 20, 30])
def test_tct_equipos_validos(n):
    """TCT acepta entre 4 y 30"""
    validar_max_equipos_por_formato(FormatoTorneo.todos_contra_todos, n)


@pytest.mark.parametrize("n", [2, 3, 31, 32, 64])
def test_tct_equipos_invalidos(n):
    """TCT rechaza fuera de rango"""
    with pytest.raises(ValueError, match="Todos contra Todos"):
        validar_max_equipos_por_formato(FormatoTorneo.todos_contra_todos, n)


# Fase de grupos - semis
@pytest.mark.parametrize("n", [6, 8, 10])
def test_fg_semis_validos(n):
    """Fase de grupos + semis acepta 6, 8, 10"""
    validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, n, "semis")


@pytest.mark.parametrize("n", [12, 16, 20])
def test_fg_semis_invalidos(n):
    """Fase de grupos + semis rechaza valores de cuartos/octavos"""
    with pytest.raises(ValueError, match="Semifinales"):
        validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, n, "semis")


# Fase de grupos - cuartos
@pytest.mark.parametrize("n", [12, 16, 20])
def test_fg_cuartos_validos(n):
    """Fase de grupos + cuartos acepta 12, 16, 20"""
    validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, n, "cuartos")


@pytest.mark.parametrize("n", [6, 8, 10, 24, 32])
def test_fg_cuartos_invalidos(n):
    """Fase de grupos + cuartos rechaza valores de semis/octavos"""
    with pytest.raises(ValueError, match="Cuartos"):
        validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, n, "cuartos")


# Fase de grupos - octavos
@pytest.mark.parametrize("n", [24, 32, 40])
def test_fg_octavos_validos(n):
    """Fase de grupos + octavos acepta 24, 32, 40"""
    validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, n, "octavos")


@pytest.mark.parametrize("n", [6, 8, 10, 12, 16])
def test_fg_octavos_invalidos(n):
    """Fase de grupos + octavos rechaza valores de semis/cuartos"""
    with pytest.raises(ValueError, match="Octavos"):
        validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, n, "octavos")


def test_fg_sin_fase_final_falla():
    """Fase de grupos sin fase_final → ValueError"""
    with pytest.raises(ValueError, match="fase final"):
        validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, 8, None)


def test_fg_fase_final_invalida_falla():
    """Fase de grupos con fase_final inválida → ValueError"""
    with pytest.raises(ValueError, match="fase final"):
        validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, 8, "final")


def test_fg_equipos_no_en_rango_fase_grupos():
    """Fase de grupos con max_equipos fuera del conjunto permitido → ValueError"""
    with pytest.raises(ValueError, match="Fase de Grupos"):
        validar_max_equipos_por_formato(FormatoTorneo.fase_grupos, 14, "cuartos")


# ==========================================
# Integración: TorneoCreate delega correctamente
# ==========================================

def test_torneo_create_invalido_franja_falla():
    """TorneoCreate inválido por franja horaria → 422"""
    with pytest.raises(ValidationError) as exc_info:
        TorneoCreate(
            nombre="Torneo Test",
            fecha_inicio=datetime.now() + timedelta(days=30),
            fecha_fin=datetime.now() + timedelta(days=37),
            formato=FormatoTorneo.eliminacion_directa,
            zona="CABA",
            dias_operativos=127,
            franja_horaria="INVALIDA",
            max_equipos=8,
            min_integrantes_por_equipo=5,
            costo_inscripcion=1000,
        )
    assert "franja horaria" in str(exc_info.value).lower()


def test_torneo_create_invalido_tamano_falla():
    """TorneoCreate inválido por tamaño equipo → 422"""
    with pytest.raises(ValidationError) as exc_info:
        TorneoCreate(
            nombre="Torneo Test",
            fecha_inicio=datetime.now() + timedelta(days=30),
            fecha_fin=datetime.now() + timedelta(days=37),
            formato=FormatoTorneo.eliminacion_directa,
            zona="CABA",
            dias_operativos=127,
            franja_horaria="09:00-17:00",
            max_equipos=8,
            min_integrantes_por_equipo=6,
            costo_inscripcion=1000,
        )
    assert "tamaño del equipo" in str(exc_info.value).lower()


def test_torneo_create_invalido_formato_falla():
    """TorneoCreate inválido por formato inconsistente → 422"""
    with pytest.raises(ValidationError) as exc_info:
        TorneoCreate(
            nombre="Torneo Test",
            fecha_inicio=datetime.now() + timedelta(days=30),
            fecha_fin=datetime.now() + timedelta(days=37),
            formato=FormatoTorneo.eliminacion_directa,
            zona="CABA",
            dias_operativos=127,
            franja_horaria="09:00-17:00",
            max_equipos=6,
            min_integrantes_por_equipo=5,
            costo_inscripcion=1000,
        )
    assert "Eliminación Directa" in str(exc_info.value)
