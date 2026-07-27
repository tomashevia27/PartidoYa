"use client"
import { useAuthContext } from "@/components/auth-provider"
import { AdminDashboard } from "@/components/home/admin-dashboard"
import { PlayerDashboard } from "@/components/home/player-dashboard"

export default function HomePage() {
  const { role } = useAuthContext()

  if (role === "admin") {
    return <AdminDashboard />
  }

  return <PlayerDashboard />
}
