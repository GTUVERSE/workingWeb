"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { userAPI } from "@/lib/api-service"

type User = {
  id: string
  username: string
  email?: string
  avatar?: string
  token?: string
}

type AuthContextType = {
  user: User | null
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (credentials: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("gtuverse-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("gtuverse-user", JSON.stringify(user))
    }
  }, [user])

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await userAPI.login(credentials)

      if (response.user && response.token) {
        const loggedInUser = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          avatar: response.user.avatar || `/placeholder.svg?height=40&width=40`,
          token: response.token,
        }

        setUser(loggedInUser)
        router.push("/")
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Giriş başarısız. Lütfen kullanıcı adı ve şifrenizi kontrol edin.")

      // Fallback for development
      if (process.env.NODE_ENV === "development") {
        console.warn("Using mock login in development mode")
        const mockUser = {
          id: "user-" + Math.random().toString(36).substr(2, 9),
          username: credentials.username,
          avatar: `/placeholder.svg?height=40&width=40`,
          token: "mock-token",
        }
        setUser(mockUser)
        router.push("/")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: { username: string; email: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await userAPI.register(credentials)

      if (response.user && response.token) {
        const registeredUser = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          avatar: response.user.avatar || `/placeholder.svg?height=40&width=40`,
          token: response.token,
        }

        setUser(registeredUser)
        router.push("/")
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("Kayıt başarısız. Lütfen farklı bir kullanıcı adı deneyin veya daha sonra tekrar deneyin.")

      // Fallback for development
      if (process.env.NODE_ENV === "development") {
        console.warn("Using mock registration in development mode")
        const mockUser = {
          id: "user-" + Math.random().toString(36).substr(2, 9),
          username: credentials.username,
          email: credentials.email,
          avatar: `/placeholder.svg?height=40&width=40`,
          token: "mock-token",
        }
        setUser(mockUser)
        router.push("/")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // API çağrısı gerekiyorsa burada yapılabilir
    // userAPI.logout(user.id);

    setUser(null)
    localStorage.removeItem("gtuverse-user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
