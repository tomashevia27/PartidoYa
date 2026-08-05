import { getErrorMessage } from "@/lib/api-client"
import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { type AgendaSlot } from "@/services/reservas.service"
import { useCanchas } from "@/hooks/use-canchas-query"
import { useAgendaQuery, useReservasMutations } from "@/hooks/use-reservas-query"

export function useAgenda() {
  const { data: canchas = [], isLoading: isLoadingCanchas } = useCanchas("admin")
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<number | "">("")
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (canchas.length > 0 && !canchaSeleccionada) {
      setCanchaSeleccionada(canchas[0].id)
    }
  }, [canchas, canchaSeleccionada])

  const { data: agenda = null, isLoading: isLoadingAgenda, refetch: recargarAgenda } = useAgendaQuery(canchaSeleccionada, fecha)

  const { bloquearTurno, desbloquearTurno, cancelarReservaDueno } = useReservasMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [slotSeleccionado, setSlotSeleccionado] = useState<AgendaSlot | null>(null)

  const [reprogramarDialogOpen, setReprogramarDialogOpen] = useState(false)
  const [slotReprogramar, setSlotReprogramar] = useState<AgendaSlot | null>(null)

  const isLoading = isLoadingCanchas

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
      await bloquearTurno.mutateAsync({
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
      await desbloquearTurno.mutateAsync(slot.partido_id!)
      await Swal.fire({
        title: "Turno desbloqueado",
        text: "El turno vuelve a estar disponible para reservas.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })
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
      await cancelarReservaDueno.mutateAsync(slot.partido_id!)
      await Swal.fire({
        title: "Reserva cancelada",
        text: "La reserva fue cancelada y el turno vuelve a estar disponible.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      })
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
