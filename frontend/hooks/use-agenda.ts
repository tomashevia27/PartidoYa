import { getErrorMessage } from "@/lib/api-client"
import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { CanchasService, type CanchaData } from "@/services/canchas.service"
import { ReservasService, type AgendaData, type AgendaSlot } from "@/services/reservas.service"

export function useAgenda() {
  const [canchas, setCanchas] = useState<CanchaData[]>([])
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<number | "">("")
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0])
  const [agenda, setAgenda] = useState<AgendaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [slotSeleccionado, setSlotSeleccionado] = useState<AgendaSlot | null>(null)

  const [reprogramarDialogOpen, setReprogramarDialogOpen] = useState(false)
  const [slotReprogramar, setSlotReprogramar] = useState<AgendaSlot | null>(null)

  useEffect(() => {
    async function fetchCanchas() {
      try {
        const data = await CanchasService.getMisCanchas()
        setCanchas(data)
        if (data.length > 0) {
          setCanchaSeleccionada(data[0].id)
        }
      } catch (e) {
        console.warn("Error al cargar canchas:", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCanchas()
  }, [])

  useEffect(() => {
    if (!canchaSeleccionada || !fecha) return

    async function fetchAgenda() {
      setIsLoadingAgenda(true)
      try {
        const data = await ReservasService.getAgenda(canchaSeleccionada as number, fecha)
        setAgenda(data)
      } catch (e) {
        console.warn("Error al cargar agenda:", e)
        setAgenda(null)
      } finally {
        setIsLoadingAgenda(false)
      }
    }

    fetchAgenda()
  }, [canchaSeleccionada, fecha])

  const recargarAgenda = () => {
    if (canchaSeleccionada && fecha) {
      ReservasService.getAgenda(canchaSeleccionada as number, fecha)
        .then((data) => setAgenda(data))
        .catch(() => {})
    }
  }

  const canchaActual = canchas.find((c) => c.id === canchaSeleccionada)

  const handleSlotClick = (slot: AgendaSlot) => {
    if (slot.estado !== "disponible") return
    setSlotSeleccionado(slot)
    setDialogOpen(true)
  }

  const handleBloquear = async (slot: AgendaSlot) => {
    const confirm = await Swal.fire({
      title: "¿Bloquear turno?",
      text: "El turno dejará de estar disponible para reservas.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, bloquear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#FF6B4A",
    })
    if (!confirm.isConfirmed) return
    try {
      await ReservasService.bloquearTurno({
        cancha_id: Number(canchaSeleccionada),
        fecha,
        horario: slot.horario,
      })
      await Swal.fire({
        title: "Turno bloqueado",
        text: "El turno fue bloqueado y no estará disponible para reservas.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })
      recargarAgenda()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: getErrorMessage(error) || "No se pudo bloquear el turno",
        icon: "error",
        confirmButtonColor: "#FF6B4A",
      })
    }
  }

  const handleDesbloquear = async (slot: AgendaSlot) => {
    if (!slot.partido_id) return
    const confirm = await Swal.fire({
      title: "¿Desbloquear turno?",
      text: "El turno volverá a estar disponible para reservas.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, desbloquear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#FF6B4A",
    })
    if (!confirm.isConfirmed) return
    try {
      await ReservasService.desbloquearTurno(slot.partido_id)
      await Swal.fire({
        title: "Turno desbloqueado",
        text: "El turno vuelve a estar disponible.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })
      recargarAgenda()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: getErrorMessage(error) || "No se pudo desbloquear el turno",
        icon: "error",
        confirmButtonColor: "#FF6B4A",
      })
    }
  }

  const handleCancelarReserva = async (slot: AgendaSlot) => {
    if (!slot.partido_id) return
    const confirm = await Swal.fire({
      title: "¿Cancelar esta reserva?",
      text: "El turno volverá a estar disponible. Si la reserva es de un jugador, será notificado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar reserva",
      cancelButtonText: "No, mantener",
      confirmButtonColor: "#EF4444",
    })
    if (!confirm.isConfirmed) return
    try {
      await ReservasService.cancelarReservaDueno(slot.partido_id)
      await Swal.fire({
        title: "Reserva cancelada",
        text: "El turno fue liberado exitosamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })
      recargarAgenda()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: getErrorMessage(error) || "No se pudo cancelar la reserva",
        icon: "error",
        confirmButtonColor: "#FF6B4A",
      })
    }
  }

  const handleReprogramar = (slot: AgendaSlot) => {
    setSlotReprogramar(slot)
    setReprogramarDialogOpen(true)
  }

  const handleReservaExitosa = () => {
    recargarAgenda()
  }

  // Generar fechas (desde ayer hasta 14 días en el futuro)
  const hoy = new Date()
  const dates = Array.from({ length: 16 }, (_, i) => {
    const d = new Date()
    d.setDate(hoy.getDate() + i - 1)
    return d
  })

  return {
    canchas,
    canchaSeleccionada,
    setCanchaSeleccionada,
    canchaActual,
    fecha,
    setFecha,
    dates,
    hoy,
    agenda,
    isLoading,
    isLoadingAgenda,
    dialogOpen,
    setDialogOpen,
    slotSeleccionado,
    reprogramarDialogOpen,
    setReprogramarDialogOpen,
    slotReprogramar,
    handleSlotClick,
    handleBloquear,
    handleDesbloquear,
    handleCancelarReserva,
    handleReprogramar,
    recargarAgenda,
    handleReservaExitosa
  }
}
