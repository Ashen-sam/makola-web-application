"use client"
import Header from "@/components/Header"
import Loader from "@/components/loader"
import { useGetProfileQuery } from "@/services/profile" // Import your profile service

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
  avatar?: string // Add avatar field
}

export default function UserLayout({ children }: UserLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Get profile data from Redux store
  const {
    data: profileData,
  } = useGetProfileQuery(
    { user_id: currentUserId! },
    {
      skip: !currentUserId
    }
  )

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)

        // Extract user ID
        const userId = parsedUser.user_id || parsedUser.resident_id
        if (userId) {
          setCurrentUserId(userId)
        }

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

  // Update user with profile picture when profile data is available
  useEffect(() => {
    if (profileData?.profile) {
      const profilePicture = profileData.profile.profile_picture
      setUser(prevUser => prevUser ? ({
        ...prevUser,
        avatar: profilePicture || "/placeholder.svg?height=32&width=32"
      }) : null)
    }
  }, [profileData])

  // Detect page transitions
  // useEffect(() => {
  //   setLoading(true)
  //   const timer = setTimeout(() => setLoading(false), 600) // small delay
  //   return () => clearTimeout(timer)
  // }, [pathname])

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