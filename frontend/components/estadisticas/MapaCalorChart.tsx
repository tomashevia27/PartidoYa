import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MapaCalorChartProps {
    mapaCalor: any;
}

export function MapaCalorChart({ mapaCalor }: MapaCalorChartProps) {
    if (!mapaCalor?.datos || mapaCalor.datos.length === 0) {
        return (
            <Card className="shadow-md lg:col-span-2">
                <CardHeader>
                    <CardTitle>Horarios Más y Menos Reservados</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">Sin datos suficientes</p>
                </CardContent>
            </Card>
        );
    }

    const horas = Array.from({length: 16}, (_, i) => `${(i+8).toString().padStart(2, '0')}:00`);
    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const maxCantidad = Math.max(...mapaCalor.datos.map((d: any) => d.cantidad), 1);
    
    const getIntensity = (dia_num: number, hora: string) => {
        const cell = mapaCalor.datos.find((d: any) => d.dia_numero === dia_num && d.hora === hora);
        if (!cell || cell.cantidad === 0) return 'bg-slate-100 dark:bg-slate-800';
        
        const ratio = cell.cantidad / maxCantidad;
        if (ratio < 0.2) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100';
        if (ratio < 0.5) return 'bg-orange-300 dark:bg-orange-700/60 text-orange-950 dark:text-orange-50';
        if (ratio < 0.8) return 'bg-orange-500 dark:bg-orange-600 text-white';
        return 'bg-orange-700 dark:bg-orange-500 text-white';
    }

    return (
        <Card className="shadow-md lg:col-span-2">
            <CardHeader>
                <CardTitle>Horarios Más y Menos Reservados</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-4">
                    <div className="min-w-[600px] grid grid-cols-[auto_repeat(7,1fr)] gap-1">
                        <div className="text-xs font-semibold text-muted-foreground p-2 text-right">Hora \ Día</div>
                        {dias.map(d => (
                            <div key={d} className="text-xs font-semibold text-center p-2 truncate">{d.substring(0,3)}</div>
                        ))}
                        
                        {horas.map(hora => (
                            <React.Fragment key={hora}>
                                <div className="text-xs text-muted-foreground text-right p-2 border-r border-slate-200 dark:border-slate-800 flex items-center justify-end">
                                    {hora}
                                </div>
                                {dias.map((d, i) => {
                                    const intensityClass = getIntensity(i, hora);
                                    const cellData = mapaCalor.datos.find((data: any) => data.dia_numero === i && data.hora === hora);
                                    return (
                                        <div 
                                            key={`${d}-${hora}`} 
                                            className={`rounded flex items-center justify-center p-1 text-xs font-medium ${intensityClass} transition-colors hover:ring-2 hover:ring-primary cursor-pointer`}
                                            title={`${d} ${hora}: ${cellData?.cantidad || 0} reservas`}
                                        >
                                            {cellData?.cantidad || ''}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                    
                    <div className="flex items-center justify-end mt-4 gap-2 text-xs text-muted-foreground">
                        Menos
                        <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800"></div>
                        <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/40"></div>
                        <div className="w-4 h-4 rounded bg-orange-300 dark:bg-orange-700/60"></div>
                        <div className="w-4 h-4 rounded bg-orange-500 dark:bg-orange-600"></div>
                        <div className="w-4 h-4 rounded bg-orange-700 dark:bg-orange-500"></div>
                        Más reservas
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
