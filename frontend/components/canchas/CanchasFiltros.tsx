"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CanchasFiltros() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [showFilters, setShowFilters] = useState(false)

    // Leer valores de la URL
    const searchTerm = searchParams.get("search") || ""
    const filtroSuperficie = searchParams.get("superficie") || ""
    const filtroTamano = searchParams.get("tamano") || ""
    const filtroIluminacion = searchParams.get("iluminacion") || "todas"

    const hasActiveFilters = filtroSuperficie !== "" || filtroTamano !== "" || filtroIluminacion !== "todas"

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== "todas") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams)
        params.delete("superficie")
        params.delete("tamano")
        params.delete("iluminacion")
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
            <div className="bg-card rounded-2xl border border-border shadow-xl p-4 sm:p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o zona..."
                            value={searchTerm}
                            onChange={(e) => updateFilter("search", e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        className={`flex items-center gap-2 px-6 py-3 h-auto ${showFilters ? 'bg-muted' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-primary rounded-full ml-1" />
                        )}
                    </Button>
                </div>

                {/* Filter Panel */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-300 ${showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Superficie</label>
                        <div className="relative">
                            <select
                                value={filtroSuperficie}
                                onChange={(e) => updateFilter("superficie", e.target.value)}
                                className="flex h-10 w-full appearance-none rounded-lg bg-input px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Todas</option>
                                <option value="sintetico">Sintético</option>
                                <option value="cesped">Césped</option>
                                <option value="cemento">Cemento</option>
                                <option value="parquet">Parquet</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tamaño</label>
                        <div className="relative">
                            <select
                                value={filtroTamano}
                                onChange={(e) => updateFilter("tamano", e.target.value)}
                                className="flex h-10 w-full appearance-none rounded-lg bg-input px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Todos</option>
                                <option value="5">Fútbol 5</option>
                                <option value="7">Fútbol 7</option>
                                <option value="9">Fútbol 9</option>
                                <option value="11">Fútbol 11</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Iluminación</label>
                        <div className="relative">
                            <select
                                value={filtroIluminacion}
                                onChange={(e) => updateFilter("iluminacion", e.target.value)}
                                className="flex h-10 w-full appearance-none rounded-lg bg-input px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="todas">Todas</option>
                                <option value="si">Con iluminación</option>
                                <option value="no">Sin iluminación</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="col-span-1 sm:col-span-3 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
