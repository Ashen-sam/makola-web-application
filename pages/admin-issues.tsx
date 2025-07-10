"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Search, Eye, CheckCircle, Clock, MapPin, User, Calendar, MessageCircle } from "lucide-react"
import Image from "next/image"

export default function AdminIssues() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Mock issues data for admin
  const issues = [
    {
      id: "ISS-001",
      title: "Major water leak on Main Road",
      description: "Large water leak causing flooding and traffic disruption",
      reporter: "David Wilson",
      reporterAvatar: "/placeholder.svg?height=32&width=32",
      area: "Main Road",
      category: "Water & Drainage",
      priority: "critical",
      status: "open",
      reportedDate: "2024-01-15",
      reportedTime: "14:30",
      upvotes: 45,
      comments: 12,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "ISS-002",
      title: "Street light broken near school",
      description: "Street light has been non-functional for 3 days, creating safety concerns",
      reporter: "Sarah Johnson",
      reporterAvatar: "/placeholder.svg?height=32&width=32",
      area: "School Lane",
      category: "Street Lighting",
      priority: "high",
      status: "in-progress",
      reportedDate: "2024-01-14",
      reportedTime: "09:15",
      upvotes: 28,
      comments: 8,
    },
    {
      id: "ISS-003",
      title: "Pothole causing vehicle damage",
      description: "Deep pothole on main route causing tire damage to multiple vehicles",
      reporter: "Mike Chen",
      reporterAvatar: "/placeholder.svg?height=32&width=32",
      area: "Market Street",
      category: "Road & Transportation",
      priority: "high",
      status: "in-review",
      reportedDate: "2024-01-13",
      reportedTime: "16:45",
      upvotes: 67,
      comments: 15,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "ISS-004",
      title: "Garbage collection missed for 3 days",
      description: "Regular garbage collection has been missed, causing hygiene issues",
      reporter: "Emma Davis",
      reporterAvatar: "/placeholder.svg?height=32&width=32",
      area: "Residential Area B",
      category: "Waste Management",
      priority: "medium",
      status: "resolved",
      reportedDate: "2024-01-10",
      reportedTime: "11:20",
      upvotes: 23,
      comments: 6,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "in-review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-3 w-3" />
      case "in-review":
        return <Eye className="h-3 w-3" />
      case "in-progress":
        return <Clock className="h-3 w-3" />
      case "resolved":
        return <CheckCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleStatusChange = (issueId: string, newStatus: string) => {
    console.log(`Changing issue ${issueId} status to ${newStatus}`)
    // Here you would update the issue status in your backend
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.area.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Issues</h1>
          <p className="text-slate-600">Review, update, and resolve community issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {issues.filter((i) => i.status === "in-review").length} Need Review
          </Badge>
          <Badge variant="outline" className="text-red-600 border-red-200">
            {issues.filter((i) => i.priority === "critical").length} Critical
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search issues by title or area..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => (
          <Card key={issue.id} className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Issue Details */}
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {issue.id}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(issue.priority)}`}>
                          {issue.priority.toUpperCase()}
                        </Badge>
                        <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)}
                          {issue.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{issue.title}</h3>
                      <p className="text-slate-700">{issue.description}</p>
                    </div>
                  </div>

                  {/* Issue Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Reporter:</span>
                      <span className="font-medium text-slate-900">{issue.reporter}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Area:</span>
                      <span className="font-medium text-slate-900">{issue.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Date:</span>
                      <span className="font-medium text-slate-900">{issue.reportedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Engagement:</span>
                      <span className="font-medium text-slate-900">
                        {issue.upvotes} votes, {issue.comments} comments
                      </span>
                    </div>
                  </div>

                  {/* Image if available */}
                  {issue.image && (
                    <div className="mt-4">
                      <Image
                        src={issue.image || "/placeholder.svg"}
                        alt="Issue"
                        className="w-full max-w-md h-48 object-cover rounded-lg"
                        width={600}
                        height={500}
                      />
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                <div className="lg:w-64 space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-slate-900">Admin Actions</h4>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Change Status:</label>
                      <Select value={issue.status} onValueChange={(value) => handleStatusChange(issue.id, value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-review">In Review</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        View Full Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Admin Note
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      >
                        Archive Issue
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Issues Found</h3>
            <p className="text-slate-600">No issues match your current filters. Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
