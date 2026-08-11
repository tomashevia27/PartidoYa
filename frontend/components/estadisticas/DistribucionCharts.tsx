import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts"

const COLORS = ['#ea580c', '#c2410c', '#9a3412', '#7f1d1d', '#f97316'];

interface DistribucionChartsProps {
    distTipo: any;
    distModalidad: any;
    cancelaciones: any;
    diasSemana: any;
}

export function DistribucionCharts({ distTipo, distModalidad, cancelaciones, diasSemana }: DistribucionChartsProps) {
    return (
        <>
            {/* Distribución por Tipo */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Origen de Reservas</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    {(!distTipo?.datos || distTipo.datos.length === 0) ? (
                        <p className="text-muted-foreground">Sin datos suficientes</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distTipo.datos}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="cantidad"
                                    nameKey="tipo"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {distTipo.datos.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Distribución por Modalidad */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Reservas por Modalidad</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    {(!distModalidad?.datos || distModalidad.datos.length === 0) ? (
                        <p className="text-muted-foreground">Sin datos suficientes</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distModalidad.datos}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="cantidad"
                                    nameKey="modalidad"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {distModalidad.datos.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Cancelaciones vs Efectivas */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Efectividad de Reservas</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex flex-col items-center justify-center relative">
                    {(!cancelaciones) ? (
                        <p className="text-muted-foreground">Sin datos suficientes</p>
                    ) : (
                        <>
                            <div className="absolute top-4 right-4 text-right">
                                <p className="text-sm text-muted-foreground">Tasa Cancelación</p>
                                <p className="text-2xl font-bold text-red-600">{cancelaciones.tasa_cancelacion}%</p>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Efectivas', value: cancelaciones.total_efectivas },
                                            { name: 'Canceladas', value: cancelaciones.total_cancelaciones }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        <Cell fill="#ea580c" /> {/* Naranja para efectivas */}
                                        <Cell fill="#7f1d1d" /> {/* Rojo oscuro para canceladas */}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Días más activos */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Días de la Semana Más Activos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={diasSemana?.datos || []} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ccc" opacity={0.5} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="dia" type="category" width={80} tickFormatter={(val) => val.substring(0, 3)} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value} reservas`, 'Cantidad']}
                            />
                            <Bar dataKey="cantidad" name="Reservas" fill="#c2410c" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
    )
}
