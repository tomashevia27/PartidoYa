import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TorneosService } from "@/services/torneos.service"

// --- QUERIES ---

export const torneosKeys = {
  all: ['torneos'] as const,
  lists: () => [...torneosKeys.all, 'list'] as const,
  list: (filters: string) => [...torneosKeys.lists(), { filters }] as const,
  details: () => [...torneosKeys.all, 'detail'] as const,
  detail: (id: number) => [...torneosKeys.details(), id] as const,
  estadisticas: (id: number) => [...torneosKeys.detail(id), 'estadisticas'] as const,
  topGoleadores: (id: number) => [...torneosKeys.detail(id), 'top-goleadores'] as const,
  vallasInvictas: (id: number) => [...torneosKeys.detail(id), 'vallas-invictas'] as const,
  fixture: (id: number) => [...torneosKeys.detail(id), 'fixture'] as const,
  bracket: (id: number) => [...torneosKeys.detail(id), 'bracket'] as const,
  tabla: (id: number) => [...torneosKeys.detail(id), 'tabla'] as const,
}

export function useTorneos(disponibles: boolean = false) {
  return useQuery({
    queryKey: torneosKeys.list(disponibles ? 'disponibles' : 'todos'),
    queryFn: () => disponibles ? TorneosService.getDisponibles() : TorneosService.getAll(),
  })
}

export function useMisTorneos() {
  return useQuery({
    queryKey: torneosKeys.list('mis-torneos'),
    queryFn: () => TorneosService.getMisTorneos(),
  })
}

export function useTorneo(id: number) {
  return useQuery({
    queryKey: torneosKeys.detail(id),
    queryFn: () => TorneosService.getById(id),
    enabled: !!id,
  })
}

export function useTorneoFixture(id: number) {
  return useQuery({
    queryKey: torneosKeys.fixture(id),
    queryFn: () => TorneosService.getFixtureTorneo(id),
    enabled: !!id,
  })
}

export function useTorneoFixturePorFechas(id: number) {
  return useQuery({
    queryKey: [...torneosKeys.fixture(id), 'fechas'],
    queryFn: () => TorneosService.getFixturePorFechas(id),
    enabled: !!id,
  })
}

export function useTorneoBracket(id: number) {
  return useQuery({
    queryKey: torneosKeys.bracket(id),
    queryFn: () => TorneosService.getBracket(id),
    enabled: !!id,
  })
}

export function useTorneoEstadisticas(id: number) {
  return useQuery({
    queryKey: torneosKeys.estadisticas(id),
    queryFn: () => TorneosService.getEstadisticas(id),
    enabled: !!id,
  })
}

export function useTorneoTopGoleadores(id: number, limit: number = 50) {
  return useQuery({
    queryKey: torneosKeys.topGoleadores(id),
    queryFn: () => TorneosService.getTopJugadores(id, "goleadores", limit).catch(() => []),
    enabled: !!id,
  })
}

export function useTorneoVallasInvictas(id: number, limit: number = 50) {
  return useQuery({
    queryKey: torneosKeys.vallasInvictas(id),
    queryFn: async () => {
        const vallas = await TorneosService.getVallasInvictas(id, limit).catch(() => [])
        return [...vallas].sort((a, b) => (a.goles_recibidos ?? 0) - (b.goles_recibidos ?? 0))
    },
    enabled: !!id,
  })
}

export function useTorneoTabla(id: number) {
  return useQuery({
    queryKey: torneosKeys.tabla(id),
    queryFn: () => TorneosService.getTablaPosiciones(id),
    enabled: !!id,
  })
}

// --- MUTATIONS ---

export function useTorneoMutations() {
  const queryClient = useQueryClient()

  const createTorneo = useMutation({
    mutationFn: (data: Parameters<typeof TorneosService.create>[0]) => TorneosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.lists() })
    },
  })

  const updateTorneo = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Parameters<typeof TorneosService.update>[1] }) => TorneosService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: torneosKeys.lists() })
    },
  })

  const inscribirEquipo = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => TorneosService.inscribirEquipo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: torneosKeys.lists() })
    },
  })

  const cancelarTorneo = useMutation({
    mutationFn: (id: number) => TorneosService.cancelar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: torneosKeys.lists() })
    },
  })

  const bajarseTorneo = useMutation({
    mutationFn: (id: number) => TorneosService.bajarse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: torneosKeys.lists() })
    },
  })

  const generarFixture = useMutation({
    mutationFn: (id: number) => TorneosService.generarFixture(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: torneosKeys.fixture(id) })
    },
  })

  const cargarResultado = useMutation({
    mutationFn: ({ partidoId, payload }: { partidoId: number, payload: any }) => TorneosService.cargarResultadoPartido(partidoId, payload),
    onSuccess: () => {
      // Invalida todo lo relacionado a torneos, para asegurar que estadisticas, fixture, tablas se actualicen
      queryClient.invalidateQueries({ queryKey: torneosKeys.all })
    },
  })

  const programarPartido = useMutation({
    mutationFn: ({ partidoId, payload }: { partidoId: number, payload: any }) => TorneosService.programarPartido(partidoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: torneosKeys.all })
    },
  })

  return {
    createTorneo,
    updateTorneo,
    inscribirEquipo,
    cancelarTorneo,
    bajarseTorneo,
    generarFixture,
    cargarResultado,
    programarPartido,
  }
}
