import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-end p-10 text-white bg-cover bg-center"
        style={{
          backgroundColor: '#166534',
          backgroundImage:
            "linear-gradient(to top, rgba(0,60,30,0.85), rgba(0,100,50,0.35)), url('/fondo.jpg')",
        }}
      >
        <h2 className="text-4xl font-bold">Fincas y Patitas</h2>
        <p className="mt-2 text-lg text-green-100">
          Gestiona tus animales, producción e inventario en un solo lugar.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-green-50 p-6">
        {children}
      </div>
    </div>
  )
}