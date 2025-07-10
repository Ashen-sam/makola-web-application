"use client"

import type React from "react"
import { useState } from "react"
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
import { Home, Plus, User, LogOut, Bell, BarChart3, MapPin } from "lucide-react"
import LoadingScreen from "../../components/loading-screen"

interface UserLayoutProps {
  children: React.ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [notifications] = useState(3)
  const [showLoading, setShowLoading] = useState(false)

  const navItems = [
    { id: "feed", label: "Feed", icon: Home, path: "/user/feed" },
    { id: "report", label: "Report Issue", icon: Plus, path: "/user/report" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/user/analytics" },
    { id: "profile", label: "Profile", icon: User, path: "/user/profile" },
  ]

  const handleSignOut = () => {
    setShowLoading(true)
    setTimeout(() => {
      router.push("/")
    }, 2500)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <>
      <LoadingScreen isVisible={showLoading} type="logout" onComplete={() => setShowLoading(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
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

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative hover:scale-110 transition-transform">
                  <Bell className="h-5 w-5 text-slate-600" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ">
                      {notifications}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 p-2 hover:scale-105 transition-transform"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">JD</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-slate-700">John Doe</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </>
  )
}
