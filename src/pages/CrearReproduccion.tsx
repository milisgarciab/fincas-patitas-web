import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function CrearReproduccion() {
  const navigate = useNavigate()
  const hoy = new Date().toISOString().slice(0, 10)

  const [animalId, setAnimalId] = useState('')
  const [machoId, setMachoId] = useState('')
  const [tipo, setTipo] = useState('IA')
  const [fechaInseminacion, setFechaInseminacion] = useState(hoy)
  const [fechaParto, setFechaParto] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.post('/reproduccion', {
        animal_id: Number(animalId),
        macho_id: machoId ? Number(machoId) : undefined,
        tipo,
        fecha_inseminacion: fechaInseminacion,
        fecha_estimada_parto: fechaParto || undefined,
        notas: notas || undefined,
      })
      navigate('/reproduccion')
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo registrar la gestación')
    } finally {
      setGuardando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600'

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/reproduccion" className="text-green-700 hover:underline">
          ← Volver a reproducción
        </Link>

        <form
          onSubmit={guardar}
          className="mt-4 bg-white rounded-xl shadow p-6 space-y-4"
        >
          <h1 className="text-2xl font-bold text-green-800">Nueva gestación</h1>

          <div>
            <label className="block text-sm text-gray-600 mb-1">ID de la hembra</label>
            <input
              type="number"
              min="1"
              value={animalId}
              onChange={(e) => setAnimalId(e.target.value)}
              required
              className={campo}
            />
            <p className="text-xs text-gray-500 mt-1">
              El ID está en la dirección del detalle del animal (por ejemplo
              /animales/41).
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ID del macho (opcional)
            </label>
            <input
              type="number"
              min="1"
              value={machoId}
              onChange={(e) => setMachoId(e.target.value)}
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
              <option value="IA">IA</option>
              <option value="Monta natural">Monta natural</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fecha de inseminación o monta
            </label>
            <input
              type="date"
              value={fechaInseminacion}
              onChange={(e) => setFechaInseminacion(e.target.value)}
              required
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fecha estimada de parto (opcional)
            </label>
            <input
              type="date"
              value={fechaParto}
              onChange={(e) => setFechaParto(e.target.value)}
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className={campo}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Registrar gestación'}
          </button>
        </form>
      </div>
    </div>
  )
}