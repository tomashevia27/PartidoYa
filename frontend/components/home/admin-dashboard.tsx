"use client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, BarChart3, Trophy, Star, MapPin, Plus, ChevronLeft, ChevronRight, Zap, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroSection, FootballIcon } from "@/components/home/hero-section"
import { useProfile } from "@/hooks/use-profile-query"
import { useCanchas } from "@/hooks/use-canchas-query"
import { useTorneos, useMisTorneos } from "@/hooks/use-torneos-query"
import { type TorneoData } from "@/services/torneos.service"

export function useAdminDashboard() {
  const { data: userProfile = null } = useProfile()
  const { data: canchas = [], isLoading: isLoadingCanchas } = useCanchas("admin")
  const { data: torneosDispData = [], isLoading: isLoadingDisp } = useTorneos(true)
  const { data: misTorneosData = [], isLoading: isLoadingMis } = useMisTorneos()

  const torneosOrganizados = misTorneosData.filter((t: TorneoData) => t.rol_usuario === "Organizador")
  const torneosOrganizadosIds = new Set(torneosOrganizados.map((t: TorneoData) => t.id))
  const torneos = torneosDispData.filter((t: TorneoData) => !torneosOrganizadosIds.has(t.id))
  
  const isLoading = isLoadingCanchas || isLoadingDisp || isLoadingMis

  return { canchas, adminTorneos: torneosOrganizados, torneos, userProfile, isLoading }
}

export function AdminDashboard() {
  const router = useRouter()
  const { canchas, adminTorneos, torneos, userProfile, isLoading } = useAdminDashboard()
  const canchasScrollRef = useRef<HTMLDivElement>(null)

  const scrollCanchas = (direction: 'left' | 'right') => {
    if (canchasScrollRef.current) {
      const scrollAmount = 350;
      canchasScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(precio)
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <HeroSection 
        nombre={userProfile?.nombre} 
        subtitle="Bienvenido al panel de administración de tu complejo" 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Link href="/agenda" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Ver Agenda</h3>
              <p className="text-sm text-muted-foreground">Gestioná tus turnos y reservas</p>
            </div>
          </Link>

          <Link href="/estadisticas" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Estadísticas</h3>
              <p className="text-sm text-muted-foreground">Métricas e ingresos de tu complejo</p>
            </div>
          </Link>

          <Link href="/torneos" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-secondary text-secondary-foreground rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Ver Torneos</h3>
              <p className="text-sm text-muted-foreground">Explorá torneos activos</p>
            </div>
          </Link>

          <Link href="/torneos/nuevo" className="group">
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Crear Torneo</h3>
              <p className="text-sm text-muted-foreground">Organizá una nueva competencia</p>
            </div>
          </Link>
        </div>

        {/* Mis Canchas Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Mis Canchas
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gestioná los espacios de tu complejo
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary">
              <Link href="/canchas/nueva">
                <Plus className="w-4 h-4 mr-1" /> Crear Nueva
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : canchas.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                Todavía no tenés canchas creadas.
              </p>
            </div>
          ) : (
            <div className="relative group/slider">
              {canchas.length > 3 && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 rounded-full w-10 h-10 shadow-md bg-background/90 backdrop-blur-sm border-border hover:bg-background opacity-0 group-hover/slider:opacity-100 transition-opacity hidden md:flex"
                    onClick={() => scrollCanchas('left')}
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 rounded-full w-10 h-10 shadow-md bg-background/90 backdrop-blur-sm border-border hover:bg-background opacity-0 group-hover/slider:opacity-100 transition-opacity hidden md:flex"
                    onClick={() => scrollCanchas('right')}
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </Button>
                </>
              )}
              
              <div 
                ref={canchasScrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {canchas.map((cancha, index) => (
                  <Link key={cancha.id} href={`/canchas/${cancha.id}`} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start">
                    <div
                      className="bg-card rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group h-full overflow-hidden hover:-translate-y-1 animate-slide-up flex flex-col"
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
                            e.preventDefault()
                            router.push(`/canchas/${cancha.id}/editar`)
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Torneos Destacados */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Torneos Destacados
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Compite con otros complejos y equipos
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
          
          {/* Mis Torneos */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Mis Torneos
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Torneos que organizás
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary">
                <Link href="/torneos">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : adminTorneos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-4">No organizás ningún torneo.</p>
                <Button variant="outline" asChild size="sm">
                  <Link href="/torneos/nuevo">Crear Torneo</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/40">
                {adminTorneos.map(torneo => (
                  <Link key={torneo.id} href={`/torneos/${torneo.id}`} className="block group">
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">{new Date(torneo.fecha_inicio).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-lg font-bold text-foreground leading-none mt-0.5">{torneo.fecha_inicio.substring(8, 10)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {torneo.nombre}
                          </h4>
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                            {torneo.estado}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
