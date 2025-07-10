"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Users, MapPin, Shield } from "lucide-react"
import LoadingScreen from "./components/loading-screen"

interface FormErrors {
  username?: string
  fullName?: string
  password?: string
  confirmPassword?: string
  phoneNumber?: string
  nic?: string
  general?: string
}

interface AuthPageProps {
  onLogin: (role?: string) => void
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginLoading, setShowLoginLoading] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  // Form data states
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    nic: "",
  })

  const validateForm = () => {
    const newErrors: FormErrors = {}

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (isSignUp) {
      // Full name validation
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required"
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters"
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }

      // Phone number validation
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required"
      } else if (!/^[0-9+\-\s()]+$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Please enter a valid phone number"
      } else if (formData.phoneNumber.replace(/[^0-9]/g, "").length < 10) {
        newErrors.phoneNumber = "Phone number must be at least 10 digits"
      }

      // NIC validation
      if (!formData.nic.trim()) {
        newErrors.nic = "NIC is required"
      } else if (!/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(formData.nic)) {
        newErrors.nic = "Please enter a valid NIC (9 digits + V/X or 12 digits)"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (isAdminLogin) {
        // Check admin credentials
        if (formData.username === "admin" && formData.password === "admin1234") {
          console.log("Admin login successful - redirecting to admin dashboard")
          setShowLoginLoading(true)
          setTimeout(() => {
            onLogin("admin") // Pass admin role
          }, 2500)
        } else {
          setErrors({ general: "Invalid admin credentials. Use: admin / admin1234" })
          setIsLoading(false)
          return
        }
      } else {
        if (isSignUp) {
          console.log("Sign up data:", {
            username: formData.username,
            fullName: formData.fullName,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            nic: formData.nic,
          })
          alert("Account created successfully! Please sign in.")
          setIsSignUp(false)
          setFormData({
            username: "",
            fullName: "",
            password: "",
            confirmPassword: "",
            phoneNumber: "",
            nic: "",
          })
          setIsLoading(false)
          return
        } else {
          console.log("User login successful - redirecting to user dashboard")
          // Show login loading screen
          setShowLoginLoading(true)
          setTimeout(() => {
            onLogin("user") // Pass user role
          }, 2500)
        }
      }
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." })
      setIsLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setErrors({})
    setFormData({
      username: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      nic: "",
    })
  }

  return (
    <>
      <LoadingScreen isVisible={showLoginLoading} type="login" onComplete={() => setShowLoginLoading(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header - Static Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-600 p-3 rounded-full">
                <MapPin className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Makola Community</h1>
            <p className="text-slate-600">Issue Reporting Platform</p>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center text-slate-900">
                {isAdminLogin ? (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Admin Login
                  </div>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Welcome Back"
                )}
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                {isSignUp
                  ? "Join the community to report and track local issues"
                  : "Sign in to your account to continue"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{errors.general}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
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
                  />
                  {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
                </div>

                {/* Full Name - Sign Up Only */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700 font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={`h-11 ${errors.fullName ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                  </div>
                )}

                {/* Password */}
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* Confirm Password - Sign Up Only */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={`h-11 pr-10 ${errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Phone Number - Sign Up Only */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-slate-700 font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className={`h-11 ${errors.phoneNumber ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phoneNumber && <p className="text-sm text-red-600">{errors.phoneNumber}</p>}
                  </div>
                )}

                {/* NIC - Sign Up Only */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="nic" className="text-slate-700 font-medium">
                      NIC Number
                    </Label>
                    <Input
                      id="nic"
                      type="text"
                      value={formData.nic}
                      onChange={(e) => handleInputChange("nic", e.target.value.toUpperCase())}
                      className={`h-11 ${errors.nic ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                      placeholder="Enter your NIC number"
                    />
                    {errors.nic && <p className="text-sm text-red-600">{errors.nic}</p>}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? "Creating Account..." : "Signing In..."}
                    </div>
                  ) : isSignUp ? (
                    "Create Account"
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
                    setFormData({
                      username: "",
                      fullName: "",
                      password: "",
                      confirmPassword: "",
                      phoneNumber: "",
                      nic: "",
                    })
                    setErrors({})
                  }}
                  className="w-full mb-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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

              {/* Toggle Auth Mode */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-slate-600">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
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
