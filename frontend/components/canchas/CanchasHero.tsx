import Image from "next/image"
import { Trophy, Users, Star } from "lucide-react"
import { FootballIcon } from "./FootballIcon"

interface CanchasHeroProps {
    role: string;
    canchasCount: number;
}

export function CanchasHero({ role, canchasCount }: CanchasHeroProps) {
    return (
        <div className="relative h-[320px] sm:h-[400px] overflow-hidden">
            <Image
                src="/hero-canchas.jpg"
                alt="Campo de futbol"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />

            {/* Floating football decorations */}
            <div className="absolute top-10 left-10 opacity-20 animate-float">
                <FootballIcon className="w-12 h-12 text-card" />
            </div>
            <div className="absolute top-20 right-20 opacity-15 animate-float-reverse">
                <FootballIcon className="w-8 h-8 text-card" />
            </div>
            <div className="absolute bottom-32 right-10 opacity-10 animate-float-slow">
                <FootballIcon className="w-16 h-16 text-card" />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                {role !== "admin" && (
                    <div className="flex items-center gap-3 mb-4 animate-slide-up">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-2xl">
                            <Image
                                src="/logo-partidoya.jpg"
                                alt="PartidoYa Logo"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-card font-bold text-2xl drop-shadow-lg">PartidoYa</span>
                    </div>
                )}
                <h1 className="text-3xl sm:text-5xl font-bold text-card mb-4 drop-shadow-lg animate-slide-up animation-delay-100 text-balance">
                    {role === "admin" ? "Mis Canchas" : "Canchas Disponibles"}
                </h1>
                <p className="text-card/90 text-lg sm:text-xl max-w-2xl drop-shadow animate-slide-up animation-delay-200">
                    {role === "admin" ? "Gestioná y editá los complejos que tenés registrados" : "Encontrá la cancha perfecta para tu próximo partido"}
                </p>

                {/* Stats row */}
                <div className="flex gap-8 mt-8 animate-slide-up animation-delay-300">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-card">
                            <Trophy className="w-5 h-5 text-primary" />
                            <span className="text-2xl font-bold">{canchasCount}+</span>
                        </div>
                        <span className="text-card/70 text-sm">Canchas</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-card">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-2xl font-bold">500+</span>
                        </div>
                        <span className="text-card/70 text-sm">Jugadores</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-card">
                            <Star className="w-5 h-5 text-primary" />
                            <span className="text-2xl font-bold">4.8</span>
                        </div>
                        <span className="text-card/70 text-sm">Rating</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
