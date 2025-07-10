"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Menu, X } from "lucide-react"

interface LandingLayoutProps {
  children: React.ReactNode
  onLoginClick: () => void
}

export default function LandingLayout({ children, onLoginClick }: LandingLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("home")}
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-slate-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Contact Us
              </button>
              <Button
                onClick={() => scrollToSection("try-now")}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Try Now
              </Button>
              <Button onClick={onLoginClick} className="bg-emerald-600 hover:bg-emerald-700">
                Login
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-slate-200">
              <nav className="flex flex-col gap-4 pt-4">
                <button
                  onClick={() => scrollToSection("home")}
                  className="text-left text-slate-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-left text-slate-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-left text-slate-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  Contact Us
                </button>
                <Button
                  onClick={() => scrollToSection("try-now")}
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Try Now
                </Button>
                <Button onClick={onLoginClick} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Login
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Makola Community</h3>
                  <p className="text-xs text-slate-400">Issue Reporting Platform</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Building stronger communities through collaborative issue reporting and resolution.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Quick Links</h4>
              <div className="space-y-2">
                <button
                  onClick={() => scrollToSection("home")}
                  className="block text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="block text-slate-400 hover:text-white transition-colors text-sm"
                >
                  About Us
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="block text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Contact
                </button>
                <button
                  onClick={onLoginClick}
                  className="block text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Login
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Services</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Issue Reporting</p>
                <p>Community Engagement</p>
                <p>Progress Tracking</p>
                <p>Analytics & Insights</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Contact Info</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>📧 info@makola.community</p>
                <p>📞 +94 11 234 5678</p>
                <p>📍 Makola, Colombo, Sri Lanka</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2024 Makola Community Platform. All rights reserved. Built with ❤️ for the community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
