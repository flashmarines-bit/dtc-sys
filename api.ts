import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = Cookies.get('dtc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — auto refresh token (SSR-safe)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = Cookies.get('dtc_refresh')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        })
        Cookies.set('dtc_token', data.token, { expires: 1 })
        original.headers.Authorization = `Bearer ${data.token}`
        return api(original)
      } catch {
        Cookies.remove('dtc_token')
        Cookies.remove('dtc_refresh')
        // FIX: Gunakan typeof window agar aman di SSR/Server Component
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
