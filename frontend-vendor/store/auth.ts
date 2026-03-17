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
        Cookies.set('vendor_token', token, { expires: 1 })
        Cookies.set('vendor_refresh', refreshToken, { expires: 7 })
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        Cookies.remove('vendor_token')
        Cookies.remove('vendor_refresh')
        set({ user: null, isAuthenticated: false })
      },
    }),
    { name: 'vendor-auth' }
  )
)
