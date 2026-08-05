"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { NotificacionesService, type NotificacionData } from "@/services/notificaciones.service"

const POLLING_INTERVAL = 30000 // 30 segundos

export function useNotifications() {
  const [notificaciones, setNotificaciones] = useState<NotificacionData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await NotificacionesService.getConteoNoLeidas()
      setUnreadCount(data.total_no_leidas)
    } catch {
      // Silenciar errores de polling para no molestar al usuario
    }
  }, [])

  const fetchNotificaciones = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await NotificacionesService.getAll()
      setNotificaciones(data.notificaciones)
      setUnreadCount(data.total_no_leidas)
    } catch {
      // Error silenciado
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: number) => {
    try {
      await NotificacionesService.marcarLeida(id)
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Error silenciado
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificacionesService.marcarTodasLeidas()
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setUnreadCount(0)
    } catch {
      // Error silenciado
    }
  }, [])

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await NotificacionesService.eliminar(id)
      setNotificaciones((prev) => {
        const notif = prev.find((n) => n.id === id)
        if (notif && !notif.leida) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch {
      // Error silenciado
    }
  }, [])

  const deleteAll = useCallback(async () => {
    try {
      await NotificacionesService.eliminarTodas()
      setNotificaciones([])
      setUnreadCount(0)
    } catch {
      // Error silenciado
    }
  }, [])

  // Polling para el conteo de no leídas
  useEffect(() => {
    fetchUnreadCount()

    intervalRef.current = setInterval(fetchUnreadCount, POLLING_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchUnreadCount])

  return {
    notificaciones,
    unreadCount,
    isLoading,
    fetchNotificaciones,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
  }
}
