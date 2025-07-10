"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Users, MapPin, Shield } from "lucide-react"
import LoadingScreen from "../../../components/loading-screen"
import Link from "next/link"
import { useSignInMutation } from "@/services/users"

interface FormErrors {
  username?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showLoginLoading, setShowLoginLoading] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  // RTK Query mutation hook
  const [signIn, { isLoading }] = useSignInMutation()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Handle admin login (keep the existing logic for admin)
      if (isAdminLogin) {
        if (formData.username === "admin" && formData.password === "admin1234") {
          console.log("Admin login successful")
          setShowLoginLoading(true)
          setTimeout(() => {
            router.push("/admin/dashboard")
          }, 2500)
        } else {
          setErrors({ general: "Invalid admin credentials. Use: admin / admin1234" })
          return
        }
      } else {
        // Handle regular user login with API call
        const response = await signIn({
          username: formData.username,
          password: formData.password,
        }).unwrap()

        console.log("User login successful:", response)

        // Store user data in localStorage or context/state management
        localStorage.setItem('user', JSON.stringify(response.user))
        localStorage.setItem('isAuthenticated', 'true')

        setShowLoginLoading(true)
        setTimeout(() => {
          // Route based on user role
          if (response.user.role === "urban_councilor") {
            router.push("/admin/dashboard")
          } else {
            router.push("/user/feed")
          }
        }, 2500)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle different types of errors
      if (error?.data?.message) {
        setErrors({ general: error.data.message })
      } else if (error?.message) {
        setErrors({ general: error.message })
      } else {
        setErrors({ general: "Login failed. Please check your credentials and try again." })
      }
    }
  }

  return (
    <>
      <LoadingScreen isVisible={showLoginLoading} type="login" onComplete={() => setShowLoginLoading(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-600 p-3 rounded-full">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Makola Community</h1>
              <p className="text-slate-600">Issue Reporting Platform</p>
            </Link>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center text-slate-900">
                {isAdminLogin ? (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Admin Login
                  </div>
                ) : (
                  "Welcome Back"
                )}
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{errors.general}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className={`h-11 ${errors.username ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                  {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`h-11 pr-10 ${errors.password ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Admin Login Toggle */}
              <div className="text-center pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdminLogin(!isAdminLogin)
                    setFormData({ username: "", password: "" })
                    setErrors({})
                  }}
                  className="w-full mb-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  disabled={isLoading}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {isAdminLogin ? "Switch to User Login" : "Admin Login"}
                </Button>

                {isAdminLogin && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-emerald-700 font-medium">Admin Login</p>
                    <p className="text-xs text-emerald-600">Username: admin | Password: admin1234</p>
                  </div>
                )}
              </div>

              {/* Register Link */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-slate-600">
                  Don&#39;t have an account?
                  <Link
                    href="/auth/register"
                    className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Users className="h-4 w-4" />
              <span>Building stronger communities together</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}