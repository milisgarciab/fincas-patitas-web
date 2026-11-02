import { useMemo } from 'react'
import type { ReactNode } from 'react'

function generarEstrellas(cantidad: number, ancho: number, alto: number) {
  return Array.from({ length: cantidad }, () => {
    const x = Math.floor(Math.random() * ancho)
    const y = Math.floor(Math.random() * alto)
    return `${x}px ${y}px #fff`
  }).join(', ')
}

// Tres capas: estrellas chicas rápidas, medianas y grandes lentas
const CAPAS = [
  { tamano: 1, cantidad: 700, segundos: 50 },
  { tamano: 2, cantidad: 200, segundos: 100 },
  { tamano: 3, cantidad: 100, segundos: 150 },
]

export default function FondoEstrellas({ children }: { children: ReactNode }) {
  const capas = useMemo(
    () =>
      CAPAS.map((c) => ({
        ...c,
        sombras: generarEstrellas(c.cantidad, 2000, 2000),
      })),
    [],
  )

  return (
    <div
      className="relative min-h-screen p-3 sm:p-6 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
      }}
    >
      <style>{`
        @keyframes animEstrellas {
          from { transform: translateY(0); }
          to { transform: translateY(-2000px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .capa-estrellas { animation: none !important; }
        }
      `}</style>

      {capas.map((c) => (
        <div
          key={c.tamano}
          className="capa-estrellas absolute top-0 left-0 pointer-events-none"
          style={{ animation: `animEstrellas ${c.segundos}s linear infinite` }}
        >
          {[0, 2000].map((desplazamiento) => (
            <div
              key={desplazamiento}
              className="absolute left-0"
              style={{
                top: desplazamiento,
                width: c.tamano,
                height: c.tamano,
                background: 'transparent',
                boxShadow: c.sombras,
              }}
            />
          ))}
        </div>
      ))}

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}