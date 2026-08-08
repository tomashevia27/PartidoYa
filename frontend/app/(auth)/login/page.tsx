"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/components/auth-provider"
import { AuthService } from "@/services/auth.service"
import { Loader2, Mail, Lock, Trophy } from "lucide-react"

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { getErrorMessage } from "@/lib/api-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginSchema, type LoginValues } from "@/lib/schemas"

function CheckSessionExpired() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams?.get("expired") === "true") {
      Swal.fire({
        title: "Sesión expirada",
        text: "Tu sesión caducó. Por favor, ingresá nuevamente para continuar.",
        icon: "info",
        confirmButtonColor: "#FF6B4A"
      })
      window.history.replaceState(null, '', '/login')
    }
  }, [searchParams])

  return null
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthContext()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" }
  })



  const onSubmit = async (data: LoginValues) => {
    try {
      const response = await AuthService.login(data.email, data.password)

      login(String(response.usuario_id), response.rol, response.access_token)

      await Swal.fire({
        title: "¡Bienvenido!",
        text: "Inicio de sesión exitoso.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })

      router.push("/home")

    } catch (error) {
      const errorMsg = error instanceof Error ? getErrorMessage(error) : "No se pudo conectar con el servidor."
      
      if (errorMsg === "La cuenta no está activa aún") {
        Swal.fire({
          title: "Cuenta inactiva",
          text: "Tu cuenta no está activa. ¿Querés ingresar el código de verificación o pedir que te lo reenvíen?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#FF6B4A",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Ir a verificar",
          cancelButtonText: "Cancelar"
        }).then((result) => {
          if (result.isConfirmed) {
            router.push(`/confirm?email=${encodeURIComponent(data.email)}`)
          }
        })
      } else {
        Swal.fire({
          title: "Error de acceso",
          text: errorMsg,
          icon: "error",
          confirmButtonColor: "#FF6B4A",
        })
      }
    }
  }
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <Suspense fallback={null}>
        <CheckSessionExpired />
      </Suspense>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/football-bg.jpg"
          alt="Futbol"
          fill
          className="object-cover"
          priority
        />
        {/* Light overlay for readability */}
        <div className="absolute inset-0 bg-white/85" />
        {/* Subtle red gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-24 h-24 border-2 border-primary/20 rounded-full animate-float hidden lg:block" />
      <div className="absolute bottom-32 right-32 w-16 h-16 bg-primary/10 rounded-full animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-20 w-12 h-12 border-2 border-primary/15 rounded-lg rotate-45 animate-float hidden lg:block" style={{ animationDelay: '0.5s' }} />

      {/* Login Card - Centered */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-8">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shadow-primary/25 animate-pulse-glow">
              <Image
                src="/logo-partidoya.jpg"
                alt="PartidoYa Logo"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-3xl font-bold text-gray-900">PartidoYa</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Bienvenido de nuevo
            </h1>
            <p className="text-gray-500 text-sm">
              Ingresa tus datos para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...register("email")}
                  className="pl-10 h-12 bg-background border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Contraseña</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-10 h-12 bg-background border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold mt-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              ¿No tenés cuenta?{" "}
              <Link
                href="/register"
                className="text-primary font-semibold hover:underline transition-colors"
              >
                Registrate acá
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-gray-600 text-sm mt-6 font-medium">
          Tu equipo te espera. Volvé a la acción.
        </p>
      </div>
    </div>
  )
}
