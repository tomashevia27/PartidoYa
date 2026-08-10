from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional
from datetime import date

# -----------------------------------------
# US 4: Crear Cancha
# -----------------------------------------
class CanchaBase(BaseModel):
    nombre: str = Field(..., min_length=1)
    tipo_superficie: str = Field(..., min_length=1)
    tamano: int = Field(..., gt=0)
    iluminacion: bool
    zona: str = Field(..., min_length=1)
    direccion: str = Field(..., min_length=1)
    precio_por_turno: float = Field(..., gt=0, description="El precio debe ser mayor a cero")
    dias_operativos: int = Field(..., description="Bitmask de días operativos (ej: 31 = Lun-Vie)")
    hora_apertura: str = Field(..., min_length=1)
    hora_cierre: str = Field(..., min_length=1)
    duracion_turno: int = Field(60, gt=0, description="Duración del turno en minutos")
    fotos: Optional[str] = None

    @model_validator(mode="after")
    def validar_horarios(self):
        ap = self.hora_apertura
        ci = self.hora_cierre
        
        try:
            ap_h, ap_m = map(int, ap.split(":"))
            ci_h, ci_m = map(int, ci.split(":"))
        except (ValueError, TypeError):
            raise ValueError("El formato de hora debe ser HH:MM")

        minutos_validos = {0, 15, 30, 45}
        if ap_m not in minutos_validos:
            raise ValueError("Los minutos de apertura deben ser 00, 15, 30 o 45")
        if ci_m not in minutos_validos:
            raise ValueError("Los minutos de cierre deben ser 00, 15, 30 o 45")

        min_apertura = ap_h * 60 + ap_m
        min_cierre = ci_h * 60 + ci_m
        if min_cierre <= min_apertura:
            raise ValueError("La hora de cierre debe ser posterior a la de apertura")
            
        duracion = self.duracion_turno or 60
        if (min_cierre - min_apertura) % duracion != 0:
            raise ValueError(f"El rango de horarios no es múltiplo de la duración del turno ({duracion} min), lo que dejaría slots incompletos")
            
        return self

class CanchaCreate(CanchaBase):
    pass

class CanchaRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    tipo_superficie: str
    tamano: int
    iluminacion: bool
    zona: str
    direccion: str
    precio_por_turno: float
    dias_operativos: int
    dias_operativos_texto: Optional[str] = None
    hora_apertura: str
    hora_cierre: str
    duracion_turno: int
    fotos: Optional[str] = None
    activa: bool
    propietario_id: int

    @model_validator(mode="after")
    def calcular_dias_texto(self):
        bitmask = self.dias_operativos or 0
        dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        activos = [dias[i] for i in range(7) if (bitmask >> i) & 1]

        if not activos:
            self.dias_operativos_texto = "Sin días operativos"
            return self
        if len(activos) == 7:
            self.dias_operativos_texto = "Todos los días"
            return self
        if activos == dias[:5]:
            self.dias_operativos_texto = "Lunes a Viernes"
            return self
        if activos == dias[5:]:
            self.dias_operativos_texto = "Fines de semana"
            return self
        self.dias_operativos_texto = ", ".join(activos)
        return self

# -----------------------------------------
# US 4: Editar Cancha
# -----------------------------------------
class CanchaUpdate(CanchaBase):
    pass

# -----------------------------------------
# US 24: Agenda de la Cancha
# -----------------------------------------
class AgendaSlot(BaseModel):
    horario: str
    estado: str  # "disponible" | "ocupado" | "bloqueado"
    partido_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    cliente_apellido: Optional[str] = None
    cliente_telefono: Optional[str] = None
    organizador_nombre: Optional[str] = None
    organizador_apellido: Optional[str] = None
    es_reserva_manual: Optional[bool] = False

class AgendaRespuesta(BaseModel):
    cancha: CanchaRespuesta
    fecha: date
    slots: list[AgendaSlot]

# -----------------------------------------
# Turnos públicos (sin datos sensibles)
# -----------------------------------------
class TurnoSlot(BaseModel):
    horario: str
    estado: str  # "disponible" | "ocupado" | "bloqueado"

class TurnosRespuesta(BaseModel):
    cancha_id: int
    fecha: date
    slots: list[TurnoSlot]
