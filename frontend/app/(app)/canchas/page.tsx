"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { useCanchas } from "@/hooks/use-canchas-query"

import { CanchasHero } from "@/components/canchas/CanchasHero"
import { CanchasFiltros } from "@/components/canchas/CanchasFiltros"
import { CanchasList } from "@/components/canchas/CanchasList"
import { FootballIcon } from "@/components/canchas/FootballIcon"

export default function CanchasPage() {
    const { role } = useAuthContext()
    const searchParams = useSearchParams()
    
    // Server State
    const { data: canchas = [], isLoading } = useCanchas(role)

    // URL State
    const searchTerm = searchParams.get("search") || ""
    const filtroSuperficie = searchParams.get("superficie") || ""
    const filtroTamano = searchParams.get("tamano") || ""
    const filtroIluminacion = searchParams.get("iluminacion") || "todas"

    // Helper functions
    const normalizeString = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""

    // Memoized computation of filtered canchas
    const filteredCanchas = useMemo(() => {
        return canchas.filter(cancha => {
            const matchesSearch = normalizeString(cancha.nombre).includes(normalizeString(searchTerm)) ||
                                  normalizeString(cancha.zona).includes(normalizeString(searchTerm))
            
            const matchesSuperficie = filtroSuperficie ? normalizeString(cancha.tipo_superficie) === normalizeString(filtroSuperficie) : true
            const matchesTamano = filtroTamano ? cancha.tamano.toString() === filtroTamano : true
            const matchesIluminacion = filtroIluminacion === "si" ? cancha.iluminacion : (filtroIluminacion === "no" ? !cancha.iluminacion : true)

            return matchesSearch && matchesSuperficie && matchesTamano && matchesIluminacion
        })
    }, [canchas, searchTerm, filtroSuperficie, filtroTamano, filtroIluminacion])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <FootballIcon className="w-16 h-16 text-primary animate-bounce" />
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        </div>
                        <p className="text-muted-foreground animate-pulse">Cargando canchas...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <CanchasHero role={role!} canchasCount={canchas.length} />
            <CanchasFiltros />
            <CanchasList canchas={filteredCanchas} role={role!} searchTerm={searchTerm} />
        </div>
    )
}