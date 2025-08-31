"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Users, MapPin, UserPlus, Shield, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSignUpMutation } from "@/services/users"

interface FormErrors {
  name?: string
  username?: string
  password?: string
  confirmPassword?: string
  address?: string
  phone_number?: string
  nic?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [signUp, { isLoading }] = useSignUpMutation()

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone_number: "",
    nic: "",
  })

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
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

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required"
    } else if (!/^\d{10}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      newErrors.phone_number = "Please enter a valid 10-digit phone number"
    }

    if (!formData.nic.trim()) {
      newErrors.nic = "NIC is required"
    } else if (!/^(\d{9}[VvXx]|\d{12})$/.test(formData.nic.replace(/\s/g, ''))) {
      newErrors.nic = "Please enter a valid NIC number"
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
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      // Prepare data for API call (exclude confirmPassword)
      const { ...apiData } = formData

      const response = await signUp(apiData).unwrap()

      // Handle success response
      console.log("Registration successful:", response)
      toast.success("Account created successfully! Redirecting to login...")
      setTimeout(() => {
        router.push("/auth/login")
      }, 1500)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Handle error response
      console.error("Registration failed:", error)

      let errorMessage = "An error occurred. Please try again."

      // Handle different error response structures
      if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.status) {
        // Handle HTTP status codes
        switch (error.status) {
          case 400:
            errorMessage = "Invalid data provided. Please check your inputs."
            break
          case 409:
            errorMessage = "Username or NIC already exists. Please try different values."
            break
          case 500:
            errorMessage = "Server error. Please try again later."
            break
          default:
            errorMessage = `Error: ${error.status}. Please try again.`
        }
      }

      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Side - Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }} />
        </div>

        <div className="relative z-10">
          {/* Logo & Brand */}
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Makola Community</h1>
                <p className="text-emerald-100 text-sm">Issue Reporting Platform</p>
              </div>
            </div>
          </Link>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                Join Our Growing Community
              </h2>
              <p className="text-emerald-100 text-lg leading-relaxed">
                Become part of a movement that transforms neighborhoods. Your voice matters,
                and together we can create positive change in our community.
              </p>
            </div>

            {/* Registration Benefits */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Quick Registration</h3>
                  <p className="text-emerald-100 text-sm">Simple one-time setup to get you started in minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Instant Access</h3>
                  <p className="text-emerald-100 text-sm">Start reporting issues and tracking progress immediately</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Privacy Protected</h3>
                  <p className="text-emerald-100 text-sm">Your personal information is secure and never shared</p>
                </div>
              </div>
            </div>

            {/* Process Steps */}
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-white font-semibold mb-4">How it works:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs text-white font-semibold">1</div>
                  <span className="text-emerald-100 text-sm">Create your account with basic information</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs text-white font-semibold">2</div>
                  <span className="text-emerald-100 text-sm">Verify your account via email</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs text-white font-semibold">3</div>
                  <span className="text-emerald-100 text-sm">Start reporting and tracking community issues</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Community Info */}
        <div className="relative z-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">Join 2,500+ residents</div>
            <div className="text-emerald-100 text-sm">already making a difference</div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Mobile Header - Only visible on small screens */}
          <div className="lg:hidden text-center mb-8">
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

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Create Account
              </CardTitle>
              <CardDescription className="text-slate-600">
                Join the community to report and track local issues
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Name and Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={`h-12 ${errors.name ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="" className="text-slate-700 font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className={`h-12 ${errors.username ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                    {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
                  </div>
                </div>

                {/* Row 2: Address (full width) */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-700 font-medium">
                    Address
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`h-12 ${errors.address ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder="Enter your address"
                    disabled={isLoading}
                  />
                  {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                </div>

                {/* Row 3: Phone and NIC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-slate-700 font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange("phone_number", e.target.value)}
                      className={`h-12 ${errors.phone_number ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                      placeholder="Enter your phone number"
                      disabled={isLoading}
                    />
                    {errors.phone_number && <p className="text-sm text-red-600">{errors.phone_number}</p>}
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
                      className={`h-12 ${errors.nic ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                      placeholder="Enter your NIC number"
                      disabled={isLoading}
                    />
                    {errors.nic && <p className="text-sm text-red-600">{errors.nic}</p>}
                  </div>
                </div>

                {/* Row 4: Password and Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className={`h-12 pr-12 ${errors.password ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                        placeholder="Enter your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                        className={`h-12 pr-12 ${errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} focus:ring-2 focus:ring-emerald-500/20`}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3 ">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="text-center pt-6 border-t border-slate-200">
                <p className="text-slate-600">
                  Already have an account?
                  <Link
                    href="/auth/login"
                    className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  <span>Secure registration & data protection</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Users className="h-4 w-4" />
              <span>Building stronger communities together</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}