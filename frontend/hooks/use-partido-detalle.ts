import { getErrorMessage } from "@/lib/api-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import {
  getPartido,
  getCancha,
  getUserProfile,
  cancelarPartido,
  inscribirseAPartido,
  bajarseDePartido,
  type PartidoData,
  type CanchaData,
  type UserProfile
} from "@/hooks/use-api"

export function usePartidoDetalle(partidoId: string) {
  const router = useRouter()

  const [partido, setPartido] = useState<PartidoData | null>(null)
  const [cancha, setCancha] = useState<CanchaData | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  
  const [selectedPlayer, setSelectedPlayer] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const pData = await getPartido(partidoId)
        setPartido(pData)

        // Luego de obtener el partido, buscamos los detalles de la cancha (ahora con Zod)
        try {
          const cData = await getCancha(pData.cancha_id)
          setCancha(cData)
        } catch (e) {
          console.warn("Error al cargar cancha:", e)
        }

        try {
          const user = await getUserProfile()
          setCurrentUser(user)
        } catch (e) {
          // No user logged in or error
        }
      } catch (error) {
        console.warn("Error al cargar detalles:", error)
        router.push("/profile")
      } finally {
        setIsLoading(false)
      }
    }

    if (partidoId) {
      loadData()
    }
  }, [partidoId, router])

  const confirmedCount = partido ? partido.cantidad_jugadores - partido.cupos_disponibles : 0
  const spotsLeft = partido ? partido.cupos_disponibles : 0

  const isOrganizer = !!(currentUser && partido?.organizador && currentUser.id === partido.organizador.id)
  const isJoined = !!(currentUser && partido?.jugadores?.some(j => j.id === currentUser.id))
  
  const canEditOrCancel = isOrganizer && partido?.estado?.toLowerCase() !== "cancelado"
  const canJoin = partido?.tipo === "abierto" && partido?.estado?.toLowerCase() !== "cancelado" && !isOrganizer && !isJoined && spotsLeft > 0 && currentUser?.rol !== "admin"
  const canLeave = partido?.tipo === "abierto" && partido?.estado?.toLowerCase() !== "cancelado" && !isOrganizer && isJoined

  const handleCancel = async () => {
    if (!partido) return
    const date = new Date(`${partido.fecha}T${partido.horario}`)
    const now = new Date()
    const hoursDifference = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    const cancelacionAnticipada = hoursDifference >= 24

    const result = await Swal.fire({
      title: "¿Cancelar partido?",
      text: cancelacionAnticipada 
        ? "Estás por cancelar este partido." 
        : "Si cancelás este partido, no se reembolsará el dinero. ¿Estás seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, mantener"
    })

    if (result.isConfirmed) {
      setIsCancelling(true)
      try {
        await cancelarPartido(partido.id)
        await Swal.fire({
          title: cancelacionAnticipada ? "Reserva cancelada" : "Baja confirmada",
          text: cancelacionAnticipada ? "Reserva cancelada con éxito. En las próximas horas la seña será reembolsada." : "",
          icon: cancelacionAnticipada ? "success" : "info",
          confirmButtonColor: "#FF6B4A"
        })
        const updated = await getPartido(partidoId)
        setPartido(updated)
      } catch (error) {
        Swal.fire("Error", getErrorMessage(error) || "No se pudo cancelar el partido", "error")
      } finally {
        setIsCancelling(false)
      }
    }
  }

  const handleJoin = async () => {
    if (!partido) return
    const result = await Swal.fire({
      title: "¿Confirmar inscripción?",
      text: "Vas a reservar tu lugar en este partido.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FF6B4A",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sí, anotarme",
      cancelButtonText: "Cancelar"
    })

    if (result.isConfirmed) {
      setIsJoining(true)
      try {
        await inscribirseAPartido(partido.id)

        await Swal.fire({
          title: "¡Reserva iniciada!",
          text: "Serás redirigido a la pasarela de pago para abonar la seña de la cancha.",
          icon: "success",
          confirmButtonColor: "#FF6B4A",
          confirmButtonText: "Proceder al pago"
        })

        await Swal.fire({
          title: "¡Pago exitoso!",
          text: "Tu lugar fue reservado correctamente.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        })

        const updated = await getPartido(partidoId)
        setPartido(updated)
      } catch (error) {
        Swal.fire("Error", getErrorMessage(error) || "No se pudo completar la inscripción", "error")
      } finally {
        setIsJoining(false)
      }
    }
  }

  const handleLeave = async () => {
    if (!partido) return
    const date = new Date(`${partido.fecha}T${partido.horario}`)
    const now = new Date()
    const hoursDifference = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    const cancelacionAnticipada = hoursDifference >= 24

    const result = await Swal.fire({
      title: "¿Darse de baja?",
      text: cancelacionAnticipada
        ? "Estás por darte de baja de este partido."
        : "Si te das de baja de este partido, no se reembolsará el dinero. ¿Estás seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sí, darme de baja",
      cancelButtonText: "Cancelar"
    })

    if (result.isConfirmed) {
      setIsLeaving(true)
      try {
        await bajarseDePartido(partido.id)
        await Swal.fire({
          title: cancelacionAnticipada ? "Inscripción cancelada" : "Baja confirmada",
          text: cancelacionAnticipada ? "Inscripción cancelada con éxito. En las próximas horas la seña será reembolsada." : "",
          icon: cancelacionAnticipada ? "success" : "info",
          confirmButtonColor: "#FF6B4A"
        })
        const updated = await getPartido(partidoId)
        setPartido(updated)
      } catch (error) {
        Swal.fire("Error", getErrorMessage(error) || "No se pudo completar la baja", "error")
      } finally {
        setIsLeaving(false)
      }
    }
  }

  return {
    partido,
    cancha,
    currentUser,
    isLoading,
    isCancelling,
    isJoining,
    isLeaving,
    selectedPlayer,
    setSelectedPlayer,
    confirmedCount,
    spotsLeft,
    canEditOrCancel,
    canJoin,
    canLeave,
    handleCancel,
    handleJoin,
    handleLeave
  }
}
