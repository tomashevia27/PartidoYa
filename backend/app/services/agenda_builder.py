from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

class AgendaBuilder:
    """Orquestador que cruza reglas de dominio de la Cancha con información de Partidos."""
    
    def __init__(self, cancha, fecha: date):
        self.cancha = cancha
        self.fecha = fecha
        self.slots = []

    def generar_slots_vacios(self, incluir_detalle: bool = False) -> 'AgendaBuilder':
        """Genera la grilla base vacía basándose en los horarios de la cancha."""
        if not self.cancha.opera_en_fecha(self.fecha):
            return self

        apertura, cierre = self.cancha.obtener_rango_datetime()
        duracion = self.cancha.duracion_turno
        
        actual = apertura
        while actual < cierre:
            fin_slot = actual + timedelta(minutes=duracion)
            if fin_slot > cierre:
                break
                
            slot_data = {
                "horario": actual.strftime("%H:%M"),
                "estado": "disponible"
            }
            
            if incluir_detalle:
                slot_data.update({
                    "partido_id": None,
                    "cliente_nombre": None,
                    "cliente_apellido": None,
                    "cliente_telefono": None,
                    "organizador_nombre": None,
                    "organizador_apellido": None,
                    "es_reserva_manual": False,
                })
                
            self.slots.append(slot_data)
            actual = fin_slot
            
        return self

    def inyectar_partidos(self, partidos: List, excluir_partido_id: Optional[int] = None, incluir_detalle: bool = False) -> 'AgendaBuilder':
        """Cruza los slots vacíos con los partidos existentes en la base de datos de forma O(N)."""
        if not self.slots or not partidos:
            return self

        # Crear índice de partidos (Hash Map) con acceso O(1)
        partidos_dict = {}
        for p in partidos:
            if excluir_partido_id is not None and p.id == excluir_partido_id:
                continue
            
            # La llave será el string "HH:MM"
            hora_str = p.horario.strftime("%H:%M")
            # En caso remoto de colisión en DB, nos quedamos con el primero
            if hora_str not in partidos_dict:
                partidos_dict[hora_str] = p

        # Recorrer la agenda y hacer lookup instantáneo O(1)
        for slot in self.slots:
            p = partidos_dict.get(slot["horario"])
            if p:
                slot["estado"] = "bloqueado" if getattr(p, "estado", None) == "bloqueado" else "ocupado"
                
                if incluir_detalle:
                    slot["partido_id"] = p.id
                    slot["cliente_nombre"] = getattr(p, "cliente_nombre", None) or "Torneo"
                    slot["cliente_apellido"] = getattr(p, "cliente_apellido", None)
                    slot["cliente_telefono"] = getattr(p, "cliente_telefono", None)
                    organizador = getattr(p, "organizador", None)
                    slot["organizador_nombre"] = organizador.nombre if organizador else None
                    slot["organizador_apellido"] = organizador.apellido if organizador else None
                    slot["es_reserva_manual"] = getattr(p, "reserva_manual", False) or False

        return self

    def build(self) -> List[Dict[str, Any]]:
        """Devuelve la lista final de slots construidos."""
        return self.slots
