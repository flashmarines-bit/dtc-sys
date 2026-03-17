import axios from 'axios'
import Cookies from 'js-cookie'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://cuddly-enigma-69667jq5vvgq24gp9-5000.app.github.dev',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('vendor_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('vendor_token')
      Cookies.remove('vendor_refresh')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
