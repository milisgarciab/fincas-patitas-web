import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { hoyLocal } from '../fechas'
import SelectorAnimal from '../components/SelectorAnimal'

// Solo "Vacunación" está confirmado en Swagger; los demás son suposición
const TIPOS = ['Vacunación', 'Tratamiento', 'Enfermedad', 'Desparasitación']

export default function CrearEventoSanitario() {
  const navigate = useNavigate()
  const [animalId, setAnimalId] = useState('')
  const [tipo, setTipo] = useState('Vacunación')
  const [dosis, setDosis] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(hoyLocal())
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.post('/eventos-sanitarios', {
        animal_id: Number(animalId),
        tipo_evento: tipo,
        dosis_aplicada: dosis ? Number(dosis) : undefined,
        descripcion_tratamiento: descripcion || undefined,
        fecha_evento: fecha,
      })
      navigate('/salud')
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar el evento')
    } finally {
      setGuardando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/salud" className="text-bosque hover:underline">
          ← Volver a salud animal
        </Link>

        <form onSubmit={guardar} className="mt-4 bg-white rounded-xl shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold text-bosque-oscuro">Nuevo evento sanitario</h1>

          <SelectorAnimal etiqueta="Animal" valor={animalId} onCambio={setAnimalId} requerido />

          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo de evento</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Dosis aplicada (opcional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha del evento</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Descripción del tratamiento (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className={campo}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar evento'}
          </button>
        </form>
      </div>
    </div>
  )
}