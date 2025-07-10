"use client"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"

interface AnimatedLogoProps {
  trigger?: "refresh" | "login" | "logout" | "none"
  onAnimationComplete?: () => void
  size?: "small" | "medium" | "large"
  showText?: boolean
}

export default function AnimatedLogo({
  trigger = "none",
  onAnimationComplete,
  size = "medium",
  showText = true,
}: AnimatedLogoProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationType, setAnimationType] = useState<string>("")

  useEffect(() => {
    if (trigger !== "none") {
      setIsAnimating(true)

      // Set animation type based on trigger
      switch (trigger) {
        case "refresh":
          setAnimationType("refresh-spin")
          break
        case "login":
          setAnimationType("login-bounce")
          break
        case "logout":
          setAnimationType("logout-fade")
          break
      }

      // Reset animation after completion
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setAnimationType("")
        onAnimationComplete?.()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [trigger, onAnimationComplete])

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          container: "h-8 w-8",
          icon: "h-5 w-5",
          text: "text-sm",
          title: "text-base",
        }
      case "large":
        return {
          container: "h-20 w-20",
          icon: "h-12 w-12",
          text: "text-xl",
          title: "text-3xl",
        }
      default: // medium
        return {
          container: "h-12 w-12",
          icon: "h-7 w-7",
          text: "text-base",
          title: "text-xl",
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div className="flex items-center gap-3">
      <div
        className={`
          ${sizeClasses.container} 
          bg-emerald-600 rounded-lg flex items-center justify-center relative overflow-hidden
          ${isAnimating ? `animate-${animationType}` : ""}
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Background pulse effect */}
        {isAnimating && <div className="absolute inset-0 bg-emerald-400 rounded-lg animate-ping opacity-75"></div>}

        {/* Main icon */}
        <MapPin
          className={`
            ${sizeClasses.icon} 
            text-white relative z-10
            ${isAnimating && animationType === "refresh-spin" ? "animate-spin" : ""}
            ${isAnimating && animationType === "login-bounce" ? "animate-bounce" : ""}
            ${isAnimating && animationType === "logout-fade" ? "animate-pulse" : ""}
          `}
        />

        {/* Sparkle effects for login */}
        {isAnimating && animationType === "login-bounce" && (
          <>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping delay-300"></div>
            <div className="absolute top-1 -left-2 w-1 h-1 bg-yellow-500 rounded-full animate-ping delay-500"></div>
          </>
        )}
      </div>

      {showText && (
        <div className={`${isAnimating ? "animate-fade-in-up" : ""}`}>
          <h1 className={`${sizeClasses.title} font-bold text-slate-900`}>Makola Community</h1>
          <p className={`${sizeClasses.text} text-slate-600`}>Issue Reporting Platform</p>
        </div>
      )}

      <style jsx>{`
        @keyframes refresh-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes login-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-10px) scale(1.05); }
          60% { transform: translateY(-5px) scale(1.02); }
        }
        
        @keyframes logout-fade {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-refresh-spin {
          animation: refresh-spin 2s ease-in-out;
        }
        
        .animate-login-bounce {
          animation: login-bounce 2s ease-in-out;
        }
        
        .animate-logout-fade {
          animation: logout-fade 2s ease-in-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out 0.5s both;
        }
      `}</style>
    </div>
  )
}
