import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { hoyLocal } from '../fechas'
import SelectorAnimal from '../components/SelectorAnimal'

export default function CrearReproduccion() {
  const navigate = useNavigate()

  const [animalId, setAnimalId] = useState('')
  const [machoId, setMachoId] = useState('')
  const [tipo, setTipo] = useState('IA')
  const [fechaInseminacion, setFechaInseminacion] = useState(hoyLocal())
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
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/reproduccion" className="text-bosque hover:underline">
          ← Volver a reproducción
        </Link>

        <form onSubmit={guardar} className="mt-4 bg-white rounded-xl shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold text-bosque-oscuro">Nueva gestación</h1>

          <SelectorAnimal
            etiqueta="Hembra"
            valor={animalId}
            onCambio={setAnimalId}
            genero="Hembra"
            requerido
          />

          <SelectorAnimal
            etiqueta="Macho (opcional)"
            valor={machoId}
            onCambio={setMachoId}
            genero="Macho"
            textoVacio="Sin macho registrado"
          />

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
            className="w-full bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Registrar gestación'}
          </button>
        </form>
      </div>
    </div>
  )
}