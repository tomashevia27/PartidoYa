import { useQuery } from "@tanstack/react-query"
import { EstadisticasService } from "@/services/estadisticas.service"

export const estadisticasKeys = {
  all: ['estadisticas'] as const,
  kpis: (canchaId?: number) => [...estadisticasKeys.all, 'kpis', canchaId] as const,
  reservasPeriodo: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'reservasPeriodo', desde, hasta, canchaId] as const,
  ocupacion: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'ocupacion', desde, hasta, canchaId] as const,
  distribucionTipo: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'distribucionTipo', desde, hasta, canchaId] as const,
  distribucionModalidad: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'distribucionModalidad', desde, hasta, canchaId] as const,
  mapaCalor: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'mapaCalor', desde, hasta, canchaId] as const,
  diasSemana: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'diasSemana', desde, hasta, canchaId] as const,
  ingresos: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'ingresos', desde, hasta, canchaId] as const,
  cancelaciones: (desde: string, hasta: string, canchaId?: number) => [...estadisticasKeys.all, 'cancelaciones', desde, hasta, canchaId] as const,
  comparativa: (desde: string, hasta: string) => [...estadisticasKeys.all, 'comparativa', desde, hasta] as const,
}

export function useEstadisticasDashboard(desde: string, hasta: string, canchaId?: number, role?: string | null) {
  const enabled = role === "admin" && !!desde && !!hasta

  const kpisQuery = useQuery({
    queryKey: estadisticasKeys.kpis(canchaId),
    queryFn: () => EstadisticasService.getKpis(canchaId),
    enabled,
  })

  const reservasPeriodoQuery = useQuery({
    queryKey: estadisticasKeys.reservasPeriodo(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getReservasPorPeriodo(desde, hasta, canchaId),
    enabled,
  })

  const ocupacionQuery = useQuery({
    queryKey: estadisticasKeys.ocupacion(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getOcupacion(desde, hasta, canchaId),
    enabled,
  })

  const distribucionTipoQuery = useQuery({
    queryKey: estadisticasKeys.distribucionTipo(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getDistribucionTipo(desde, hasta, canchaId),
    enabled,
  })

  const distribucionModalidadQuery = useQuery({
    queryKey: estadisticasKeys.distribucionModalidad(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getDistribucionModalidad(desde, hasta, canchaId),
    enabled,
  })

  const mapaCalorQuery = useQuery({
    queryKey: estadisticasKeys.mapaCalor(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getMapaCalor(desde, hasta, canchaId),
    enabled,
  })

  const diasSemanaQuery = useQuery({
    queryKey: estadisticasKeys.diasSemana(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getReservasPorDiaSemana(desde, hasta, canchaId),
    enabled,
  })

  const ingresosQuery = useQuery({
    queryKey: estadisticasKeys.ingresos(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getIngresos(desde, hasta, canchaId),
    enabled,
  })

  const cancelacionesQuery = useQuery({
    queryKey: estadisticasKeys.cancelaciones(desde, hasta, canchaId),
    queryFn: () => EstadisticasService.getCancelaciones(desde, hasta, canchaId),
    enabled,
  })

  const comparativaQuery = useQuery({
    queryKey: estadisticasKeys.comparativa(desde, hasta),
    queryFn: () => EstadisticasService.getComparativaCanchas(desde, hasta),
    enabled,
  })

  const isLoading = 
    kpisQuery.isLoading || 
    reservasPeriodoQuery.isLoading || 
    ocupacionQuery.isLoading || 
    distribucionTipoQuery.isLoading ||
    distribucionModalidadQuery.isLoading ||
    mapaCalorQuery.isLoading ||
    diasSemanaQuery.isLoading ||
    ingresosQuery.isLoading ||
    cancelacionesQuery.isLoading ||
    comparativaQuery.isLoading

  return {
    kpis: kpisQuery.data || null,
    reservasPeriodo: reservasPeriodoQuery.data || null,
    ocupacion: ocupacionQuery.data || null,
    distTipo: distribucionTipoQuery.data || null,
    distModalidad: distribucionModalidadQuery.data || null,
    mapaCalor: mapaCalorQuery.data || null,
    diasSemana: diasSemanaQuery.data || null,
    ingresos: ingresosQuery.data || null,
    cancelaciones: cancelacionesQuery.data || null,
    comparativa: comparativaQuery.data || null,
    isLoading
  }
}
