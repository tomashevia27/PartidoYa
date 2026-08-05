"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Info, ArrowLeft, Clock, DollarSign, Zap } from "lucide-react"
import Swal from "sweetalert2"
import { API_URL } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/api-client"
import { useCancha, useCanchas } from "@/hooks/use-canchas-query"
import { useTurnosQuery } from "@/hooks/use-reservas-query"
import { usePartidosMutations } from "@/hooks/use-partidos-query"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PartidoFormSchema, type PartidoFormValues } from "@/lib/schemas"

function NuevoPartidoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canchaIdParam = searchParams.get("canchaId")

  const [cancha, setCancha] = useState<any>(null)
  const [todasCanchas, setTodasCanchas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PartidoFormValues>({
    resolver: zodResolver(PartidoFormSchema),
    defaultValues: {
      cancha_id: canchaIdParam ? Number(canchaIdParam) : undefined,
      fecha: "",
      horario: "",
      tipo: "abierto",
      cupos_disponibles: undefined,
      max_cupos: undefined,
      descripcion: "",
    }
  })

  const watchCanchaId = watch("cancha_id")
  const watchFecha = watch("fecha")
  const watchTipo = watch("tipo")

  const [turnosDisponibles, setTurnosDisponibles] = useState<{ inicio: string; fin: string; estado: string }[]>([])

  const { data: fetchedCancha = null, isLoading: isLoadingCancha, isError: isErrorCancha } = useCancha(canchaIdParam ? Number(canchaIdParam) : Number(watchCanchaId))
  const { data: todasCanchasData = [] } = useCanchas(canchaIdParam ? null : "jugador")

  useEffect(() => {
    if (isErrorCancha) {
      Swal.fire("Error", "Cancha no encontrada", "error").then(() => router.push("/home"))
    }
  }, [isErrorCancha, router])

  useEffect(() => {
    if (fetchedCancha) {
      setCancha(fetchedCancha)
      setValue("max_cupos", (fetchedCancha.tamano * 2) - 1)
    } else {
      setCancha(null)
    }
  }, [fetchedCancha, setValue])

  useEffect(() => {
    if (!canchaIdParam && todasCanchasData.length > 0) {
      setTodasCanchas(todasCanchasData)
    }
  }, [todasCanchasData, canchaIdParam])

  const { data: turnosData = null } = useTurnosQuery(cancha?.id as number, watchFecha)

  useEffect(() => {
    if (!cancha) {
      setTurnosDisponibles([])
      setValue("horario", "")
      return
    }

    if (watchFecha && turnosData) {
      const duracion = Number(cancha.duracion_turno) || 60
      const turnos = turnosData.slots.map(s => {
        const [h, m] = s.horario.split(":").map(Number)
        const d = new Date()
        d.setHours(h, m + duracion, 0, 0)
        return { inicio: s.horario, fin: d.toTimeString().slice(0, 5), estado: s.estado }
      })
      setTurnosDisponibles(turnos)
    } else if (!watchFecha) {
      const turnos = []
      const [aperturaH, aperturaM] = cancha.hora_apertura.split(":").map(Number)
      const [cierreH, cierreM] = cancha.hora_cierre.split(":").map(Number)
      const duracion = Number(cancha.duracion_turno) || 60

      let actual = new Date()
      actual.setHours(aperturaH, aperturaM, 0, 0)

      const fin = new Date()
      fin.setHours(cierreH, cierreM, 0, 0)

      while (actual < fin) {
        const inicioStr = actual.toTimeString().slice(0, 5)
        actual.setMinutes(actual.getMinutes() + duracion)
        const finStr = actual.toTimeString().slice(0, 5)

        if (actual <= fin) {
          turnos.push({ inicio: inicioStr, fin: finStr, estado: "disponible" })
        }
      }
      setTurnosDisponibles(turnos)
    }
    setValue("horario", "")
  }, [cancha, watchFecha, turnosData, setValue])

  const { createPartido } = usePartidosMutations()

  const onSubmit = async (data: PartidoFormValues) => {
    try {
      await createPartido.mutateAsync({
        cancha_id: data.cancha_id,
        fecha: data.fecha,
        horario: data.horario,
        tipo: data.tipo,
        descripcion: data.descripcion || undefined,
        cupos_disponibles: data.tipo === "abierto" ? data.cupos_disponibles : undefined,
      })

      await Swal.fire({
        title: "¡Reserva iniciada!",
        text: "Serás redirigido a la pasarela de pago para abonar la seña de la cancha.",
        icon: "success",
        confirmButtonColor: "#FF6B4A",
        confirmButtonText: "Proceder al pago"
      })

      Swal.fire({
        title: "¡Pago exitoso!",
        text: "El partido fue creado y la cancha está reservada.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.push("/profile")
      })

    } catch (error) {
      console.error("Error al crear el partido:", error)
      Swal.fire("Error", getErrorMessage(error) || "Error al crear el partido", "error")
    }
  }

  if (canchaIdParam && isLoadingCancha) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  const modalidad = cancha?.tamano ? `Fútbol ${cancha.tamano}` : "N/A"
  const cantidadJugadores = cancha?.tamano ? cancha.tamano * 2 : "N/A"

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Volver</span>
      </button>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Crear Nuevo Partido</h1>
            <p className="text-muted-foreground">Configurá los detalles de tu encuentro deportivo.</p>
          </div>

          {!canchaIdParam && (
            <div className="space-y-2 mb-6">
              <Label htmlFor="canchaSelect" className="font-medium text-sm">Seleccioná una Cancha *</Label>
              <select
                id="canchaSelect"
                className="flex h-11 w-full rounded-lg bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("cancha_id")}
              >
                <option value="">Elegí una cancha disponible</option>
                {todasCanchas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} - {c.zona}</option>
                ))}
              </select>
              {errors.cancha_id && <p className="text-destructive text-sm mt-1">{errors.cancha_id.message}</p>}
            </div>
          )}

          {cancha && (
            <div className="bg-secondary/30 p-6 rounded-xl mb-6 border border-border/50">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-primary">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                {cancha.nombre}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {cancha.zona} - {cancha.direccion}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {cancha.hora_apertura} a {cancha.hora_cierre} hs ({cancha.duracion_turno || 60} min)
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    Fútbol {cancha.tamano} • Superficie: <span className="capitalize">{cancha.tipo_superficie}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      {cancha.iluminacion ? "Con iluminación" : "Sin iluminación"}
                    </div>
                    <div className="font-bold text-primary flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${cancha.precio_por_turno}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" className="font-medium text-sm">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  {...register("fecha")}
                  className="bg-input border-0 h-11"
                />
                {errors.fecha && <p className="text-destructive text-sm mt-1">{errors.fecha.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario" className="font-medium text-sm">Turno *</Label>
                <select
                  id="horario"
                  className="flex h-11 w-full rounded-lg bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("horario")}
                  disabled={!cancha}
                >
                  <option value="">Seleccioná un turno</option>
                  {turnosDisponibles.map((turno) => (
                    <option key={turno.inicio} value={turno.inicio} disabled={turno.estado !== "disponible"}>
                      De {turno.inicio} a {turno.fin} hs
                    </option>
                  ))}
                </select>
                {errors.horario && <p className="text-destructive text-sm mt-1">{errors.horario.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-medium text-sm">
                  Modalidad
                  <span title="Se calcula según la cancha">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </Label>
                <Input value={modalidad} readOnly className="bg-muted text-muted-foreground h-11" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-medium text-sm">
                  Cantidad Jugadores
                  <span title="Se calcula según la cancha">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </Label>
                <Input value={cantidadJugadores.toString()} readOnly className="bg-muted text-muted-foreground h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo" className="font-medium text-sm">Tipo de Partido *</Label>
              <select
                id="tipo"
                {...register("tipo")}
                className="flex h-11 w-full rounded-lg bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="abierto">Abierto (Cualquiera puede unirse)</option>
                <option value="cerrado">Cerrado (Solo invitados)</option>
              </select>
              {errors.tipo && <p className="text-destructive text-sm mt-1">{errors.tipo.message}</p>}
            </div>

            {watchTipo === "abierto" && (
              <div className="space-y-2">
                <Label htmlFor="cupos" className="font-medium text-sm">Lugares Disponibles (Cupos) *</Label>
                <Input
                  id="cupos"
                  type="number"
                  {...register("cupos_disponibles")}
                  placeholder="Ej: 3 (si te faltan 3 jugadores)"
                  className="bg-input border-0 h-11"
                />
                {errors.cupos_disponibles && <p className="text-destructive text-sm mt-1">{errors.cupos_disponibles.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="font-medium text-sm">Descripción (Opcional)</Label>
              <textarea
                id="descripcion"
                {...register("descripcion")}
                className="flex min-h-[80px] w-full rounded-lg bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Aclaraciones, reglas, o cualquier info extra para los jugadores..."
              />
              {errors.descripcion && <p className="text-destructive text-sm mt-1">{errors.descripcion.message}</p>}
            </div>


            <Button type="submit" className="w-full font-semibold h-11" disabled={isSubmitting || !cancha}>
              {isSubmitting ? "Procesando..." : "Confirmar y Pagar Seña"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NuevoPartidoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <NuevoPartidoForm />
    </Suspense>
  )
}
