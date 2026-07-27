"use client"

import { useEffect, useState } from "react"
import { Calendar as CalendarIcon, MapPin, Clock, Users, Lock, Unlock, Ban, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { useAuthContext } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { ManualReservationDialog } from "@/components/manual-reservation-dialog"
import { RescheduleReservationDialog } from "@/components/reschedule-reservation-dialog"
import { useAgenda } from "@/hooks/use-agenda"

export default function AgendaPage() {
  const { role } = useAuthContext()
  const router = useRouter()

  const {
    canchas,
    canchaSeleccionada,
    setCanchaSeleccionada,
    canchaActual,
    fecha,
    setFecha,
    dates,
    hoy,
    agenda,
    isLoading,
    isLoadingAgenda,
    dialogOpen,
    setDialogOpen,
    slotSeleccionado,
    reprogramarDialogOpen,
    setReprogramarDialogOpen,
    slotReprogramar,
    handleSlotClick,
    handleBloquear,
    handleDesbloquear,
    handleCancelarReserva,
    handleReprogramar,
    recargarAgenda,
    handleReservaExitosa
  } = useAgenda()

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    if (role !== "admin") {
      router.push("/home")
    }
  }, [role, router])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Mi Agenda
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestioná los turnos de tus canchas y cargá reservas manuales
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Cancha
            </label>
            <div className="flex flex-wrap gap-2">
              {canchas.map((c) => {
                const isSelected = canchaSeleccionada === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCanchaSeleccionada(c.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02]"
                    }`}
                  >
                    {c.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground -ml-1">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(fecha + "T12:00:00")}
                    onSelect={(date) => {
                      if (date) {
                        setFecha(date.toISOString().split("T")[0])
                        setIsCalendarOpen(false)
                      }
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fecha
              </label>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
              {dates.map((d) => {
                const isSelected = fecha === d.toISOString().split("T")[0]
                const isToday = isSameDay(d, hoy)
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setFecha(d.toISOString().split("T")[0])}
                    className={`flex flex-col items-center justify-center min-w-[5rem] h-[5rem] rounded-2xl transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02]"
                    }`}
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wider opacity-90">
                      {format(d, "EEE", { locale: es })}
                    </span>
                    <span className="text-xl font-bold mt-0.5">{format(d, "d")}</span>
                    <span className="text-[10px] font-medium uppercase opacity-75 mt-0.5">
                      {isToday ? "Hoy" : format(d, "MMM", { locale: es })}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {canchaActual && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {canchaActual.zona} - {canchaActual.direccion}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {canchaActual.hora_apertura} a {canchaActual.hora_cierre} hs
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Fútbol {canchaActual.tamano}
            </div>
          </div>
        )}
      </div>

      {isLoadingAgenda ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <div className="flex gap-2 ml-auto">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : agenda && agenda.slots.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Turnos del{" "}
              {new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              {agenda.slots.filter((s) => s.estado === "disponible").length} disponibles
              {" · "}
              {agenda.slots.filter((s) => s.estado === "ocupado").length} ocupados
              {" · "}
              {agenda.slots.filter((s) => s.estado === "bloqueado").length} bloqueados
            </span>
          </div>

          <div className="divide-y divide-border">
            {agenda.slots.map((slot) => (
              <div
                key={slot.horario}
                className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30 group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 transition-transform group-hover:translate-x-1">
                  <div className="flex items-center gap-2 min-w-[100px] shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {slot.horario} hs
                    </span>
                  </div>

                  {slot.estado === "disponible" && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Disponible
                      </span>
                      <div className="flex gap-1.5 ml-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSlotClick(slot)}
                          className="text-xs h-8"
                        >
                          Reservar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBloquear(slot)}
                          className="text-xs h-8 text-muted-foreground"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Bloquear
                        </Button>
                      </div>
                    </>
                  )}

                  {slot.estado === "ocupado" && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Ocupado
                      </span>
                      <span className="text-sm text-foreground truncate">
                        {slot.es_reserva_manual
                          ? ((slot.cliente_nombre || "") + (slot.cliente_apellido ? " " + slot.cliente_apellido : "")).trim() || "Sin nombre"
                          : ((slot.organizador_nombre || "") + (slot.organizador_apellido ? " " + slot.organizador_apellido : "")).trim() || "Sin nombre"
                        }
                      </span>
                      {slot.es_reserva_manual && slot.cliente_telefono && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          Tel: {slot.cliente_telefono}
                        </span>
                      )}
                      {slot.es_reserva_manual ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 shrink-0">
                          Reserva manual
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                          Reserva de jugador
                        </span>
                      )}
                      <div className="flex gap-1.5 ml-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReprogramar(slot)}
                          className="text-xs h-8"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reprogramar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelarReserva(slot)}
                          className="text-xs h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </>
                  )}

                  {slot.estado === "bloqueado" && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600 shrink-0">
                        <Ban className="h-3 w-3" />
                        Bloqueado
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDesbloquear(slot)}
                        className="text-xs h-8 ml-auto shrink-0"
                      >
                        <Unlock className="h-3 w-3 mr-1" />
                        Desbloquear
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : agenda && agenda.slots.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">
            No hay turnos disponibles para esta cancha en la fecha seleccionada.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Revisá los días y horarios operativos de la cancha.
          </p>
        </div>
      ) : null}

      {slotSeleccionado && (
        <ManualReservationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          canchaId={Number(canchaSeleccionada)}
          canchaNombre={canchaActual?.nombre || ""}
          fecha={fecha}
          horario={slotSeleccionado.horario}
          onSuccess={handleReservaExitosa}
        />
      )}

      {slotReprogramar && slotReprogramar.partido_id && (
        <RescheduleReservationDialog
          open={reprogramarDialogOpen}
          onOpenChange={setReprogramarDialogOpen}
          partidoId={slotReprogramar.partido_id}
          canchaId={Number(canchaSeleccionada)}
          canchaNombre={canchaActual?.nombre || ""}
          fechaActual={fecha}
          horarioActual={slotReprogramar.horario}
          onSuccess={recargarAgenda}
        />
      )}
    </div>
  )
}
