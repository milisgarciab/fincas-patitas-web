import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Inicio from './pages/Inicio'
import Animales from './pages/Animales'
import AnimalDetalle from './pages/AnimalDetalle'
import CrearAnimal from './pages/CrearAnimal'
import EditarAnimal from './pages/EditarAnimal'
import ProduccionLeche from './pages/ProduccionLeche'
import ProduccionHuevos from './pages/ProduccionHuevos'
import RegistrarProduccion from './pages/RegistrarProduccion'
import Bodega from './pages/Bodega'
import CrearInsumo from './pages/CrearInsumo'

function Protegida({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('accessToken') ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route
          path="/inicio"
          element={
            <Protegida>
              <Inicio />
            </Protegida>
          }
        />
        <Route
          path="/animales"
          element={
            <Protegida>
              <Animales />
            </Protegida>
          }
        />
        <Route
          path="/animales/nuevo"
          element={
            <Protegida>
              <CrearAnimal />
            </Protegida>
          }
        />
        <Route
          path="/animales/:id/editar"
          element={
            <Protegida>
              <EditarAnimal />
            </Protegida>
          }
        />
        <Route
          path="/animales/:id"
          element={
            <Protegida>
              <AnimalDetalle />
            </Protegida>
          }
        />
        <Route
          path="/produccion/leche"
          element={
            <Protegida>
              <ProduccionLeche />
            </Protegida>
          }
        />
        <Route
          path="/produccion/leche/nuevo"
          element={
            <Protegida>
              <RegistrarProduccion tipo="leche" />
            </Protegida>
          }
        />
        <Route
          path="/produccion/huevos"
          element={
            <Protegida>
              <ProduccionHuevos />
            </Protegida>
          }
        />
        <Route
          path="/produccion/huevos/nuevo"
          element={
            <Protegida>
              <RegistrarProduccion tipo="huevos" />
            </Protegida>
          }
        />
        <Route
          path="/bodega"
          element={
            <Protegida>
              <Bodega />
            </Protegida>
          }
        />
        <Route
          path="/bodega/nuevo"
          element={
            <Protegida>
              <CrearInsumo />
            </Protegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}