import { Shield } from "lucide-react"

interface Props {
  torneo: any
  role: string | null | undefined
  estaAbierto: boolean
  hayCupos: boolean
}

export function EquiposTab({ torneo, role, estaAbierto, hayCupos }: Props) {
  
  const renderizarJugadores = (jugadoresRaw: string | any[]) => {
      if (Array.isArray(jugadoresRaw)) {
          if (jugadoresRaw.length === 0) return null
          return (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {jugadoresRaw.map((j, i) => (
                      <span
                          key={i}
                          className="inline-block bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-md border border-border/60"
                      >
                          {j.nombre} {j.apellido || ""}
                      </span>
                  ))}
              </div>
          )
      }
      try {
          const lista = JSON.parse(jugadoresRaw)
          if (Array.isArray(lista)) {
              return (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {lista.map((j: any, i: number) => (
                          <span
                              key={i}
                              className="inline-block bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-md border border-border/60"
                              title={j.email ? `Email: ${j.email} | DNI: ${j.dni}` : undefined}
                          >
                              {j.nombre}
                          </span>
                      ))}
                  </div>
              )
          }
      } catch (e) {
      }
      return <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{jugadoresRaw}</p>
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Equipos Inscriptos
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
                {torneo.equipos_inscriptos} de {torneo.max_equipos} equipos
            </p>
        </div>

        <div className="p-0">
            {torneo.equipos && torneo.equipos.length > 0 ? (
                <ul className="divide-y divide-border">
                    {torneo.equipos.map((equipo: any) => (
                        <li key={equipo.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <p className="font-semibold text-sm text-foreground">{equipo.nombre_equipo}</p>
                            {renderizarJugadores(equipo.jugadores)}
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">Todavía no hay equipos inscriptos.</p>
                    {estaAbierto && hayCupos && role !== "admin" && (
                        <p className="text-sm mt-1 font-medium text-primary">¡Sé el primero en anotarte!</p>
                    )}
                </div>
            )}
        </div>
    </div>
  )
}
