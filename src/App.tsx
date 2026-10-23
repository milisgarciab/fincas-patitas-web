import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Animales from './pages/Animales'

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
      </Routes>
    </BrowserRouter>
  )
}