"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  MapPin,
  TrendingUp,
  MessageCircle,
  AlertTriangle,
} from "lucide-react"

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock users data
  const users = [
    {
      id: "USR-001",
      username: "johndoe",
      fullName: "John Doe",
      email: "john.doe@email.com",
      phone: "+94 77 123 4567",
      location: "Main Road, Makola",
      joinDate: "2024-01-10",
      status: "active",
      role: "user",
      issuesReported: 12,
      issuesResolved: 8,
      commentsPosted: 45,
      lastActive: "2 hours ago",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "USR-002",
      username: "sarahjohnson",
      fullName: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+94 77 234 5678",
      location: "School Lane, Makola",
      joinDate: "2024-01-08",
      status: "active",
      role: "user",
      issuesReported: 8,
      issuesResolved: 12,
      commentsPosted: 32,
      lastActive: "1 hour ago",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "USR-003",
      username: "mikechenAdmin",
      fullName: "Mike Chen",
      email: "mike.chen@admin.makola.com",
      phone: "+94 77 345 6789",
      location: "Market Street, Makola",
      joinDate: "2023-12-15",
      status: "active",
      role: "admin",
      issuesReported: 3,
      issuesResolved: 45,
      commentsPosted: 89,
      lastActive: "30 minutes ago",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "USR-004",
      username: "emmadavis",
      fullName: "Emma Davis",
      email: "emma.davis@email.com",
      phone: "+94 77 456 7890",
      location: "Residential Area B, Makola",
      joinDate: "2024-01-05",
      status: "suspended",
      role: "user",
      issuesReported: 15,
      issuesResolved: 2,
      commentsPosted: 67,
      lastActive: "3 days ago",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const userStats = {
    totalUsers: 1247,
    activeUsers: 1189,
    suspendedUsers: 58,
    adminUsers: 12,
    newThisWeek: 23,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "moderator":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Performing ${action} on user ${userId}`)
    // Here you would handle the user action
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-600">View and manage community members</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Users className="h-4 w-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-900">{userStats.totalUsers}</p>
            <p className="text-xs text-slate-600">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-600">{userStats.activeUsers}</p>
            <p className="text-xs text-slate-600">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <UserX className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-red-600">{userStats.suspendedUsers}</p>
            <p className="text-xs text-slate-600">Suspended</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-purple-600">{userStats.adminUsers}</p>
            <p className="text-xs text-slate-600">Admins</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-emerald-600">+{userStats.newThisWeek}</p>
            <p className="text-xs text-slate-600">This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{user.fullName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {user.id}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(user.status)}`}>{user.status.toUpperCase()}</Badge>
                        {user.role === "admin" && (
                          <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">
                            Username: <span className="font-medium text-slate-900">@{user.username}</span>
                          </p>
                          <p className="text-slate-600">
                            Email: <span className="font-medium text-slate-900">{user.email}</span>
                          </p>
                          <p className="text-slate-600">
                            Phone: <span className="font-medium text-slate-900">{user.phone}</span>
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">
                              Location: <span className="font-medium text-slate-900">{user.location}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">
                              Joined: <span className="font-medium text-slate-900">{user.joinDate}</span>
                            </span>
                          </div>
                          <p className="text-slate-600">
                            Last Active: <span className="font-medium text-slate-900">{user.lastActive}</span>
                          </p>
                        </div>
                      </div>

                      {/* User Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-600">{user.issuesReported}</span>
                          </div>
                          <p className="text-xs text-slate-600">Issues Reported</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="text-lg font-bold text-green-600">{user.issuesResolved}</span>
                          </div>
                          <p className="text-xs text-slate-600">Issues Resolved</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MessageCircle className="h-4 w-4 text-purple-600" />
                            <span className="text-lg font-bold text-purple-600">{user.commentsPosted}</span>
                          </div>
                          <p className="text-xs text-slate-600">Comments Posted</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="lg:w-64 space-y-3">
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-slate-900">Admin Actions</h4>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleUserAction(user.id, "view-profile")}
                      >
                        View Full Profile
                      </Button>

                      {user.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                          onClick={() => handleUserAction(user.id, "suspend")}
                        >
                          Suspend User
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                          onClick={() => handleUserAction(user.id, "activate")}
                        >
                          Activate User
                        </Button>
                      )}

                      <Button variant="outline" size="sm" onClick={() => handleUserAction(user.id, "send-message")}>
                        Send Message
                      </Button>

                      {user.role !== "admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                          onClick={() => handleUserAction(user.id, "make-admin")}
                        >
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Users Found</h3>
            <p className="text-slate-600">No users match your current search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
