"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Users, MapPin, Shield, MessageSquare, TrendingUp, CheckCircle, Clock, Target } from "lucide-react"
import LoadingScreen from "../../../components/loading-screen"
import Link from "next/link"
import { useSignInMutation } from "@/services/users"

interface FormErrors {
  username?: string
  password?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showLoginLoading, setShowLoginLoading] = useState(false)

  // RTK Query mutation hook
  const [signIn, { isLoading }] = useSignInMutation()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if fields are empty
    if (!formData.username.trim() || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      // Check for hardcoded admin credentials first
      if (formData.username === "admin" && formData.password === "admin1234") {
        console.log("Admin login successful")
        toast.success("Admin login successful! Redirecting...")
        setShowLoginLoading(true)
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 2500)
        return
      }

      // Handle regular user login with API call
      const response = await signIn({
        username: formData.username,
        password: formData.password,
      }).unwrap()

      console.log("User login successful:", response)

      // Store user data in localStorage or context/state management
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('isAuthenticated', 'true')

      toast.success("Login successful! Welcome back!")
      setShowLoginLoading(true)
      setTimeout(() => {
        // Route based on user role
        if (response.user.role === "urban_councilor") {
          router.push("/admin/dashboard")
        } else {
          router.push("/user/feed")
        }
      }, 2500)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle different types of errors with toast
      if (error?.data?.message) {
        toast.error(error.data.message)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error("Login failed. Please check your credentials and try again.")
      }
    }
  }

  return (
    <>
      <LoadingScreen isVisible={showLoginLoading} type="login" onComplete={() => setShowLoginLoading(false)} />

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
                  Building Stronger Communities Together
                </h2>
                <p className="text-emerald-100 text-lg leading-relaxed">
                  Join thousands of residents making a difference in their neighborhoods.
                  Report issues, track progress, and collaborate with local authorities.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Easy Reporting</h3>
                    <p className="text-emerald-100 text-sm">Submit community issues with photos and location details in seconds</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Track Progress</h3>
                    <p className="text-emerald-100 text-sm">Monitor the status of your reports and see real-time updates</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Secure Platform</h3>
                    <p className="text-emerald-100 text-sm">Your data is protected with enterprise-grade security</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">24/7 Availability</h3>
                    <p className="text-emerald-100 text-sm">Report issues anytime, day or night - we never close</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Priority System</h3>
                    <p className="text-emerald-100 text-sm">Critical issues get fast-tracked for immediate attention</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2,500+</div>
                <div className="text-emerald-100 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1,200+</div>
                <div className="text-emerald-100 text-sm">Issues Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-emerald-100 text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
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
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-700 font-medium">
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

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
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

                {/* Register Link */}
                <div className="text-center pt-6 border-t border-slate-200">
                  <p className="text-slate-600">
                    Don&#39;t have an account?
                    <Link
                      href="/auth/register"
                      className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors hover:underline"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>

                {/* Trust Indicators */}
                <div className="pt-4">
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    <span>Secure & encrypted connection</span>
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
    </>
  )
}