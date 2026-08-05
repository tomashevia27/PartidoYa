"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthContext } from "@/components/auth-provider"
import { CanchasService } from "@/services/canchas.service"
import { UsersService } from "@/services/users.service"
import { API_URL } from "@/lib/api-client"
import Swal from 'sweetalert2'
import { getErrorMessage } from "@/lib/api-client"
import { CanchaFormSchema, type CanchaFormValues } from "@/lib/schemas"

export default function EditarCanchaPage() {
  const router = useRouter()
  const params = useParams()
  const canchaId = params.id as string
  const { userId, role } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [fotoActual, setFotoActual] = useState<string | null>(null)
  const [foto, setFoto] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CanchaFormValues>({
    resolver: zodResolver(CanchaFormSchema),
  })

  useEffect(() => {
    async function fetchCancha() {
      try {
        const res = await fetch(`${API_URL}/canchas/${canchaId}`)
        if (res.ok) {
          const data = await res.json()

          // Verify owner
          if (role !== "admin" || String(userId) !== String(data.propietario_id)) {
            router.push(`/canchas/${canchaId}`)
            return
          }

          const [apertura_h, apertura_m] = data.hora_apertura.split(":")
          const [cierre_h, cierre_m] = data.hora_cierre.split(":")

          reset({
            nombre: data.nombre,
            tipo_superficie: data.tipo_superficie,
            tamano: data.tamano,
            iluminacion: data.iluminacion,
            zona: data.zona,
            direccion: data.direccion,
            precio_por_turno: data.precio_por_turno,
            dias_operativos: data.dias_operativos,
            apertura_h,
            apertura_m,
            cierre_h,
            cierre_m,
          })
          setFotoActual(data.fotos)
        } else {
          router.push("/canchas")
        }
      } catch (error) {
        console.warn("Error fetching cancha:", error)
        router.push("/canchas")
      } finally {
        setIsFetching(false)
      }
    }
    if (canchaId && userId) {
      fetchCancha()
    }
  }, [canchaId, userId, role, router])

  async function onSubmit(data: CanchaFormValues) {
    setIsLoading(true)

    try {
      let fotoUrl = fotoActual

      if (foto) {
        try {
          fotoUrl = await UsersService.uploadImage(foto)
        } catch {
          Swal.fire({
            title: "Error de imagen",
            text: "Hubo un problema al subir la foto de la cancha. Por favor, intentá de nuevo.",
            icon: "error",
            confirmButtonColor: "#FF6B4A",
          })
          setIsLoading(false)
          return
        }
      }

      const hora_apertura = `${data.apertura_h.padStart(2, '0')}:${data.apertura_m}`
      const hora_cierre = `${data.cierre_h.padStart(2, '0')}:${data.cierre_m}`

      await CanchasService.update(canchaId, {
        nombre: data.nombre,
        tipo_superficie: data.tipo_superficie,
        tamano: data.tamano,
        iluminacion: data.iluminacion,
        zona: data.zona,
        direccion: data.direccion,
        precio_por_turno: data.precio_por_turno,
        dias_operativos: data.dias_operativos,
        hora_apertura,
        hora_cierre,
        fotos: fotoUrl || undefined,
      })

      await Swal.fire({
        title: "¡Actualizada!",
        text: "La información de la cancha ha sido modificada con éxito.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })

      router.push(`/canchas/${canchaId}`)
    } catch (error) {
      Swal.fire({
        title: "No se pudo actualizar",
        text: error instanceof Error ? getErrorMessage(error) : "Error al procesar la solicitud.",
        icon: "error",
        confirmButtonColor: "#FF6B4A",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Volver</span>
      </button>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Editar Cancha
            </h1>
            <p className="text-muted-foreground">Mantené la información de tu cancha al día</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="font-medium text-sm">Nombre de la cancha *</Label>
                <Input id="nombre" {...register("nombre")} className="bg-input border-0 h-11" />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_superficie" className="font-medium text-sm">Tipo de superficie *</Label>
                <Select value={watch("tipo_superficie")} onValueChange={(v) => setValue("tipo_superficie", v, { shouldValidate: true })}>
                  <SelectTrigger className="bg-input border-0 h-11"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sintético">Sintético</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Cemento">Cemento</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo_superficie && <p className="text-red-500 text-sm mt-1">{errors.tipo_superficie.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tamano" className="font-medium text-sm">Tamaño (jugadores) *</Label>
                <Select value={watch("tamano")?.toString() || ""} onValueChange={(v) => setValue("tamano", Number(v), { shouldValidate: true })}>
                  <SelectTrigger className="bg-input border-0 h-11"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Fútbol 5</SelectItem>
                    <SelectItem value="7">Fútbol 7</SelectItem>
                    <SelectItem value="9">Fútbol 9</SelectItem>
                    <SelectItem value="11">Fútbol 11</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tamano && <p className="text-red-500 text-sm mt-1">{errors.tamano.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_por_turno" className="font-medium text-sm">Precio por turno ($) *</Label>
                <Input id="precio_por_turno" type="number" step="100" {...register("precio_por_turno")} className="bg-input border-0 h-11" />
                {errors.precio_por_turno && <p className="text-red-500 text-sm mt-1">{errors.precio_por_turno.message}</p>}
              </div>
              <div className="flex items-center justify-center space-x-2 pt-6">
                <Switch
                  id="iluminacion"
                  checked={watch("iluminacion")}
                  onCheckedChange={(checked) => setValue("iluminacion", checked, { shouldValidate: true })}
                />
                <Label htmlFor="iluminacion" className="font-medium text-sm">Tiene iluminación</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zona" className="font-medium text-sm">Zona/Barrio *</Label>
                <Input id="zona" {...register("zona")} className="bg-input border-0 h-11" />
                {errors.zona && <p className="text-red-500 text-sm mt-1">{errors.zona.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion" className="font-medium text-sm">Dirección exacta *</Label>
                <Input id="direccion" {...register("direccion")} className="bg-input border-0 h-11" />
                {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm">Días operativos *</Label>
                <div className="flex gap-2">
                  <button type="button" className="px-3 py-1.5 text-[13px] rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all" onClick={() => setValue("dias_operativos", 31, { shouldValidate: true })}>Lun – Vie</button>
                  <button type="button" className="px-3 py-1.5 text-[13px] rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all" onClick={() => setValue("dias_operativos", 96, { shouldValidate: true })}>Fin de semana</button>
                  <button type="button" className="px-3 py-1.5 text-[13px] rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all" onClick={() => setValue("dias_operativos", 127, { shouldValidate: true })}>Todos los días</button>
                  <button type="button" className="px-3 py-1.5 text-[13px] rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all" onClick={() => setValue("dias_operativos", 0, { shouldValidate: true })}>Limpiar</button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { abbr: 'Lun', full: 'Lunes', bit: 0 },
                  { abbr: 'Mar', full: 'Martes', bit: 1 },
                  { abbr: 'Mié', full: 'Miércoles', bit: 2 },
                  { abbr: 'Jue', full: 'Jueves', bit: 3 },
                  { abbr: 'Vie', full: 'Viernes', bit: 4 },
                  { abbr: 'Sáb', full: 'Sábado', bit: 5 },
                  { abbr: 'Dom', full: 'Domingo', bit: 6 },
                ].map(d => {
                  const dias_operativos = watch("dias_operativos") || 0;
                  const active = (dias_operativos >> d.bit) & 1;
                  return (
                    <button
                      key={d.bit}
                      type="button"
                      onClick={() => setValue("dias_operativos", dias_operativos ^ (1 << d.bit), { shouldValidate: true })}
                      className={`w-[72px] h-[72px] rounded-xl border flex flex-col items-center justify-center gap-[2px] transition-all select-none ${active ? 'bg-primary/10 border-primary border-[1.5px]' : 'bg-background border-border hover:bg-secondary hover:border-primary/50'}`}
                    >
                      <span className={`text-[13px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{d.abbr}</span>
                      <span className={`text-[11px] ${active ? 'text-primary/80' : 'text-muted-foreground'}`}>{d.full}</span>
                    </button>
                  )
                })}
              </div>
              {errors.dias_operativos && <p className="text-red-500 text-sm mt-1">{errors.dias_operativos.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Apertura (24hs) *</Label>
                <div className="flex items-center space-x-2">
                  <Input type="number" placeholder="HH" {...register("apertura_h")} className="bg-input border-0 text-center h-11 w-[80px]" />
                  <span className="font-bold text-muted-foreground">:</span>
                  <select {...register("apertura_m")} className="flex h-11 w-[80px] rounded-lg bg-input px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="" disabled>MM</option>
                    <option value="00">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
                {(errors.apertura_h || errors.apertura_m) && <p className="text-red-500 text-sm mt-1">{errors.apertura_h?.message || errors.apertura_m?.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Cierre (24hs) *</Label>
                <div className="flex items-center space-x-2">
                  <Input type="number" placeholder="HH" {...register("cierre_h")} className="bg-input border-0 text-center h-11 w-[80px]" />
                  <span className="font-bold text-muted-foreground">:</span>
                  <select {...register("cierre_m")} className="flex h-11 w-[80px] rounded-lg bg-input px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="" disabled>MM</option>
                    <option value="00">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
                {(errors.cierre_h || errors.cierre_m) && <p className="text-red-500 text-sm mt-1">{errors.cierre_h?.message || errors.cierre_m?.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fotos" className="font-medium text-sm">Foto de la Cancha (Opcional)</Label>
              {fotoActual && (
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">Ya hay una foto guardada. Subí una nueva si querés reemplazarla.</span>
                </div>
              )}
              <Input
                id="fotos"
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] || null)}
                className="bg-input border-0"
              />
            </div>

            <Button type="submit" className="w-full font-semibold h-11" disabled={isLoading}>
              {isLoading ? "Guardando cambios..." : "Guardar Cambios"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
