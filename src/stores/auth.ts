import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { User, UserRole } from '../types/database'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkUser: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  canAccess: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Fetch user profile with role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        set({ user: userData, isLoading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ user: null, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  checkUser: async () => {
    set({ isLoading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        set({ user: userData })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  hasRole: (role: UserRole) => {
    const { user } = get()
    return user?.role === role
  },

  canAccess: (permission: string) => {
    const { user } = get()
    if (!user) return false

    const rolePermissions: Record<UserRole, string[]> = {
      admin: ['create', 'read', 'update', 'delete', 'export'],
      store_manager: ['create', 'read', 'update', 'delete'],
      store_user: ['create', 'read']
    }

    return rolePermissions[user.role]?.includes(permission) || false
  }
}))