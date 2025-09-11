"use client"
import Header from "@/components/Header"
import Loader from "@/components/loader"

import { useRouter, usePathname } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"

interface UserLayoutProps {
  children: React.ReactNode
}

interface UserData {
  id: string
  username: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export default function UserLayout({ children }: UserLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        if (!parsedUser.firstName && !parsedUser.lastName && parsedUser.username) {
          const nameParts = parsedUser.username.trim().split(" ")
          parsedUser.firstName = nameParts[0]
          parsedUser.lastName = nameParts.slice(1).join(" ")
        }
        setUser(parsedUser)
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
    }
  }, [])

  // Detect page transitions
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 600) // small delay
    return () => clearTimeout(timer)
  }, [pathname])

  const handleSignOut = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    setTimeout(() => {
      router.push("/login")
    }, 800)
  }

  return (
    <>
      {loading && <Loader />}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header user={user} onSignOut={handleSignOut} />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </>
  )
}
