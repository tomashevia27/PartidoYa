import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CanchasService } from "@/services/canchas.service"
import { API_URL, fetchApi } from "@/lib/api-client"

export const canchasKeys = {
  all: ['canchas'] as const,
  lists: () => [...canchasKeys.all, 'list'] as const,
  list: (filters: string) => [...canchasKeys.lists(), { filters }] as const,
  details: () => [...canchasKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...canchasKeys.details(), id] as const,
}

export function useCanchas(role: string | null) {
  return useQuery({
    queryKey: canchasKeys.list(role === "admin" ? "mis-canchas" : "disponibles"),
    queryFn: async () => {
      if (role === "admin") {
        return CanchasService.getMisCanchas()
      } else {
        // En frontend/app/(app)/canchas/page.tsx usaba fetch directamente:
        const res = await fetch(`${API_URL}/canchas/disponibles`)
        if (!res.ok) throw new Error("Error al cargar canchas disponibles")
        return res.json()
      }
    },
    enabled: role !== null, // Solo ejecuta si conocemos el rol del usuario (aunque sea "jugador" o "admin")
  })
}

export function useCancha(id: string | number) {
  return useQuery({
    queryKey: canchasKeys.detail(id),
    queryFn: () => CanchasService.getById(id),
    enabled: !!id,
  })
}

export function useCanchasMutations() {
  const queryClient = useQueryClient()

  const createCancha = useMutation({
    mutationFn: (data: Parameters<typeof CanchasService.create>[0]) => CanchasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canchasKeys.lists() })
    },
  })

  const updateCancha = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof CanchasService.update>[1] }) =>
      CanchasService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: canchasKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: canchasKeys.lists() })
    },
  })

  const deleteCancha = useMutation({
    mutationFn: (id: string | number) => CanchasService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: canchasKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: canchasKeys.lists() })
    },
  })

  return {
    createCancha,
    updateCancha,
    deleteCancha,
  }
}
