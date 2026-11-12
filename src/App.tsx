import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Inicio from './pages/Inicio'
import Animales from './pages/Animales'
import AnimalDetalle from './pages/AnimalDetalle'
import CrearAnimal from './pages/CrearAnimal'
import EditarAnimal from './pages/EditarAnimal'
import Produccion from './pages/Produccion'
import RegistrarProduccion from './pages/RegistrarProduccion'
import Bodega from './pages/Bodega'
import CrearInsumo from './pages/CrearInsumo'
import EventosSanitarios from './pages/EventosSanitarios'
import CrearEventoSanitario from './pages/CrearEventoSanitario'
import Reproduccion from './pages/Reproduccion'
import CrearReproduccion from './pages/CrearReproduccion'
import Finanzas from './pages/Finanzas'
import MercadoBalance from './pages/MercadoBalance'
import Usuarios from './pages/Usuarios'
import { puede } from './permisos'
import type { Permiso } from './permisos'

function Protegida({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('accessToken') ? children : <Navigate to="/" />
}

// Si el rol no tiene el permiso, vuelve al Inicio
function ConPermiso({
  permiso,
  children,
}: {
  permiso: Permiso
  children: React.ReactNode
}) {
  return puede(permiso) ? children : <Navigate to="/inicio" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route
          element={
            <Protegida>
              <Layout />
            </Protegida>
          }
        >
          <Route path="/inicio" element={<Inicio />} />

          <Route path="/animales" element={<Animales />} />
          <Route path="/animales/nuevo" element={<CrearAnimal />} />
          <Route
            path="/animales/:id/editar"
            element={
              <ConPermiso permiso="animales.editar">
                <EditarAnimal />
              </ConPermiso>
            }
          />
          <Route path="/animales/:id" element={<AnimalDetalle />} />

          <Route path="/produccion" element={<Produccion />} />
          <Route path="/produccion/leche" element={<Navigate to="/produccion" replace />} />
          <Route path="/produccion/huevos" element={<Navigate to="/produccion" replace />} />
          <Route path="/produccion/leche/nuevo" element={<RegistrarProduccion tipo="leche" />} />
          <Route path="/produccion/huevos/nuevo" element={<RegistrarProduccion tipo="huevos" />} />

          <Route path="/bodega" element={<Bodega />} />
          <Route
            path="/bodega/nuevo"
            element={
              <ConPermiso permiso="insumos.crear">
                <CrearInsumo />
              </ConPermiso>
            }
          />

          <Route path="/salud" element={<EventosSanitarios />} />
          <Route path="/salud/nuevo" element={<CrearEventoSanitario />} />

          <Route path="/reproduccion" element={<Reproduccion />} />
          <Route path="/reproduccion/nuevo" element={<CrearReproduccion />} />

          <Route
            path="/finanzas"
            element={
              <ConPermiso permiso="finanzas.ver">
                <Finanzas />
              </ConPermiso>
            }
          />
          <Route
            path="/finanzas/balance"
            element={
              <ConPermiso permiso="finanzas.ver">
                <MercadoBalance />
              </ConPermiso>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ConPermiso permiso="usuarios.ver">
                <Usuarios />
              </ConPermiso>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}