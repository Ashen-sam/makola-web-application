"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Home, LogOut, Shield } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import LoadingScreen from "../../components/loading-screen"

interface AdminLayoutProps {
    children: React.ReactNode
}

interface UserData {
    user_id: number
    username: string
    role: string
    status: string
    officer_id: number
    department_name: string
    address: string
    phone_number: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [notifications] = useState(1)
    const [showLoading, setShowLoading] = useState(false)
    const [userData, setUserData] = useState<UserData | null>(null)

    const navItems = [
        { id: "dashboard", label: "Assigned Issues", icon: Home, path: "/home" },
    ]

    // Get user data from localStorage on component mount
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData')
        if (storedUserData) {
            try {
                const parsedData = JSON.parse(storedUserData)
                setUserData(parsedData)
                console.log('User data loaded:', parsedData) // Debug log
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error)
            }
        }
    }, [])

    // Generate initials from username
    const getInitials = (name: string) => {
        if (!name || name.trim() === '') return 'AD'

        return name
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
    }

    const handleSignOut = () => {
        setShowLoading(true)
        setTimeout(() => {
            // Clear user data from localStorage on sign out
            localStorage.removeItem('userData')
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
                                    <h1 className="text-xl font-bold text-slate-900">
                                        {userData?.role === 'department_officer' ? 'Department Officer' : 'Officer'}
                                    </h1>
                                    <p className="text-xs text-slate-600">
                                        {userData?.department_name || 'Community Management Portal'}
                                    </p>
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
                                                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                                                    {userData?.username ? getInitials(userData.username) : 'AD'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="hidden md:block text-slate-700 font-medium">
                                                {userData?.username || 'Officer'}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        {userData && (
                                            <>
                                                <div className="px-3 py-2 border-b">
                                                    <p className="font-medium text-sm">{userData.username}</p>
                                                    <p className="text-xs text-slate-500 capitalize">
                                                        {userData.role.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {userData.department_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{userData.address}</p>
                                                    <p className="text-xs text-slate-500">{userData.phone_number}</p>
                                                </div>
                                            </>
                                        )}
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
                <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
            </div>
        </>
    )
}