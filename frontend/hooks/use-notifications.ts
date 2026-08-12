"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { NotificacionesService, type NotificacionesListado } from "@/services/notificaciones.service"

const POLLING_INTERVAL = 30000 // 30 segundos

export function useNotifications(isOpen: boolean = false) {
  const queryClient = useQueryClient()

  // 1. Polling silencioso del conteo (cada 30s, no importa si está cerrado)
  const { data: unreadData } = useQuery({
    queryKey: ["notificaciones", "count"],
    queryFn: () => NotificacionesService.getConteoNoLeidas(),
    refetchInterval: POLLING_INTERVAL,
  })

  // 2. Carga de la lista completa (solo se ejecuta si el panel está abierto)
  const { data: listData, isLoading } = useQuery({
    queryKey: ["notificaciones", "list"],
    queryFn: () => NotificacionesService.getAll(),
    enabled: isOpen,
  })

  // Determinamos el conteo final: Si el panel está abierto, usamos la cuenta de la lista que está sincronizada con los items visibles.
  const unreadCount = (isOpen && listData) ? listData.total_no_leidas : (unreadData?.total_no_leidas || 0)
  const notificaciones = listData?.notificaciones || []

  // Mutación: Marcar como Leída
  const markAsRead = useMutation({
    mutationFn: (id: number) => NotificacionesService.marcarLeida(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notificaciones"] })
      
      // Update local list
      queryClient.setQueryData<NotificacionesListado>(["notificaciones", "list"], (old) => {
        if (!old) return old
        return {
          ...old,
          notificaciones: old.notificaciones.map((n) => n.id === id ? { ...n, leida: true } : n),
          total_no_leidas: Math.max(0, old.total_no_leidas - 1)
        }
      })
      // Update local count
      queryClient.setQueryData(["notificaciones", "count"], (old: any) => ({
        total_no_leidas: Math.max(0, (old?.total_no_leidas || 0) - 1)
      }))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    }
  })

  // Mutación: Marcar Todas como Leídas
  const markAllAsRead = useMutation({
    mutationFn: () => NotificacionesService.marcarTodasLeidas(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notificaciones"] })
      
      queryClient.setQueryData<NotificacionesListado>(["notificaciones", "list"], (old) => {
        if (!old) return old
        return {
          ...old,
          notificaciones: old.notificaciones.map((n) => ({ ...n, leida: true })),
          total_no_leidas: 0
        }
      })
      queryClient.setQueryData(["notificaciones", "count"], { total_no_leidas: 0 })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    }
  })

  // Mutación: Eliminar una
  const deleteNotification = useMutation({
    mutationFn: (id: number) => NotificacionesService.eliminar(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notificaciones"] })
      
      queryClient.setQueryData<NotificacionesListado>(["notificaciones", "list"], (old) => {
        if (!old) return old
        const notif = old.notificaciones.find(n => n.id === id)
        const isUnread = notif && !notif.leida
        
        const newCount = isUnread ? Math.max(0, old.total_no_leidas - 1) : old.total_no_leidas
        queryClient.setQueryData(["notificaciones", "count"], { total_no_leidas: newCount })

        return {
          ...old,
          notificaciones: old.notificaciones.filter((n) => n.id !== id),
          total_no_leidas: newCount
        }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    }
  })

  // Mutación: Eliminar todas
  const deleteAll = useMutation({
    mutationFn: () => NotificacionesService.eliminarTodas(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notificaciones"] })
      queryClient.setQueryData<NotificacionesListado>(["notificaciones", "list"], { notificaciones: [], total_no_leidas: 0 })
      queryClient.setQueryData(["notificaciones", "count"], { total_no_leidas: 0 })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    }
  })

  return {
    notificaciones,
    unreadCount,
    isLoading,
    markAsRead: (id: number) => markAsRead.mutate(id),
    markAllAsRead: () => markAllAsRead.mutate(),
    deleteNotification: (id: number) => deleteNotification.mutate(id),
    deleteAll: () => deleteAll.mutate(),
  }
}
