import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'

interface Animal {
  id: number
  codigo: string
  nombre: string
  genero: string
  estado: string
  origen: string | null
  fecha_nacimiento: string | null
  fecha_ingreso: string | null
  madre_id: number | null
  padre_id: number | null
  potrero_id: number | null
  especies: { nombre: string }
  razas: { nombre: string }
  lotes_animales: { nombre: string } | null
}

export default function AnimalDetalle() {
  const { id } = useParams()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setCargando(true)
    setError('')
    api
      .get(`/animales/${id}`)
      .then((r) => setAnimal(r.data))
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? 'Ese animal no existe'
            : 'No se pudo cargar el animal',
        ),
      )
      .finally(() => setCargando(false))
  }, [id])

  const fecha = (f: string | null) =>
    f ? new Date(f).toLocaleDateString('es-CO') : '—'

  const enlaceAnimal = (animalId: number | null) =>
    animalId ? (
      <Link to={`/animales/${animalId}`} className="text-green-700 hover:underline">
        Ver animal #{animalId}
      </Link>
    ) : (
      '—'
    )

  const Fila = ({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) => (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="font-medium text-gray-800">{valor}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/animales" className="text-green-700 hover:underline">
          ← Volver a animales
        </Link>

        {cargando && <p className="mt-6 text-gray-500">Cargando...</p>}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        {animal && (
          <div className="mt-4 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-green-800">{animal.nombre}</h1>
                <p className="font-mono text-sm text-gray-500">{animal.codigo}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  animal.estado === 'Activo'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {animal.estado}
              </span>
            </div>

            <Fila etiqueta="Especie" valor={animal.especies?.nombre} />
            <Fila etiqueta="Raza" valor={animal.razas?.nombre} />
            <Fila etiqueta="Género" valor={animal.genero} />
            <Fila etiqueta="Fecha de nacimiento" valor={fecha(animal.fecha_nacimiento)} />
            <Fila etiqueta="Fecha de ingreso" valor={fecha(animal.fecha_ingreso)} />
            <Fila etiqueta="Origen" valor={animal.origen ?? '—'} />
            <Fila etiqueta="Madre" valor={enlaceAnimal(animal.madre_id)} />
            <Fila etiqueta="Padre" valor={enlaceAnimal(animal.padre_id)} />
            <Fila etiqueta="Lote" valor={animal.lotes_animales?.nombre ?? '—'} />
            <Fila etiqueta="Potrero" valor={animal.potrero_id ?? '—'} />
          </div>
        )}
      </div>
    </div>
  )
}