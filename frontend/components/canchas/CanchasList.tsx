"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, Clock, Zap, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FootballIcon } from "./FootballIcon"

interface Cancha {
    id: number;
    nombre: string;
    tipo_superficie: string;
    tamano: number;
    iluminacion: boolean;
    zona: string;
    direccion: string;
    precio_por_turno: number;
    hora_apertura: string;
    hora_cierre: string;
    fotos?: string | null;
}

interface CanchasListProps {
    canchas: Cancha[];
    role: string;
    searchTerm: string;
}

export function CanchasList({ canchas, role, searchTerm }: CanchasListProps) {
    const router = useRouter()

    const formatearPrecio = (precio: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
        }).format(precio)
    }

    return (
        <>
            {/* Content Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {canchas.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No se encontraron canchas
                        </h3>
                        <p className="text-muted-foreground text-lg">
                            {searchTerm ? "Probá con otros términos de búsqueda" : "No hay canchas registradas en este momento."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-muted-foreground">
                                <span className="font-semibold text-foreground">{canchas.length}</span> canchas encontradas
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {canchas.map((cancha, index) => (
                                <Link key={cancha.id} href={`/canchas/${cancha.id}`}>
                                    <div
                                        className="bg-card rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group h-full overflow-hidden hover:-translate-y-1 animate-slide-up"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {cancha.fotos ? (
                                            <div className="aspect-video w-full overflow-hidden relative">
                                                <img
                                                    src={cancha.fotos}
                                                    alt={cancha.nombre}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                {cancha.iluminacion && (
                                                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        Iluminada
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full bg-gradient-to-br from-primary/10 via-secondary to-muted flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-10">
                                                    <div className="absolute top-4 left-4">
                                                        <FootballIcon className="w-8 h-8 text-primary animate-float" />
                                                    </div>
                                                    <div className="absolute bottom-4 right-4">
                                                        <FootballIcon className="w-6 h-6 text-primary animate-float-reverse" />
                                                    </div>
                                                </div>
                                                <div className="w-20 h-20 bg-card/80 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <FootballIcon className="h-10 w-10 text-primary" />
                                                </div>
                                                {cancha.iluminacion && (
                                                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        Iluminada
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {cancha.nombre}
                                                </h3>
                                                <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-xs font-medium">4.8</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 text-sm">
                                                <div className="flex items-center gap-2.5 text-muted-foreground">
                                                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="truncate">{cancha.zona} - {cancha.direccion}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-muted-foreground">
                                                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                                        <Clock className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span>{cancha.hora_apertura} - {cancha.hora_cierre}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-muted-foreground">
                                                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                                        <Users className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span>Fútbol {cancha.tamano} • {cancha.tipo_superficie}</span>
                                                </div>
                                            </div>
                                            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-primary">
                                                        {formatearPrecio(cancha.precio_por_turno)}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm ml-1">/turno</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                                    onClick={(e) => {
                                                        if (role === "admin") {
                                                            e.preventDefault()
                                                            router.push(`/canchas/${cancha.id}/editar`)
                                                        }
                                                    }}
                                                >
                                                    {role === "admin" ? "Editar" : "Reservar"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* CTA Section (Visible solo si no es Admin para mejorar UX) */}
            {role !== "admin" && (
                <div className="bg-gradient-to-r from-primary to-primary/80 py-16 mt-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-[10%] animate-float">
                            <FootballIcon className="w-20 h-20 text-card" />
                        </div>
                        <div className="absolute bottom-10 right-[15%] animate-float-reverse">
                            <FootballIcon className="w-16 h-16 text-card" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow">
                            <FootballIcon className="w-32 h-32 text-card" />
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4 text-balance">
                            ¿Tenés una cancha?
                        </h2>
                        <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
                            Sumá tu cancha a PartidoYa y llegá a miles de jugadores que buscan dónde jugar
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
