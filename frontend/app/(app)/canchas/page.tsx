"use client"

import { useMemo, Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"
import { useCanchas } from "@/hooks/use-canchas-query"

import { CanchasHero } from "@/components/canchas/CanchasHero"
import { CanchasFiltros } from "@/components/canchas/CanchasFiltros"
import { CanchasList } from "@/components/canchas/CanchasList"
import { FootballIcon } from "@/components/canchas/FootballIcon"

function CanchasContent() {
    const { role } = useAuthContext()
    const searchParams = useSearchParams()
    
    // Server State
    const { data: canchas = [], isLoading } = useCanchas(role)

    // Local State (Inicializado desde la URL para Deep Linking)
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
    const [filtroSuperficie, setFiltroSuperficie] = useState(searchParams.get("superficie") || "")
    const [filtroTamano, setFiltroTamano] = useState(searchParams.get("tamano") || "")
    const [filtroIluminacion, setFiltroIluminacion] = useState(searchParams.get("iluminacion") || "todas")

    // Sincronización transparente hacia la URL (Evita el bug del Router Cache de Next.js)
    useEffect(() => {
        const params = new URLSearchParams()
        
        if (searchTerm) params.set("search", searchTerm)
        if (filtroSuperficie) params.set("superficie", filtroSuperficie)
        if (filtroTamano) params.set("tamano", filtroTamano)
        if (filtroIluminacion && filtroIluminacion !== "todas") params.set("iluminacion", filtroIluminacion)
        
        const queryString = params.toString()
        const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
        
        window.history.replaceState(null, '', newUrl)
    }, [searchTerm, filtroSuperficie, filtroTamano, filtroIluminacion])

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
            <CanchasFiltros 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filtroSuperficie={filtroSuperficie}
                setFiltroSuperficie={setFiltroSuperficie}
                filtroTamano={filtroTamano}
                setFiltroTamano={setFiltroTamano}
                filtroIluminacion={filtroIluminacion}
                setFiltroIluminacion={setFiltroIluminacion}
            />
            <CanchasList canchas={filteredCanchas} role={role!} searchTerm={searchTerm} />
        </div>
    )
}

export default function CanchasPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Cargando canchas...</p>
            </div>
        }>
            <CanchasContent />
        </Suspense>
    )
}