"use client"

import { useEffect, useState } from "react"
import AnimatedLogo from "./animated-logo"

interface LoadingScreenProps {
  isVisible: boolean
  type: "refresh" | "login" | "logout" | "route-change"
  onComplete: () => void
}

export default function LoadingScreen({ isVisible, type, onComplete }: LoadingScreenProps) {
  const [showScreen, setShowScreen] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShowScreen(true)
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setShowScreen(false)
        onComplete()
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!showScreen) return null

  const getLoadingText = () => {
    switch (type) {
      case "login":
        return "Welcome to Makola Community!"
      case "logout":
        return "Thank you for using Makola Community"
      case "refresh":
        return "Loading Makola Community..."
      default:
        return "Loading..."
    }
  }

  const getSubText = () => {
    switch (type) {
      case "login":
        return "Setting up your dashboard..."
      case "logout":
        return "Signing you out safely..."
      case "refresh":
        return "Refreshing your data..."
      default:
        return ""
    }
  }

  return (
    <div
      className={`
      fixed inset-0 z-50 flex items-center justify-center
      bg-gradient-to-br from-slate-50 to-slate-100
      transition-opacity duration-500
      ${showScreen ? "opacity-100" : "opacity-0"}
    `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23059669' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main content */}
      <div className="text-center space-y-6 relative z-10">
        {/* Animated Logo */}
        <div className="flex justify-center">
          <AnimatedLogo trigger={type} size="large" showText={false} onAnimationComplete={() => { }} />
        </div>

        {/* Loading text */}
        <div className="space-y-2 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-900">{getLoadingText()}</h2>
          <p className="text-slate-600">{getSubText()}</p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-200"></div>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  )
}
