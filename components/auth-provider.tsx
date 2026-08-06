'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { AuthUser } from '@/lib/api'

type AuthState = {
  userId: string | null
  fullName: string | null
  email: string | null
  role: string | null
  token: string | null
  avatarUrl: string | null
}

type AuthContextValue = AuthState & {
  ready: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: (user: AuthUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const EMPTY: AuthState = {
  userId: null,
  fullName: null,
  email: null,
  role: null,
  token: null,
  avatarUrl: null,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState({
      userId: localStorage.getItem('userId'),
      fullName: localStorage.getItem('fullName'),
      email: localStorage.getItem('email'),
      role: localStorage.getItem('role'),
      token: localStorage.getItem('token'),
      avatarUrl: localStorage.getItem('avatarUrl'),
    })
    setReady(true)

    const onStorage = () => {
      setState({
        userId: localStorage.getItem('userId'),
        fullName: localStorage.getItem('fullName'),
        email: localStorage.getItem('email'),
        role: localStorage.getItem('role'),
        token: localStorage.getItem('token'),
        avatarUrl: localStorage.getItem('avatarUrl'),
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const signIn = useCallback((user: AuthUser) => {
    if (user.token) localStorage.setItem('token', user.token)
    localStorage.setItem('userId', String(user.userId))
    if (user.fullName) localStorage.setItem('fullName', user.fullName)
    if (user.email) localStorage.setItem('email', user.email)
    if (user.role) localStorage.setItem('role', user.role)
    if (user.avatarUrl) localStorage.setItem('avatarUrl', user.avatarUrl)
    setState({
      userId: String(user.userId),
      fullName: user.fullName ?? null,
      email: user.email ?? null,
      role: user.role ?? null,
      token: user.token ?? null,
      avatarUrl: user.avatarUrl ?? null,
    })
  }, [])

  const signOut = useCallback(() => {
    localStorage.clear()
    setState(EMPTY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      ready,
      isAuthenticated: Boolean(state.userId),
      isAdmin: state.role?.toLowerCase() === 'admin',
      signIn,
      signOut,
    }),
    [state, ready, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
