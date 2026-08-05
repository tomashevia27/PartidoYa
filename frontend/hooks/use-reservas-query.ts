import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReservasService, type ReprogramarReservaData } from "@/services/reservas.service"

export const reservasKeys = {
  all: ['reservas'] as const,
  agendas: () => [...reservasKeys.all, 'agendas'] as const,
  agenda: (canchaId: number | string, fecha: string) => [...reservasKeys.agendas(), canchaId, fecha] as const,
  turnos: (canchaId: number | string, fecha: string, excluirPartidoId?: number) => [...reservasKeys.all, 'turnos', canchaId, fecha, excluirPartidoId] as const,
}

export function useAgendaQuery(canchaId: number | string, fecha: string) {
  return useQuery({
    queryKey: reservasKeys.agenda(canchaId, fecha),
    queryFn: () => ReservasService.getAgenda(canchaId, fecha),
    enabled: !!canchaId && !!fecha,
  })
}

export function useTurnosQuery(canchaId: number | string, fecha: string, excluirPartidoId?: number) {
  return useQuery({
    queryKey: reservasKeys.turnos(canchaId, fecha, excluirPartidoId),
    queryFn: () => ReservasService.getTurnos(canchaId, fecha, excluirPartidoId),
    enabled: !!canchaId && !!fecha,
  })
}

export function useReservasMutations() {
  const queryClient = useQueryClient()

  const crearReservaManual = useMutation({
    mutationFn: (data: Parameters<typeof ReservasService.crearReservaManual>[0]) => ReservasService.crearReservaManual(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.agenda(variables.cancha_id, variables.fecha) })
      queryClient.invalidateQueries({ queryKey: reservasKeys.turnos(variables.cancha_id, variables.fecha) })
    },
  })

  const bloquearTurno = useMutation({
    mutationFn: (data: Parameters<typeof ReservasService.bloquearTurno>[0]) => ReservasService.bloquearTurno(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.agenda(variables.cancha_id, variables.fecha) })
      queryClient.invalidateQueries({ queryKey: reservasKeys.turnos(variables.cancha_id, variables.fecha) })
    },
  })

  const desbloquearTurno = useMutation({
    mutationFn: (partidoId: number) => ReservasService.desbloquearTurno(partidoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.agendas() })
      // Podriamos invalidar all turnos o agendas si no tenemos las variables especificas
    },
  })

  const cancelarReservaDueno = useMutation({
    mutationFn: (partidoId: number) => ReservasService.cancelarReservaDueno(partidoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.agendas() })
    },
  })

  const reprogramarReserva = useMutation({
    mutationFn: ({ partidoId, data }: { partidoId: number; data: ReprogramarReservaData }) =>
      ReservasService.reprogramarReserva(partidoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.agendas() })
    },
  })

  return {
    crearReservaManual,
    bloquearTurno,
    desbloquearTurno,
    cancelarReservaDueno,
    reprogramarReserva,
  }
}
