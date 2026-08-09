import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Clock, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const DIAS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function decodeDias(bitmask: number): string[] {
  return DIAS_LABELS.filter((_, i) => (bitmask >> i) & 1)
}

interface Props {
  torneo: any
  partidosCount: any
  cuposRestantes: number
  estaAbierto: boolean
  hayCupos: boolean
  isUserEnrolled: boolean
  role: string | null | undefined
  isLeaving: boolean
  onLeave: () => void
}

export function TorneoHeader({
  torneo, partidosCount, cuposRestantes, estaAbierto, 
  hayCupos, isUserEnrolled, role, isLeaving, onLeave
}: Props) {
  
  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
    }).format(precio)
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <Link href="/torneos" className="inline-flex items-center text-sm text-primary hover:underline mb-6 font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Torneos
            </Link>

            <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        {estaAbierto ? (
                            cuposRestantes <= 0 ? (
                                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    Completo
                                </span>
                            ) : (
                                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Cupos disponibles
                                </span>
                            )
                        ) : (
                            <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md
                                ${torneo.estado === 'En curso' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }
                            `}>
                                {torneo.estado}
                            </span>
                        )}
                        <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border">
                            {torneo.formato}
                        </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                        {torneo.nombre}
                    </h1>
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span>Inicio: {new Date(torneo.fecha_inicio).toLocaleDateString('es-AR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span>{torneo.lugar}</span>
                        </div>
                        {torneo.franja_horaria && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <span>{torneo.franja_horaria.replace('-', ' – ')} hs</span>
                            </div>
                        )}
                        {torneo.dias_operativos != null && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {decodeDias(torneo.dias_operativos).map(d => (
                                    <span key={d} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                        {d}
                                    </span>
                                ))}
                            </div>
                        )}
                        {partidosCount !== null && partidosCount.total > 0 && (
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-primary" />
                                <span className="text-sm">
                                    <span className="font-semibold text-foreground">{partidosCount.jugados}</span>
                                    <span className="mx-1">/</span>
                                    <span className="font-semibold text-foreground">{partidosCount.total}</span>
                                    <span className="ml-1">partidos jugados</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-md min-w-[280px]">
                    <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Valor de Inscripción</div>
                    <div className="text-3xl font-bold text-foreground mb-4">
                        {formatearPrecio(torneo.costo_inscripcion)}
                        <span className="text-sm font-normal text-muted-foreground"> / equipo</span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{cuposRestantes} cupos disponibles de {torneo.max_equipos}</span>
                    </div>

                    {role !== "admin" && (
                        <>
                            {isUserEnrolled ? (
                                estaAbierto && torneo.estado !== "En curso" ? (
                                    <Button 
                                        variant="destructive" 
                                        className="w-full" 
                                        size="lg" 
                                        onClick={onLeave} 
                                        disabled={isLeaving}
                                    >
                                        {isLeaving ? "Saliendo..." : "Darse de baja"}
                                    </Button>
                                ) : (
                                    <Button className="w-full" size="lg" disabled variant="secondary">
                                        Inscripto
                                    </Button>
                                )
                            ) : estaAbierto && hayCupos ? (
                                <Link href={`/torneos/${torneo.id}/inscribirse`} className="block w-full">
                                    <Button className="w-full" size="lg">
                                        Anotar a mi equipo
                                    </Button>
                                </Link>
                            ) : (
                                <Button className="w-full" size="lg" disabled variant="secondary">
                                    {!estaAbierto ? "Inscripción Cerrada" : "Torneo Lleno"}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}
