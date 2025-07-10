"use client"

import { useState, useEffect } from "react"
import AdminLayout from "./components/admin-layout"
import AdminDashboard from "./pages/admin-dashboard"
import AdminIssues from "./pages/admin-issues"
import AdminUsers from "./pages/admin-users"
import AdminSettings from "./pages/admin-settings"
import LoadingScreen from "./components/loading-screen"

export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [showRefreshLoading, setShowRefreshLoading] = useState(true)

  // Handle page refresh animation
  useEffect(() => {
    console.log("Admin App initialized")
    const timer = setTimeout(() => {
      setShowRefreshLoading(false)
    }, 1500) // Shorter loading for better UX
    return () => clearTimeout(timer)
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />
      case "issues":
        return <AdminIssues />
      case "users":
        return <AdminUsers />
      case "settings":
        return <AdminSettings />
      default:
        return <AdminDashboard />
    }
  }

  // Show refresh loading screen on initial load
  if (showRefreshLoading) {
    return <LoadingScreen isVisible={true} type="refresh" onComplete={() => setShowRefreshLoading(false)} />
  }

  // Show admin interface
  return (
    <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  )
}
