import { useState } from 'react'
import { ExternalLink, LocateFixed, MapPin, Navigation } from 'lucide-react'
import { puede } from '../permisos'

const CLAVE = 'ubicacionFinca'

export default function Ubicacion() {
  const editable = puede('ubicacion.editar')
  const [guardada, setGuardada] = useState(localStorage.getItem(CLAVE) ?? '')
  const [texto, setTexto] = useState(guardada)
  const [satelite, setSatelite] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const consulta = guardada || 'Colombia'
  const zoom = guardada ? 16 : 5
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(consulta)}&z=${zoom}&t=${
    satelite ? 'k' : 'm'
  }&output=embed`
  const enlaceMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`
  const enlaceRuta = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(consulta)}`

  const guardar = (e: React.FormEvent) => {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio) return
    localStorage.setItem(CLAVE, limpio)
    setGuardada(limpio)
    setMensaje('Ubicación guardada en este navegador.')
  }

  const quitar = () => {
    localStorage.removeItem(CLAVE)
    setGuardada('')
    setTexto('')
    setMensaje('Ubicación eliminada.')
  }

  const usarMiUbicacion = () => {
    setMensaje('')
    if (!navigator.geolocation) {
      setMensaje('Tu navegador no permite obtener la ubicación.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setTexto(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
      () => setMensaje('No se pudo obtener tu ubicación. Revisa el permiso del navegador.'),
    )
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-menta flex items-center justify-center">
          <MapPin className="w-5 h-5 text-bosque" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-marron">Ubicación</h1>
          <p className="text-sm text-gray-500">Dónde queda tu finca</p>
        </div>
      </div>

      {editable ? (
        <form onSubmit={guardar} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <label className="block text-sm font-semibold text-marron">
            Dirección o coordenadas
          </label>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej: 4.711000, -74.072100  o  Vereda La Esperanza, Villeta"
            className={campo}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
            >
              Guardar ubicación
            </button>
            <button
              type="button"
              onClick={usarMiUbicacion}
              className="flex items-center gap-2 border border-bosque text-bosque font-semibold rounded-lg px-4 py-2 hover:bg-menta"
            >
              <LocateFixed className="w-4 h-4" />
              Usar mi ubicación actual
            </button>
            {guardada && (
              <button
                type="button"
                onClick={quitar}
                className="text-red-600 font-semibold px-3 py-2 hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
          {mensaje && <p className="text-sm text-bosque">{mensaje}</p>}
          <p className="text-xs text-gray-500">
            Se guarda solo en este navegador. Para ver las coordenadas de un punto: en Google
            Maps, clic derecho sobre el lugar y toca los números.
          </p>
        </form>
      ) : (
        !guardada && (
          <p className="bg-white rounded-2xl shadow-sm p-5 text-sm text-gray-600">
            Todavía no se ha configurado la ubicación de la finca. Pídele al Administrador o al
            Encargado que la agregue.
          </p>
        )
      )}

      <div className="bg-white rounded-2xl shadow-sm p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
          <div className="flex gap-1 bg-crema rounded-lg p-1">
            <button
              onClick={() => setSatelite(false)}
              className={`px-3 py-1 rounded-md text-sm font-semibold ${
                !satelite ? 'bg-bosque text-white' : 'text-marron'
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => setSatelite(true)}
              className={`px-3 py-1 rounded-md text-sm font-semibold ${
                satelite ? 'bg-bosque text-white' : 'text-marron'
              }`}
            >
              Satélite
            </button>
          </div>

          {guardada && (
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <a
                href={enlaceMapa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-bosque hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir en Google Maps
              </a>
              <a
                href={enlaceRuta}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-bosque hover:underline"
              >
                <Navigation className="w-4 h-4" />
                Cómo llegar
              </a>
            </div>
          )}
        </div>

        <iframe
          title="Mapa de la finca"
          src={src}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[460px] rounded-xl border-0"
        />
      </div>
    </div>
  )
}