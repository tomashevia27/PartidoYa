"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Trophy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FixtureTab } from "@/components/torneos/FixtureTab"
import { EstadisticasTab } from "@/components/torneos/EstadisticasTab"
import { TablaTab } from "@/components/torneos/TablaTab"
import Swal from "sweetalert2"
import { getErrorMessage } from "@/lib/api-client"

import { useTorneo, useTorneoFixture, useTorneoMutations } from "@/hooks/use-torneos-query"
import { TorneoHeroCelebration } from "@/components/torneos/TorneoHeroCelebration"
import { TorneoHeader } from "@/components/torneos/TorneoHeader"
import { InformacionTab } from "@/components/torneos/InformacionTab"
import { EquiposTab } from "@/components/torneos/EquiposTab"

export default function TorneoDetallePage() {
    const { id } = useParams()
    const torneoId = Number(id)
    const { role, userId } = useAuthContext()
    const [isCancelling, setIsCancelling] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    const { data: torneo, isLoading, error: torneoError } = useTorneo(torneoId)
    const { data: fixture } = useTorneoFixture(torneoId)
    const { cancelarTorneo, bajarseTorneo } = useTorneoMutations()

    const error = torneoError ? getErrorMessage(torneoError) : ""

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Cargando detalles del torneo...</p>
            </div>
        )
    }

    if (error || !torneo) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-card p-8 rounded-2xl border border-border text-center max-w-md w-full shadow-sm">
                    <Trophy className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Ups, algo salió mal</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Link href="/torneos">
                        <Button>Volver a Torneos</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const campeon = torneo?.resultados_finales?.campeon
    const goleador = torneo?.resultados_finales?.goleador
    const vallaMenosVencida = torneo?.resultados_finales?.valla_invicta

    const jugados = fixture ? fixture.filter((p: any) => p.estado === 'finalizado').length : 0
    const partidosCount = fixture ? { jugados, total: fixture.length } : null

    const cuposRestantes = torneo.max_equipos - torneo.equipos_inscriptos
    const estaAbierto = torneo.estado === "Abierto para inscripción"
    const hayCupos = cuposRestantes > 0

    const isUserEnrolled = torneo.equipos?.some((equipo: any) => {
        if (Array.isArray(equipo.jugadores)) {
            return equipo.jugadores.some((j: any) => j.id === Number(userId))
        }
        try {
            const parsed = JSON.parse(equipo.jugadores)
            if (Array.isArray(parsed)) {
                return parsed.some((j: any) => j.id === Number(userId))
            }
        } catch (e) { }
        return false
    }) || false

    const handleCancelar = async () => {
        const result = await Swal.fire({
            title: "¿Cancelar torneo?",
            text: "Esta acción no se puede deshacer. Se notificará a todos los equipos inscriptos sobre la cancelación.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#EF4444",
            cancelButtonColor: "#6B7280",
            confirmButtonText: "Sí, cancelar torneo",
            cancelButtonText: "No, mantener"
        })

        if (result.isConfirmed) {
            setIsCancelling(true)
            try {
                await cancelarTorneo.mutateAsync(torneo.id)
                await Swal.fire({
                    title: "Torneo cancelado",
                    text: "El torneo fue cancelado y se notificó a los equipos inscriptos.",
                    icon: "success",
                    timer: 2500,
                    showConfirmButton: false
                })
            } catch (err) {
                Swal.fire("Error", getErrorMessage(err) || "No se pudo cancelar el torneo", "error")
            } finally {
                setIsCancelling(false)
            }
        }
    }

    const handleLeave = async () => {
        const result = await Swal.fire({
            title: "¿Darse de baja?",
            text: "Estás por dar de baja a tu equipo de este torneo.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#EF4444",
            cancelButtonColor: "#6B7280",
            confirmButtonText: "Sí, dar de baja",
            cancelButtonText: "Cancelar"
        })

        if (result.isConfirmed) {
            setIsLeaving(true)
            try {
                await bajarseTorneo.mutateAsync(torneo.id)
                await Swal.fire({
                    title: "Inscripción cancelada",
                    text: "Inscripción cancelada con éxito. En las próximas horas la seña será reembolsada.",
                    icon: "success",
                    confirmButtonColor: "#FF6B4A"
                })
            } catch (err) {
                Swal.fire("Error", getErrorMessage(err) || "No se pudo dar de baja al equipo", "error")
            } finally {
                setIsLeaving(false)
            }
        }
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {torneo.estado === "Finalizado" && campeon && (
                <TorneoHeroCelebration 
                    campeon={campeon} 
                    goleador={goleador} 
                    vallaMenosVencida={vallaMenosVencida} 
                />
            )}

            <TorneoHeader 
                torneo={torneo}
                partidosCount={partidosCount}
                cuposRestantes={cuposRestantes}
                estaAbierto={estaAbierto}
                hayCupos={hayCupos}
                isUserEnrolled={isUserEnrolled}
                role={role}
                isLeaving={isLeaving}
                onLeave={handleLeave}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <Tabs defaultValue="informacion" className="w-full">
                    <TabsList className={`grid w-full mb-8 ${torneo.formato === 'eliminacion_directa' || torneo.formato === 'Eliminación directa' ? 'grid-cols-4' : 'grid-cols-5'}`}>
                        <TabsTrigger value="informacion">Información</TabsTrigger>
                        <TabsTrigger value="equipos">Equipos</TabsTrigger>
                        <TabsTrigger value="fixture">Fixture</TabsTrigger>
                        {torneo.formato !== 'eliminacion_directa' && torneo.formato !== 'Eliminación directa' && <TabsTrigger value="tabla">Tabla</TabsTrigger>}
                        <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="informacion">
                        <InformacionTab 
                            torneo={torneo}
                            userId={userId}
                            isCancelling={isCancelling}
                            onCancel={handleCancelar}
                        />
                    </TabsContent>

                    <TabsContent value="equipos">
                        <EquiposTab 
                            torneo={torneo}
                            role={role}
                            estaAbierto={estaAbierto}
                            hayCupos={hayCupos}
                        />
                    </TabsContent>

                    <TabsContent value="fixture">
                        <FixtureTab torneo={torneo} isOrganizer={userId ? torneo.organizador_id === Number(userId) : false} />
                    </TabsContent>

                    {torneo.formato !== 'eliminacion_directa' && torneo.formato !== 'Eliminación directa' && (
                        <TabsContent value="tabla">
                            <TablaTab torneo={torneo} />
                        </TabsContent>
                    )}

                    <TabsContent value="estadisticas">
                        <EstadisticasTab torneo={torneo} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}