import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PartidosService, type PartidoDisponibleFilters } from "@/services/partidos.service"

export const partidosKeys = {
  all: ['partidos'] as const,
  lists: () => [...partidosKeys.all, 'list'] as const,
  listDisponibles: (filters: PartidoDisponibleFilters) => [...partidosKeys.lists(), 'disponibles', filters] as const,
  misPartidos: () => [...partidosKeys.lists(), 'mis-partidos'] as const,
  filtros: () => [...partidosKeys.all, 'filtros'] as const,
  details: () => [...partidosKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...partidosKeys.details(), id] as const,
}

export function usePartidosDisponibles(filters: PartidoDisponibleFilters) {
  return useQuery({
    queryKey: partidosKeys.listDisponibles(filters),
    queryFn: () => PartidosService.getDisponibles(filters),
  })
}

export function useFiltrosDisponibles() {
  return useQuery({
    queryKey: partidosKeys.filtros(),
    queryFn: () => PartidosService.getFiltrosDisponibles(),
  })
}

export function useMisPartidos() {
  return useQuery({
    queryKey: partidosKeys.misPartidos(),
    queryFn: () => PartidosService.getMisPartidos(),
  })
}

export function usePartido(id: string | number) {
  return useQuery({
    queryKey: partidosKeys.detail(id),
    queryFn: () => PartidosService.getById(id),
    enabled: !!id,
  })
}

export function usePartidosMutations() {
  const queryClient = useQueryClient()

  const createPartido = useMutation({
    mutationFn: (data: Parameters<typeof PartidosService.create>[0]) => PartidosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partidosKeys.lists() })
    },
  })

  const updatePartido = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof PartidosService.update>[1] }) =>
      PartidosService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partidosKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: partidosKeys.lists() })
    },
  })

  const cancelPartido = useMutation({
    mutationFn: (id: string | number) => PartidosService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: partidosKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: partidosKeys.lists() })
    },
  })

  const inscribirse = useMutation({
    mutationFn: (id: string | number) => PartidosService.inscribirse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: partidosKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: partidosKeys.lists() })
    },
  })

  const bajarse = useMutation({
    mutationFn: (id: string | number) => PartidosService.bajarse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: partidosKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: partidosKeys.lists() })
    },
  })

  return {
    createPartido,
    updatePartido,
    cancelPartido,
    inscribirse,
    bajarse,
  }
}
