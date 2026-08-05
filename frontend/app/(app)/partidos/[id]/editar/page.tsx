"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Info, ArrowLeft, Clock, DollarSign, Zap } from "lucide-react"
import Swal from "sweetalert2"
import { PartidosService, type PartidoData } from "@/services/partidos.service"
import { ReservasService } from "@/services/reservas.service"
import { API_URL } from "@/lib/api-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PartidoFormSchema, type PartidoFormValues } from "@/lib/schemas"

function EditarPartidoForm() {
  const router = useRouter()
  const params = useParams()
  const partidoId = params.id as string

  const [partido, setPartido] = useState<PartidoData | null>(null)
  const [cancha, setCancha] = useState<any>(null)
  const [originalTamano, setOriginalTamano] = useState<number | null>(null)
  const [todasCanchas, setTodasCanchas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartidoFormValues>({
    resolver: zodResolver(PartidoFormSchema),
    defaultValues: {
      cancha_id: undefined,
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
  const watchHorario = watch("horario")

  const [turnosDisponibles, setTurnosDisponibles] = useState<{ inicio: string; fin: string; estado: string }[]>([])

  useEffect(() => {
    async function fetchPartido() {
      try {
        const data = await PartidosService.getById(partidoId)
        setPartido(data)
        
        let maxCupos = undefined;
        let originalTamano = null;

        const resCancha = await fetch(`${API_URL}/canchas/${data.cancha_id}`)
        if (resCancha.ok) {
          const canchaData = await resCancha.json()
          setCancha(canchaData)
          setOriginalTamano(canchaData.tamano)
          originalTamano = canchaData.tamano
          maxCupos = (canchaData.tamano * 2) - 1;
        }

        reset({
          cancha_id: data.cancha_id,
          fecha: data.fecha,
          horario: data.horario.substring(0, 5), // "HH:MM"
          tipo: data.tipo as any,
          cupos_disponibles: data.cupos_disponibles !== undefined && data.cupos_disponibles !== null ? data.cupos_disponibles : undefined,
          descripcion: data.descripcion || "",
          max_cupos: maxCupos
        })

        const resTodasCanchas = await fetch(`${API_URL}/canchas`)
        if (resTodasCanchas.ok) {
          setTodasCanchas(await resTodasCanchas.json())
        }
      } catch (error) {
        Swal.fire("Error", "No se pudo cargar el partido", "error").then(() => router.back())
      } finally {
        setIsLoading(false)
      }
    }
    fetchPartido()
  }, [partidoId, router, reset])

  useEffect(() => {
    if (watchCanchaId && todasCanchas.length > 0) {
      const selected = todasCanchas.find((c: any) => c.id === Number(watchCanchaId))
      if (selected && selected.id !== cancha?.id) {
        setCancha(selected)
        setValue("max_cupos", (selected.tamano * 2) - 1)
      }
    }
  }, [watchCanchaId, todasCanchas, cancha, setValue])

  useEffect(() => {
    if (!cancha) {
      setTurnosDisponibles([])
      return
    }

    if (watchFecha) {
      ReservasService.getTurnos(cancha.id, watchFecha, Number(partidoId))
        .then(data => {
          const duracion = Number(cancha.duracion_turno) || 60
          const turnos = data.slots.map(s => {
            const [h, m] = s.horario.split(":").map(Number)
            const d = new Date()
            d.setHours(h, m + duracion, 0, 0)
            return { inicio: s.horario, fin: d.toTimeString().slice(0, 5), estado: s.estado }
          })
          setTurnosDisponibles(turnos)
        })
        .catch(err => console.warn("Error al cargar turnos:", err))
    } else {
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
  }, [cancha, watchFecha, partidoId])

  const onSubmit = async (data: PartidoFormValues) => {
    try {
      await PartidosService.update(partidoId, {
        cancha_id: data.cancha_id,
        fecha: data.fecha,
        horario: data.horario,
        tipo: data.tipo,
        descripcion: data.descripcion || undefined,
        cupos_disponibles: data.tipo === "abierto" ? data.cupos_disponibles : undefined
      })

      Swal.fire({
        title: "¡Guardado!",
        text: "El partido fue actualizado.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.push(`/partidos/${partidoId}`)
      })
      
    } catch (error) {
      console.error("Error al editar el partido:", error)
      Swal.fire("Error", "Ocurrió un error al guardar el partido.", "error")
    }
  }

  if (isLoading) {
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
        <span className="text-sm font-medium">Volver al detalle</span>
      </button>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Editar Partido</h1>
            <p className="text-muted-foreground">Modificá los detalles de tu encuentro deportivo.</p>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="canchaSelect" className="font-medium text-sm">Cancha *</Label>
            <select
              id="canchaSelect"
              className="flex h-11 w-full rounded-lg bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("cancha_id")}
            >
              <option value="">Elegí una cancha disponible</option>
              {todasCanchas
                .filter(c => originalTamano === null || c.tamano === originalTamano)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} - {c.zona}</option>
                ))}
            </select>
            {errors.cancha_id && <p className="text-destructive text-sm mt-1">{errors.cancha_id.message}</p>}
          </div>
          
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
                      De {turno.inicio} a {turno.fin} hs{turno.estado !== "disponible" ? " (Ocupado)" : ""}
                    </option>
                  ))}
                  {!turnosDisponibles.some(t => t.inicio === watchHorario) && watchHorario && (
                     <option value={watchHorario}>De {watchHorario} hs</option>
                  )}
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
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function EditarPartidoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <EditarPartidoForm />
    </Suspense>
  )
}
