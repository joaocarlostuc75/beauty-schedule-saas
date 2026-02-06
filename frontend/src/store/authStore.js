import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      salon: null,
      isAuthenticated: false,
      
      login: (user, token, salon) => {
        set({ user, token, salon, isAuthenticated: true })
      },
      
      logout: () => {
        set({ user: null, token: null, salon: null, isAuthenticated: false })
      },
      
      updateSalon: (salon) => {
        set({ salon })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useSalonStore = create((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}))