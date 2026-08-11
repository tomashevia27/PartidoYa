import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { KpiResumenDTO } from "./types"

interface KpiCardsProps {
    kpis?: KpiResumenDTO;
}

export function KpiCards({ kpis }: KpiCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Reservas (Mes)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{kpis?.reservas_mes || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {kpis?.reservas_semana} esta semana, {kpis?.reservas_hoy} hoy
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Ocupación (Hoy)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{kpis?.tasa_ocupacion_hoy || 0}%</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Estimado (Mes)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${kpis?.ingreso_estimado_mes.toLocaleString('es-AR') || 0}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Reserva</CardTitle>
                </CardHeader>
                <CardContent>
                    {kpis?.proxima_reserva_fecha ? (
                        <>
                            <div className="text-lg font-bold">
                                {kpis.proxima_reserva_fecha} - {kpis.proxima_reserva_horario}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {kpis.proxima_reserva_cancha}
                            </p>
                        </>
                    ) : (
                        <div className="text-lg font-bold text-muted-foreground">Sin reservas próximas</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
