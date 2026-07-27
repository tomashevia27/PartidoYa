"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Calendar, Trophy, Star, MapPin, Plus, ChevronRight, Clock, Users, Frown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/home/hero-section"
import {
  getPartidosDisponibles,
  getUserProfile,
  getFiltrosDisponibles,
  getTorneosDisponibles,
  getMisTorneos,
  type PartidoData,
  type UserProfile,
  type PartidoDisponibleFilters,
  type FiltrosDisponiblesData,
  type TorneoData
} from "@/hooks/use-api"

export function usePlayerDashboard() {
  const [partidos, setPartidos] = useState<PartidoData[]>([])
  const [torneos, setTorneos] = useState<TorneoData[]>([])
  const [misTorneos, setMisTorneos] = useState<TorneoData[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userZona, setUserZona] = useState<string>("")
  const [isUsingUserZone, setIsUsingUserZone] = useState(true)

  const [filtroZona, setFiltroZona] = useState<string>("")
  const [filtroModalidad, setFiltroModalidad] = useState<string>("")
  const [filtroFecha, setFiltroFecha] = useState<string>("")
  const [filtrosOpciones, setFiltrosOpciones] = useState<FiltrosDisponiblesData | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile()
        setUserProfile(profile)
        if (profile.zona) {
          setUserZona(profile.zona)
          setFiltroZona(profile.zona)
        }
      } catch (e) {
        console.warn("Error al cargar perfil:", e)
      }
    }
    async function loadFiltros() {
      try {
        const opciones = await getFiltrosDisponibles()
        setFiltrosOpciones(opciones)
      } catch (e) {
        console.warn("Error al cargar filtros dinámicos:", e)
      }
    }
    async function fetchTorneos() {
      try {
        const [dataDisp, dataMis] = await Promise.all([
          getTorneosDisponibles(),
          getMisTorneos()
        ])
        setTorneos(dataDisp)
        setMisTorneos(dataMis)
      } catch (e) {
        console.warn("Error al cargar torneos:", e)
      }
    }
    loadProfile()
    loadFiltros()
    fetchTorneos()
  }, [])

  const fetchPartidos = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: PartidoDisponibleFilters = {}
      if (filtroZona) filters.zona = filtroZona
      if (filtroModalidad) filters.modalidad = filtroModalidad
      if (filtroFecha) filters.fecha = filtroFecha

      const data = await getPartidosDisponibles(filters)
      setPartidos(data)
    } catch (err: any) {
      console.warn("Error al cargar partidos:", err)
      setPartidos([])
    } finally {
      setIsLoading(false)
    }
  }, [filtroZona, filtroModalidad, filtroFecha])

  useEffect(() => {
    if (userZona || !isUsingUserZone) {
      fetchPartidos()
    }
  }, [fetchPartidos, userZona, isUsingUserZone])

  useEffect(() => {
    if (filtroZona !== userZona) {
      setIsUsingUserZone(false)
    }
  }, [filtroZona, userZona])

  const clearFilters = () => {
    setFiltroZona(userZona)
    setFiltroModalidad("")
    setFiltroFecha("")
    setIsUsingUserZone(true)
  }

  const hasActiveFilters = filtroZona !== userZona || filtroModalidad || filtroFecha

  return {
    partidos,
    torneos,
    misTorneos,
    userProfile,
    userZona,
    isLoading,
    filtroZona, setFiltroZona,
    filtroModalidad, setFiltroModalidad,
    filtroFecha, setFiltroFecha,
    filtrosOpciones,
    hasActiveFilters,
    clearFilters
  }
}

export function PlayerDashboard() {
  const {
    partidos,
    torneos,
    userProfile,
    userZona,
    isLoading,
  } = usePlayerDashboard()

  const formatearFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split("-")
    return `${day}/${month}/${year}`
  }

  const formatearFechaRelativa = (fechaStr: string) => {
    const fecha = new Date(fechaStr + "T00:00:00")
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)
    const pasadoManana = new Date(hoy)
    pasadoManana.setDate(pasadoManana.getDate() + 2)

    if (fecha.getTime() === hoy.getTime()) return "Hoy"
    if (fecha.getTime() === manana.getTime()) return "Mañana"
    if (fecha.getTime() === pasadoManana.getTime()) return "Pasado mañana"

    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return dias[fecha.getDay()] + " " + formatearFecha(fechaStr)
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <HeroSection 
        nombre={userProfile?.nombre} 
        subtitle="¿Qué tenés ganas de jugar hoy?" 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Link href="/partidos/nuevo" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Crear Partido</h3>
              <p className="text-sm text-muted-foreground">Reservá una cancha y armá tu partido</p>
            </div>
          </Link>

          <Link href="/partidos/disponibles" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Unirse a Partido</h3>
              <p className="text-sm text-muted-foreground">Buscá partidos abiertos y sumate</p>
            </div>
          </Link>

          <Link href="/torneos" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-secondary text-secondary-foreground rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Ver Torneos</h3>
              <p className="text-sm text-muted-foreground">Explorá competencias y anotá a tu equipo</p>
            </div>
          </Link>

          <Link href="/torneos/nuevo" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Crear Torneo</h3>
              <p className="text-sm text-muted-foreground">Organizá tu propio torneo</p>
            </div>
          </Link>
        </div>

        {/* Recommended Content */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Partidos Cercanos */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Partidos Disponibles
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {userZona ? `Cerca de ${userZona}` : "Partidos abiertos próximamente"}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary">
                <Link href="/partidos/disponibles">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : partidos.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Frown className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No hay partidos abiertos.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/partidos/nuevo">¡Creá uno ahora!</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/40">
                {partidos.map(partido => (
                  <Link key={partido.id} href={`/partidos/${partido.id}`} className="block group">
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                      <div className="w-14 h-14 bg-secondary rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">{formatearFechaRelativa(partido.fecha).split(' ')[0]}</span>
                        <span className="text-lg font-bold text-foreground leading-none mt-0.5">{partido.fecha.split('-')[2]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {partido.cancha?.nombre || "Cancha TBD"}
                          </h4>
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">
                            {partido.modalidad}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {partido.horario.substring(0, 5)}</span>
                          <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" /> {partido.cancha?.zona || "N/A"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary block">{partido.cupos_disponibles}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lugares</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Torneos */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Torneos Destacados
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Compite con tu equipo por la gloria
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary">
                <Link href="/torneos">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : torneos.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay torneos disponibles.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/40">
                {torneos.map(torneo => (
                  <Link key={torneo.id} href={`/torneos/${torneo.id}`} className="block group">
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-7 h-7 text-primary opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {torneo.nombre}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {torneo.fecha_inicio.substring(8, 10)}/{torneo.fecha_inicio.substring(5, 7)}</span>
                          <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" /> {torneo.lugar.split(' - ')[0]}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground block">{torneo.equipos_inscriptos}/{torneo.max_equipos}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Equipos</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
