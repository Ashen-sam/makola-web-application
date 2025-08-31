"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Plus, User, LogOut, BarChart3, MapPin } from "lucide-react"
import LoadingScreen from "../../components/loading-screen"

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
  const [notifications] = useState(3)
  const [showLoading, setShowLoading] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  console.log(user, "User data in UserLayout")

  useEffect(() => {
    console.log("User Layout initialized");

    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);

        // Split username if firstName and lastName are missing
        if (!parsedUser.firstName && !parsedUser.lastName && parsedUser.username) {
          const nameParts = parsedUser.username.trim().split(" ");
          parsedUser.firstName = nameParts[0];
          parsedUser.lastName = nameParts.slice(1).join(" ");
        }

        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
  }, []);


  const navItems = [
    { id: "feed", label: "Feed", icon: Home, path: "/user/feed" },
    { id: "report", label: "Report Issue", icon: Plus, path: "/user/report" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/user/analytics" },
    { id: "profile", label: "Profile", icon: User, path: "/user/profile" },
  ]

  const handleSignOut = () => {
    setShowLoading(true)

    // Clear user data from localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')

    // Simulate logout process
    setTimeout(() => {
      console.log("User signed out - redirecting to landing page")
      router.push("/auth/login")
    }, 2500)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }


  // Helper function to get initials for avatar
  const getInitials = () => {
    if (!user) return "U"

    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    }

    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase()
    }

    return user.username.charAt(0).toUpperCase()
  }

  return (
    <>
      <LoadingScreen isVisible={showLoading} type="logout" onComplete={() => setShowLoading(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo - Static version without animation */}
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Makola Community</h1>
                  <p className="text-xs text-slate-600">Issue Reporting Platform</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.path
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center gap-2 transition-colors duration-200 ${isActive
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  )
                })}
              </nav>

              {/* User Menu with Notification Badge */}
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 p-2 hover:scale-105 transition-transform relative"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        {notifications > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                            {notifications > 99 ? '99+' : notifications}
                          </div>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {notifications > 0 && (
                      <>
                        <DropdownMenuItem className="text-emerald-600 font-medium">
                          <div className="flex items-center justify-between w-full">
                            <span>Notifications</span>
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                              {notifications}
                            </span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => handleNavigation("/user/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex justify-center gap-1 mt-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-1 text-xs transition-colors duration-200 ${isActive
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "text-slate-700 hover:text-slate-900"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </>
  )
}