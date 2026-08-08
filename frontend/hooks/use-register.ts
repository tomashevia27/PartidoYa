import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { UsersService } from "@/services/users.service"
import Swal from "sweetalert2"
import { getErrorMessage } from "@/lib/api-client"
import type { RegisterValues } from "@/lib/schemas"

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ data, foto }: { data: RegisterValues; foto: File | null }) => {
      let fotoUrl: string | undefined
      if (foto) {
        try {
          fotoUrl = await UsersService.uploadImage(foto)
        } catch (e) {
          throw new Error("Hubo un problema al subir tu foto de perfil. Por favor, intentá de nuevo.")
        }
      }

      const userData = {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        password: data.password,
        edad: data.edad,
        genero: data.genero,
        zona: data.zona,
        rol: data.rol,
        foto_perfil: fotoUrl,
      }

      await UsersService.register(userData as any)
      return data.email
    },
    onSuccess: (email) => {
      router.push(`/confirm?email=${encodeURIComponent(email)}`)
    },
    onError: (error) => {
      Swal.fire({
        title: "No se pudo registrar",
        text: error instanceof Error && error.message.includes("foto de perfil") 
          ? error.message 
          : getErrorMessage(error),
        icon: "error",
        confirmButtonColor: "#FF6B4A",
      })
    }
  })
}
