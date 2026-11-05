import { useState } from 'react'
import { aplicarModo, modoOscuroActivo } from '../modoOscuro'

export default function ToggleTema() {
  const [oscuro, setOscuro] = useState(modoOscuroActivo())

  const cambiar = (valor: boolean) => {
    setOscuro(valor)
    aplicarModo(valor)
  }

  return (
    <label
      className="toggle-etiqueta"
      title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <input
        type="checkbox"
        className="toggle-input sr-only"
        checked={oscuro}
        onChange={(e) => cambiar(e.target.checked)}
        aria-label="Modo oscuro"
      />
      <span className="toggle">
        <span className="toggle__circle" />
      </span>
    </label>
  )
}