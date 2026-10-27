import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Ruta del backend que renueva la sesión (verifícala en Swagger)
const RUTA_REFRESH = '/auth/refresh'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si varias peticiones fallan a la vez, se renueva una sola vez
let renovando: Promise<string> | null = null

const renovarToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('Sin refresh token')

  // Se usa axios directo (no "api") para no caer en un ciclo del interceptor
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_URL}${RUTA_REFRESH}`,
    { refreshToken },
  )

  localStorage.setItem('accessToken', data.accessToken)
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
  return data.accessToken
}

interface ConfigReintento extends InternalAxiosRequestConfig {
  _reintentado?: boolean
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const config = error.config as ConfigReintento | undefined
    const url = config?.url ?? ''
    const esAuth = url.includes('/auth/login') || url.includes(RUTA_REFRESH)

    if (error.response?.status !== 401 || !config || config._reintentado || esAuth) {
      return Promise.reject(error)
    }

    config._reintentado = true
    try {
      renovando =
        renovando ??
        renovarToken().finally(() => {
          renovando = null
        })
      const nuevoToken = await renovando
      config.headers.Authorization = `Bearer ${nuevoToken}`
      return api(config)
    } catch {
      localStorage.clear()
      window.location.href = '/'
      return Promise.reject(error)
    }
  },
)