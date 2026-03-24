import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => {
        Cookies.set('dtc_token', token, { expires: 1 })
        Cookies.set('dtc_refresh', refreshToken, { expires: 7 })
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        Cookies.remove('dtc_token')
        Cookies.remove('dtc_refresh')
        set({ user: null, isAuthenticated: false })
      },
    }),
    { name: 'dtc-auth' }
  )
)
