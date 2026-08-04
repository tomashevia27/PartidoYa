"use client"
import { getErrorMessage } from "@/lib/api-client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Swal from 'sweetalert2'
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
import {
  getUserProfile,
  updateUserProfile,
  uploadImageToCloudinary,
} from "@/hooks/use-api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProfileEditSchema, type ProfileEditValues } from "@/lib/schemas"


export default function EditProfilePage() {
  const router = useRouter()
  const { userId } = useAuthContext()
  const [isLoading, setIsLoading] = useState(true)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting: isSaving }
  } = useForm<ProfileEditValues>({
    resolver: zodResolver(ProfileEditSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      edad: undefined,
      genero: "Masculino",
      zona: "",
      password: "",
    }
  })

  const watchGenero = watch("genero")
  const [foto, setFoto] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [notifPartidos, setNotifPartidos] = useState(true)
  const [notifMensajes, setNotifMensajes] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return

      try {
        const data = await getUserProfile()
        reset({
          nombre: data.nombre,
          apellido: data.apellido,
          edad: data.edad,
          genero: data.genero,
          zona: data.zona,
          password: "",
        })
        const avatarUrl =
          data.foto_perfil ||
          `https://ui-avatars.com/api/?name=${data.nombre}+${data.apellido}&background=FF6B4A&color=fff&size=200`
        setAvatarPreview(avatarUrl)
      } catch (error) {
        console.warn("Error al cargar el perfil:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [userId])


  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }


  const onSubmit = async (data: ProfileEditValues) => {
    if (!userId) return

    try {
      let fotoUrl: string | undefined

      if (foto) {
        try {
          fotoUrl = await uploadImageToCloudinary(foto)
        } catch {
          Swal.fire({
            title: "Error de imagen",
            text: "Hubo un problema al subir tu foto de perfil. Por favor, intentá de nuevo.",
            icon: "error",
            confirmButtonColor: "#FF6B4A",
          })
          return
        }
      } else if (!avatarPreview.includes("ui-avatars.com")) {
        fotoUrl = avatarPreview
      }

      await updateUserProfile({
        nombre: data.nombre,
        apellido: data.apellido,
        edad: data.edad,
        genero: data.genero,
        zona: data.zona,
        password: data.password?.trim() ? data.password : undefined,
        foto_perfil: fotoUrl,
      })

      await Swal.fire({
        title: "¡Listo!",
        text: "Perfil actualizado correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })
      router.push("/profile")
    } catch (error) {
      Swal.fire({
        title: "No se pudo actualizar",
        text: error instanceof Error ? getErrorMessage(error) : "Error de conexión al actualizar el perfil.",
        icon: "error",
        confirmButtonColor: "#FF6B4A",
      })
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Volver</span>
      </Link>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Configuración del Perfil</h1>
          <p className="text-muted-foreground mb-8">Actualizá tu información personal</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Form Fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="font-medium text-sm">
                      Nombre
                    </Label>
                    <Input
                      id="nombre"
                      {...register("nombre")}
                      className="bg-input border-0 h-11"
                    />
                    {errors.nombre && <p className="text-destructive text-sm mt-1">{errors.nombre.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="font-medium text-sm">
                      Apellido
                    </Label>
                    <Input
                      id="apellido"
                      {...register("apellido")}
                      className="bg-input border-0 h-11"
                    />
                    {errors.apellido && <p className="text-destructive text-sm mt-1">{errors.apellido.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edad" className="font-medium text-sm">
                      Edad
                    </Label>
                    <Input
                      id="edad"
                      type="number"
                      {...register("edad")}
                      className="bg-input border-0 h-11"
                    />
                    {errors.edad && <p className="text-destructive text-sm mt-1">{errors.edad.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genero" className="font-medium text-sm">
                      Género
                    </Label>
                    <Select
                      value={watchGenero || "Masculino"}
                      onValueChange={(value) => setValue("genero", value)}
                    >
                      <SelectTrigger className="bg-input border-0 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zona" className="font-medium text-sm">
                    Zona de juego
                  </Label>
                  <Input
                    id="zona"
                    {...register("zona")}
                    className="bg-input border-0 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium text-sm">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Oculta por seguridad (escribí para cambiar)"
                    {...register("password")}
                    className="bg-input border-0 h-11"
                  />
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Preferencias de Notificación
                  </h3>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notif-partidos" className="cursor-pointer text-sm">
                      Recibir alertas de nuevos partidos en mi zona
                    </Label>
                    <Switch
                      id="notif-partidos"
                      checked={notifPartidos}
                      onCheckedChange={setNotifPartidos}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notif-mensajes" className="cursor-pointer text-sm">
                      Avisarme cuando me inviten a un equipo
                    </Label>
                    <Switch
                      id="notif-mensajes"
                      checked={notifMensajes}
                      onCheckedChange={setNotifMensajes}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="font-semibold px-8 h-11"
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>

              {/* Avatar Section */}
              <div className="text-center md:border-l md:pl-8 md:w-44 flex-shrink-0">
                <h3 className="font-semibold text-foreground text-sm mb-4">Foto de Perfil</h3>
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 mx-auto mb-4"
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
