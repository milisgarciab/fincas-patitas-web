import type { ReactNode } from 'react'
import { tema } from '../tema'
import FondoEstrellas from './FondoEstrellas'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div
        className={`relative hidden md:flex md:w-1/2 flex-col justify-end p-10 text-white overflow-hidden ${tema.panelFondo}`}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/fondo.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className={`absolute inset-0 ${tema.panelOverlay}`} />
        <div className="relative z-10">
          <h2 className="text-4xl font-bold">Fincas y Patitas</h2>
          <p className={`mt-2 text-lg ${tema.textoPanel}`}>
            Gestiona tus animales, producción e inventario en un solo lugar.
          </p>
        </div>
      </div>

      <FondoEstrellas>{children}</FondoEstrellas>
    </div>
  )
}