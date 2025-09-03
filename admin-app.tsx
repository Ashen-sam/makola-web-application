"use client"

import { useEffect, useState } from "react"
import AdminDashboard from "./app/(admin)/dashboard/page"
import AdminFeedPage from "./app/(admin)/issueList/page"
import AdminSettings from "./app/(admin)/settings/page"
import AdminUsers from "./app/(admin)/users/page"
import AdminLayout from "./components/admin-layout"
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
        return <AdminFeedPage />
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
