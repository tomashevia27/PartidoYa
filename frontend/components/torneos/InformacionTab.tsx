import Link from "next/link"
import { AlignLeft, Info, Shield, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  torneo: any
  userId: string | null | undefined
  isCancelling: boolean
  onCancel: () => void
}

export function InformacionTab({ torneo, userId, isCancelling, onCancel }: Props) {
  const estaAbierto = torneo.estado === "Abierto para inscripción"

  return (
    <div className="space-y-8">
        {/* Descripción */}
        <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <AlignLeft className="w-5 h-5 text-primary" />
                Detalles del Torneo
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {torneo.descripcion || "No hay descripción disponible para este torneo."}
            </p>
        </section>

        {/* Reglas */}
        <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <Info className="w-5 h-5 text-primary" />
                Reglas Específicas
            </h3>
            <div className="bg-muted/50 p-6 rounded-xl border border-border">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {torneo.reglas || "El torneo se rige bajo las reglas estándar. Consultá con la organización para más información."}
                </p>
            </div>
        </section>

        {/* Acciones de Organizador */}
        {userId && torneo.organizador_id === Number(userId) && torneo.estado !== "Cancelado" && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 mt-6 flex flex-col gap-5">
                <div>
                    <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Administración
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Opciones de gestión del torneo.
                    </p>
                </div>

                {estaAbierto && (
                    <Link href={`/torneos/${torneo.id}/editar`} className="block w-full">
                        <Button variant="outline" className="w-full">
                            Editar Configuración
                        </Button>
                    </Link>
                )}

                <div className="pt-4 border-t border-border">
                    <h4 className="font-bold text-destructive mb-1.5 flex items-center gap-1.5 text-sm">
                        <XCircle className="w-4 h-4" />
                        Zona de peligro
                    </h4>
                    <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">
                        Al cancelar el torneo, se cerrarán las inscripciones y se notificará a los equipos.
                    </p>
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={onCancel}
                        disabled={isCancelling}
                    >
                        {isCancelling ? "Cancelando..." : "Cancelar Torneo"}
                    </Button>
                </div>
            </div>
        )}
    </div>
  )
}
