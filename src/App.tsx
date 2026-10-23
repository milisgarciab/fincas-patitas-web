import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Animales from './pages/Animales'
import AnimalDetalle from './pages/AnimalDetalle'
import CrearAnimal from './pages/CrearAnimal'

function Protegida({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('accessToken') ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
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
          path="/animales/:id"
          element={
            <Protegida>
              <AnimalDetalle />
            </Protegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}