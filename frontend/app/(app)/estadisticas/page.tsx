"use client"

import React, { useEffect, useState } from "react"
import { useAuthContext } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Legend } from "recharts"
import { useCanchas } from "@/hooks/use-canchas-query"
import { useEstadisticasDashboard } from "@/hooks/use-estadisticas-query"
import { format, startOfMonth, startOfWeek, subMonths, startOfYear, endOfMonth } from "date-fns"

import { KpiCards } from "@/components/estadisticas/KpiCards"
import { EvolucionChart } from "@/components/estadisticas/EvolucionChart"
import { MapaCalorChart } from "@/components/estadisticas/MapaCalorChart"
import { DistribucionCharts } from "@/components/estadisticas/DistribucionCharts"
import { ComparativaChart } from "@/components/estadisticas/ComparativaChart"

export default function EstadisticasPage() {
    const { role, isLoading: authLoading } = useAuthContext()
    const router = useRouter()

    const [selectedCancha, setSelectedCancha] = useState<string>("todas")
    const [dateRange, setDateRange] = useState<string>("mes") // "hoy", "semana", "mes"

    const { data: canchas = [] } = useCanchas(role === "admin" ? "admin" : null)

    // Removed canchasComparar and formatFechaCorto (moved to child components)

    useEffect(() => {
        if (!authLoading && role !== "admin") {
            router.push("/home")
        }
    }, [role, authLoading, router])

    let fechaDesde = ""
    let fechaHasta = format(new Date(), "yyyy-MM-dd")
    const hoy = new Date()

    if (dateRange === "hoy") {
        fechaDesde = format(hoy, "yyyy-MM-dd")
    } else if (dateRange === "semana") {
        fechaDesde = format(startOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd")
    } else if (dateRange === "mes") {
        fechaDesde = format(startOfMonth(hoy), "yyyy-MM-dd")
    } else if (dateRange === "mes_pasado") {
        const mesPasado = subMonths(hoy, 1)
        fechaDesde = format(startOfMonth(mesPasado), "yyyy-MM-dd")
        fechaHasta = format(endOfMonth(mesPasado), "yyyy-MM-dd")
    } else if (dateRange === "ultimos_3_meses") {
        fechaDesde = format(subMonths(hoy, 3), "yyyy-MM-dd")
    } else if (dateRange === "este_ano") {
        fechaDesde = format(startOfYear(hoy), "yyyy-MM-dd")
    }

    const canchaId = selectedCancha !== "todas" ? parseInt(selectedCancha) : undefined

    const { 
        kpis, 
        reservasPeriodo, 
        ocupacion, 
        distTipo, 
        distModalidad, 
        mapaCalor, 
        diasSemana, 
        ingresos, 
        cancelaciones, 
        comparativa, 
        isLoading 
    } = useEstadisticasDashboard(fechaDesde, fechaHasta, canchaId, role)

    if (authLoading || role !== "admin") return null

    const combinedData = reservasPeriodo?.datos.map((item: any, index: number) => ({
        fecha: item.fecha,
        cantidad: item.cantidad,
        tasa: ocupacion?.datos[index]?.tasa || 0
    })) || []

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard de Estadísticas</h1>
                    <p className="text-muted-foreground mt-1">Visualizá el rendimiento de tus canchas</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <Select value={selectedCancha} onValueChange={setSelectedCancha}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Todas mis canchas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todas">Todas mis canchas</SelectItem>
                            {canchas.map((c: any) => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Este mes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hoy">Hoy</SelectItem>
                            <SelectItem value="semana">Esta semana</SelectItem>
                            <SelectItem value="mes">Este mes</SelectItem>
                            <SelectItem value="mes_pasado">Mes pasado</SelectItem>
                            <SelectItem value="ultimos_3_meses">Últimos 3 meses</SelectItem>
                            <SelectItem value="este_ano">Este año</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPIs */}
                    <KpiCards kpis={kpis} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Reservas y Ocupación combinados */}
                        <EvolucionChart combinedData={combinedData} />

                        {/* Mapa de Calor */}
                        <MapaCalorChart mapaCalor={mapaCalor} />

                        {/* Distribución y Días Activos */}
                        <DistribucionCharts 
                            distTipo={distTipo} 
                            distModalidad={distModalidad} 
                            cancelaciones={cancelaciones} 
                            diasSemana={diasSemana} 
                        />

                        {/* Comparativa entre Canchas */}
                        <ComparativaChart 
                            comparativa={comparativa} 
                            canchas={canchas} 
                            selectedCancha={selectedCancha} 
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
