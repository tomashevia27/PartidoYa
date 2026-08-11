import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar, Line, ResponsiveContainer } from "recharts"

interface EvolucionChartProps {
    combinedData: { fecha: string; cantidad: number; tasa: number }[];
}

export function EvolucionChart({ combinedData }: EvolucionChartProps) {
    const formatFechaCorto = (fecha: string) => {
        if (!fecha || !fecha.includes('-')) return fecha;
        const [yyyy, mm, dd] = fecha.split('-');
        return `${dd}-${mm}`;
    };

    return (
        <Card className="shadow-md lg:col-span-2">
            <CardHeader>
                <CardTitle>Evolución de Reservas y Ocupación</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.5} />
                        <XAxis dataKey="fecha" tickFormatter={formatFechaCorto} />
                        <YAxis yAxisId="left" allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <RechartsTooltip 
                            labelFormatter={(val) => `Fecha: ${formatFechaCorto(val)}`} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="cantidad" name="Reservas" fill="#ea580c" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="tasa" name="Ocupación %" stroke="#9f1239" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
