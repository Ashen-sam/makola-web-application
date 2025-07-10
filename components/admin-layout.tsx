"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Users, Settings, LogOut, Bell, BarChart3, Shield, UserCheck } from "lucide-react"
import LoadingScreen from "./loading-screen"

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

export default function AdminLayout({ children, currentPage, onPageChange }: AdminLayoutProps) {
  const [notifications] = useState(5)
  const [showLoading, setShowLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<"refresh" | "login" | "logout">("refresh")

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "issues", label: "Manage Issues", icon: BarChart3 },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const handleSignOut = () => {
    setLoadingType("logout")
    setShowLoading(true)

    // Simulate logout process
    setTimeout(() => {
      console.log("Admin signed out")
    }, 2500)
  }

  return (
    <>
      <LoadingScreen isVisible={showLoading} type={loadingType} onComplete={() => setShowLoading(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Admin Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Admin Logo */}
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Makola Admin</h1>
                  <p className="text-xs text-slate-600">Community Management Portal</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? "default" : "ghost"}
                      onClick={() => onPageChange(item.id)}
                      className={`flex items-center gap-2 transition-colors duration-200 ${
                        currentPage === item.id
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

              {/* Admin Menu */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative hover:scale-110 transition-transform">
                  <Bell className="h-5 w-5 text-slate-600" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
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
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">AD</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-slate-700">Admin User</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Admin Profile
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
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(item.id)}
                    className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
                      currentPage === item.id
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
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </div>
    </>
  )
}
