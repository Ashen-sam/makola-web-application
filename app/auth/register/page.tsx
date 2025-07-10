"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Users, MapPin } from "lucide-react"
import Link from "next/link"

interface FormErrors {
  username?: string
  fullName?: string
  password?: string
  confirmPassword?: string
  phoneNumber?: string
  nic?: string
  general?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

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

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }

    if (!formData.nic.trim()) {
      newErrors.nic = "NIC is required"
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

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Registration successful:", formData)
      alert("Account created successfully! Please sign in.")
      router.push("/auth/login")
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
            <CardTitle className="text-2xl font-semibold text-center text-slate-900">Create Account</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Join the community to report and track local issues
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
                />
                {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
              </div>

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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-slate-600">
                Already have an account?
                <Link
                  href="/auth/login"
                  className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Sign In
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
  )
}
