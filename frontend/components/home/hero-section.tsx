import Image from "next/image"

export function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" />
      <polygon points="12,7 14.5,11 12,15 9.5,11" fill="white" opacity="0.3" />
    </svg>
  )
}

export function HeroSection({ nombre, subtitle }: { nombre?: string, subtitle: string }) {
  return (
    <div className="relative h-[280px] sm:h-[360px] overflow-hidden">
      <Image
        src="/football-bg.jpg"
        alt="Inicio"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/60 to-background" />

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
        <h1 className="text-3xl sm:text-5xl font-bold text-card mb-4 drop-shadow-lg animate-slide-up text-balance">
          ¡Hola{nombre ? `, ${nombre.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-card/90 text-lg sm:text-xl max-w-2xl drop-shadow animate-slide-up animation-delay-100">
          {subtitle}
        </p>
      </div>
    </div>
  )
}
