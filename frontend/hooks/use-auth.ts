"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

const AUTH_SESSION_KEY = "partidoya_auth_user_id"
const AUTH_ROLE_KEY = "partidoya_auth_user_role"
const AUTH_TOKEN_KEY = "partidoya_auth_access_token"

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = sessionStorage.getItem(AUTH_SESSION_KEY)
    const storedRole = sessionStorage.getItem(AUTH_ROLE_KEY)
    const storedAccessToken = sessionStorage.getItem(AUTH_TOKEN_KEY)
    setUserId(storedUserId)
    setRole(storedRole)
    setAccessToken(storedAccessToken)
    setIsLoading(false)

    const handleAuthExpired = () => {
      sessionStorage.removeItem(AUTH_SESSION_KEY)
      sessionStorage.removeItem(AUTH_ROLE_KEY)
      sessionStorage.removeItem(AUTH_TOKEN_KEY)
      setUserId(null)
      setRole(null)
      setAccessToken(null)
      router.push("/login?expired=true")
    }

    window.addEventListener("auth:expired", handleAuthExpired)

    return () => {
      window.removeEventListener("auth:expired", handleAuthExpired)
    }
  }, [router])

  const login = useCallback((id: string, userRole: string, token: string) => {
    sessionStorage.setItem(AUTH_SESSION_KEY, String(id))
    sessionStorage.setItem(AUTH_ROLE_KEY, userRole)
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    setUserId(String(id))
    setRole(userRole)
    setAccessToken(token)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    setUserId(null)
    setRole(null)
    setAccessToken(null)
  }, [])

  const isAuthenticated = userId !== null && accessToken !== null

  return {
    userId,
    role,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
