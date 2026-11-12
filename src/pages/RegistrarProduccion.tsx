import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import SelectorAnimal from '../components/SelectorAnimal'

interface Props {
  tipo: 'leche' | 'huevos'
}

export default function RegistrarProduccion({ tipo }: Props) {
  const navigate = useNavigate()
  const esLeche = tipo === 'leche'

  const [paraQuien, setParaQuien] = useState<'animal' | 'lote'>('animal')
  const [animalId, setAnimalId] = useState('')
  const [loteId, setLoteId] = useState('')
  const [litros, setLitros] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [rotos, setRotos] = useState('0')
  const [jornada, setJornada] = useState('Mañana')
  const [observaciones, setObservaciones] = useState('')
  const [fechaHora, setFechaHora] = useState('')

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    const body: Record<string, unknown> = {
      [paraQuien === 'animal' ? 'animal_id' : 'lote_id']: Number(
        paraQuien === 'animal' ? animalId : loteId,
      ),
      observaciones: observaciones || undefined,
      registrado_en: fechaHora ? new Date(fechaHora).toISOString() : undefined,
    }

    if (esLeche) {
      body.litros = Number(litros)
      body.jornada = jornada
    } else {
      body.cantidad = Number(cantidad)
      body.cantidad_rotos = Number(rotos)
    }

    try {
      await api.post(esLeche ? '/produccion-leche' : '/produccion-huevos', body)
      navigate(`/produccion/${tipo}`)
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar el registro')
    } finally {
      setGuardando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-xl mx-auto">
        <Link to={`/produccion/${tipo}`} className="text-bosque hover:underline">
          ← Volver a {esLeche ? 'leche' : 'huevos'}
        </Link>

        <form onSubmit={guardar} className="mt-4 bg-white rounded-xl shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold text-bosque-oscuro">
            Registrar {esLeche ? 'leche' : 'huevos'}
          </h1>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Registrar para</label>
            <select
              value={paraQuien}
              onChange={(e) => setParaQuien(e.target.value as 'animal' | 'lote')}
              className={campo}
            >
              <option value="animal">Un animal</option>
              <option value="lote">Un lote</option>
            </select>
          </div>

          {paraQuien === 'animal' ? (
            <SelectorAnimal
              etiqueta="Animal"
              valor={animalId}
              onCambio={setAnimalId}
              requerido
            />
          ) : (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Número del lote</label>
              <input
                type="number"
                min="1"
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                required
                className={campo}
              />
            </div>
          )}

          {esLeche ? (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Litros</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={litros}
                  onChange={(e) => setLitros(e.target.value)}
                  required
                  className={campo}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Jornada</label>
                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className={campo}
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                </select>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Rotos</label>
                <input
                  type="number"
                  min="0"
                  value={rotos}
                  onChange={(e) => setRotos(e.target.value)}
                  className={campo}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha y hora (opcional)</label>
            <input
              type="datetime-local"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className={campo}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar registro'}
          </button>
        </form>
      </div>
    </div>
  )
}