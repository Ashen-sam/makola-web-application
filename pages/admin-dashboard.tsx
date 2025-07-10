"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Users, AlertTriangle, CheckCircle, Clock, TrendingUp, Eye, UserPlus, Settings, Calendar } from "lucide-react"

export default function AdminDashboard() {
  // Admin-specific data
  const adminStats = {
    totalUsers: 1247,
    newUsersToday: 12,
    totalIssues: 339,
    pendingReview: 23,
    resolvedToday: 8,
    activeUsers: 89,
  }

  // Recent activity data
  const recentActivity = [
    { time: "2 min ago", action: "New issue reported", user: "Sarah Johnson", type: "issue" },
    { time: "5 min ago", action: "Issue marked as resolved", user: "Admin", type: "resolved" },
    { time: "12 min ago", action: "New user registered", user: "Mike Chen", type: "user" },
    { time: "18 min ago", action: "Issue priority updated", user: "Admin", type: "update" },
    { time: "25 min ago", action: "Comment added to issue", user: "Emma Davis", type: "comment" },
  ]

  // Issues by status for admin view
  const issueStatusData = [
    { status: "Open", count: 45, color: "#f59e0b" },
    { status: "In Review", count: 23, color: "#3b82f6" },
    { status: "In Progress", count: 51, color: "#8b5cf6" },
    { status: "Resolved", count: 220, color: "#10b981" },
  ]

  // Priority issues that need admin attention
  const priorityIssues = [
    {
      id: "ISS-001",
      title: "Major water leak on Main Road",
      reporter: "David Wilson",
      priority: "critical",
      timeAgo: "2 hours ago",
      area: "Main Road",
    },
    {
      id: "ISS-002",
      title: "Street light broken near school",
      reporter: "Sarah Johnson",
      priority: "high",
      timeAgo: "4 hours ago",
      area: "School Lane",
    },
    {
      id: "ISS-003",
      title: "Pothole causing vehicle damage",
      reporter: "Mike Chen",
      priority: "high",
      timeAgo: "6 hours ago",
      area: "Market Street",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "issue":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "user":
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case "update":
        return <Settings className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-slate-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage community issues and users</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-900">{adminStats.totalUsers}</p>
            <p className="text-xs text-slate-600">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <UserPlus className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-600">+{adminStats.newUsersToday}</p>
            <p className="text-xs text-slate-600">New Today</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-900">{adminStats.totalIssues}</p>
            <p className="text-xs text-slate-600">Total Issues</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-orange-600">{adminStats.pendingReview}</p>
            <p className="text-xs text-slate-600">Need Review</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-emerald-600">+{adminStats.resolvedToday}</p>
            <p className="text-xs text-slate-600">Resolved Today</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-emerald-600">{adminStats.activeUsers}</p>
            <p className="text-xs text-slate-600">Active Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues Overview Chart */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Issues Overview</CardTitle>
            <p className="text-sm text-slate-600">Current status of all community issues</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Recent Activity</CardTitle>
            <p className="text-sm text-slate-600">Latest community actions</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50">
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                  <p className="text-xs text-slate-600">by {activity.user}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Priority Issues - Admin Action Required */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900">Priority Issues - Action Required</CardTitle>
              <p className="text-sm text-slate-600">High priority issues that need immediate admin attention</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">View All Issues</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priorityIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {issue.id}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(issue.priority)}`}>
                      {issue.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{issue.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>Reported by: {issue.reporter}</span>
                    <span>Area: {issue.area}</span>
                    <span>{issue.timeAgo}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-emerald-900">Review Issues</p>
            <p className="text-sm text-emerald-700">{adminStats.pendingReview} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-blue-900">Manage Users</p>
            <p className="text-sm text-blue-700">{adminStats.totalUsers} total users</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-purple-900">System Settings</p>
            <p className="text-sm text-purple-700">Configure platform</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-orange-900">View Reports</p>
            <p className="text-sm text-orange-700">Analytics & insights</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
