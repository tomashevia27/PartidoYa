import { Trophy } from "lucide-react"

interface Props {
  campeon: any
  goleador: any
  vallaMenosVencida: any
}

export function TorneoHeroCelebration({ campeon, goleador, vallaMenosVencida }: Props) {
  if (!campeon) return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 border-b border-primary-foreground/10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 flex justify-center pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
                <div 
                    key={i} 
                    className="animate-confetti absolute w-1.5 h-4 sm:w-2 sm:h-6 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${Math.random() * 20 + 10}px`,
                        backgroundColor: ['#ffffff', '#f8fafc', '#e2e8f0', '#fbbf24'][Math.floor(Math.random() * 4)],
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${Math.random() * 3 + 2}s`
                    }}
                />
            ))}
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10 text-center">
            <div className="inline-flex items-center justify-center p-5 bg-primary-foreground/20 backdrop-blur-md rounded-full mb-6 animate-trophy-glow shadow-[0_0_40px_rgba(255,255,255,0.2)] ring-4 ring-primary-foreground/30">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground drop-shadow-md" />
            </div>
            
            <h2 className="text-sm sm:text-lg font-bold text-primary-foreground/90 mb-3 tracking-[0.3em] uppercase">
                ¡Tenemos Campeón!
            </h2>
            
            <h1 className="text-5xl sm:text-7xl font-black text-primary-foreground mb-10 drop-shadow-xl animate-scale-in">
                {campeon.equipo_nombre}
            </h1>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {goleador && (
                    <div className="bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 rounded-2xl p-4 flex items-center gap-4 text-left shadow-xl hover:bg-primary-foreground/15 hover:border-primary-foreground/30 transition-all animate-scale-in animation-delay-200">
                        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl drop-shadow-md">⚽</span>
                        </div>
                        <div className="min-w-0">
                            <div className="text-primary-foreground/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5">Goleador del Torneo</div>
                            <div className="text-primary-foreground font-bold text-base sm:text-lg leading-tight truncate">{goleador.nombre}</div>
                            <div className="text-primary-foreground/90 text-xs sm:text-sm font-medium mt-0.5">{goleador.goles} goles</div>
                        </div>
                    </div>
                )}

                {vallaMenosVencida && (
                    <div className="bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 rounded-2xl p-4 flex items-center gap-4 text-left shadow-xl hover:bg-primary-foreground/15 hover:border-primary-foreground/30 transition-all animate-scale-in animation-delay-400">
                        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl drop-shadow-md">🧤</span>
                        </div>
                        <div className="min-w-0">
                            <div className="text-primary-foreground/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5">Valla Menos Vencida</div>
                            <div className="text-primary-foreground font-bold text-base sm:text-lg leading-tight truncate">{vallaMenosVencida.nombre}</div>
                            <div className="text-primary-foreground/90 text-xs sm:text-sm font-medium mt-0.5">{vallaMenosVencida.goles_recibidos} en contra</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
