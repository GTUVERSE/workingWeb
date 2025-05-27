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

  // Mount sırasında localStorage'dan kullanıcıyı çek
  useEffect(() => {
    const storedUser = localStorage.getItem("gtuverse-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Kullanıcı değişince localStorage'a kaydet
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
      console.log("LOGIN RESPONSE:", response)

      const data = response.data || response

      if ((data.id || data.username) && !data.error) {
        // Sadece kullanıcı dönüyor, token yok
        const loggedInUser = {
          id: data.id,
          username: data.username,
          email: data.email,
          avatar: data.avatar || `/placeholder.svg?height=40&width=40`,
          token: "",
        }
        setUser(loggedInUser)
        router.push("/")
      } else if (data.user && data.token) {
        // Token ve user dönüyor
        const loggedInUser = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar || `/placeholder.svg?height=40&width=40`,
          token: data.token,
        }
        setUser(loggedInUser)
        router.push("/")
      } else if (data.error) {
        setError(data.error)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Giriş başarısız. Lütfen kullanıcı adı ve şifrenizi kontrol edin.")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: { username: string; email: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await userAPI.register(credentials)
      console.log("REGISTER RESPONSE:", response)

      // Hem { data: "Registered" } hem "Registered" için kontrol et
      const data = response.data || response

      if (data.user && data.token) {
        const registeredUser = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          avatar: data.user.avatar || `/placeholder.svg?height=40&width=40`,
          token: data.token,
        }
        setUser(registeredUser)
        router.push("/")
      } else if (
        (typeof data === "string" && data.includes("Registered")) ||
        (typeof data === "object" && typeof data.data === "string" && data.data.includes("Registered"))
      ) {
        // Başarılı kayıt düz metin döndü
        router.push("/login")
      } else if (data.error) {
        setError(data.error)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("Kayıt başarısız. Lütfen farklı bir kullanıcı adı deneyin veya daha sonra tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
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
