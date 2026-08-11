import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

import { ComparativaCanchasRespuestaDTO, CanchaEstadisticaDTO } from "./types"

interface ComparativaChartProps {
    comparativa?: ComparativaCanchasRespuestaDTO;
    canchas: { id: number; nombre: string }[];
    selectedCancha: string;
}

export function ComparativaChart({ comparativa, canchas, selectedCancha }: ComparativaChartProps) {
    const [canchasComparar, setCanchasComparar] = useState<number[]>([])

    useEffect(() => {
        if (canchas.length > 0 && canchasComparar.length === 0) {
            setCanchasComparar(canchas.map(c => c.id))
        }
    }, [canchas, canchasComparar.length])

    if (selectedCancha !== "todas" || !comparativa || comparativa.datos.length <= 1) {
        return null;
    }

    return (
        <Card className="shadow-md lg:col-span-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Comparativa de Rendimiento por Cancha</CardTitle>
                    <div className="flex flex-wrap gap-2">
                        {canchas.map((c: { id: number; nombre: string }) => (
                            <Button
                                key={c.id}
                                variant={canchasComparar.includes(c.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    if (canchasComparar.includes(c.id)) {
                                        setCanchasComparar(canchasComparar.filter(id => id !== c.id))
                                    } else {
                                        setCanchasComparar([...canchasComparar, c.id])
                                    }
                                }}
                            >
                                {c.nombre}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparativa.datos.filter((d: CanchaEstadisticaDTO) => canchasComparar.includes(d.cancha_id))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.5} />
                        <XAxis dataKey="nombre" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`${value} reservas`, 'Reservas']}
                        />
                        <Bar dataKey="reservas" name="Reservas" fill="#ea580c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
