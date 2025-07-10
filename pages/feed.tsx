"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import IssuePost from "../components/issue-post"
import { Filter, CheckCircle, Clock, AlertTriangle, ArrowUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Feed() {
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  const mockIssues = [
    {
      id: "1",
      author: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Broken Street Light on Main Road",
      description:
        "The street light near the bus stop has been broken for over a week. It's creating safety concerns for pedestrians, especially during evening hours. The area becomes very dark and unsafe.",
      image: "/placeholder.svg?height=300&width=500",
      location: "Main Road, Makola",
      timestamp: "2 hours ago",
      priority: "high" as const,
      status: "open" as const,
      likes: 15,
      upvotes: 28,
      comments: [
        {
          id: "1",
          author: "Mike Chen",
          avatar: "/placeholder.svg?height=32&width=32",
          content: "I've noticed this too. Very dangerous at night!",
          timestamp: "1 hour ago",
        },
      ],
      isLiked: false,
      isUpvoted: true,
    },
    {
      id: "2",
      author: "David Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Pothole on School Lane",
      description:
        "Large pothole causing damage to vehicles. Multiple cars have had tire damage. Needs immediate attention as it's on the route to the primary school.",
      location: "School Lane, Makola",
      timestamp: "5 hours ago",
      priority: "critical" as const,
      status: "in-progress" as const,
      likes: 23,
      upvotes: 45,
      comments: [
        {
          id: "1",
          author: "Lisa Brown",
          avatar: "/placeholder.svg?height=32&width=32",
          content: "My car got damaged yesterday because of this!",
          timestamp: "3 hours ago",
        },
        {
          id: "2",
          author: "Admin",
          avatar: "/placeholder.svg?height=32&width=32",
          content: "We've forwarded this to the road maintenance team. Expected fix within 48 hours.",
          timestamp: "2 hours ago",
        },
      ],
      isLiked: true,
      isUpvoted: true,
    },
    {
      id: "3",
      author: "Emma Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Garbage Collection Missed",
      description:
        "Our area hasn't had garbage collection for 3 days. The bins are overflowing and it's becoming a health hazard.",
      location: "Residential Area B, Makola",
      timestamp: "1 day ago",
      priority: "medium" as const,
      status: "resolved" as const,
      likes: 8,
      upvotes: 12,
      comments: [],
      isLiked: false,
      isUpvoted: false,
    },
  ]

  const stats = [
    { label: "Total Issues", value: "156", icon: AlertTriangle, color: "text-slate-600" },
    { label: "In Progress", value: "23", icon: Clock, color: "text-blue-600" },
    { label: "Resolved", value: "89", icon: CheckCircle, color: "text-green-600" },
    { label: "Total Upvotes", value: "342", icon: ArrowUp, color: "text-emerald-600" },
  ]

  const filteredIssues = mockIssues.filter((issue) => {
    if (filter === "all") return true
    return issue.status === filter
  })

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === "upvotes") {
      return b.upvotes - a.upvotes
    } else if (sortBy === "priority") {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return 0 // recent (default order)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Filter className="h-5 w-5" />
              Community Issues Feed
            </CardTitle>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="upvotes">Most Upvoted</SelectItem>
                <SelectItem value="priority">Highest Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-4 bg-slate-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                All Issues
              </TabsTrigger>
              <TabsTrigger value="open" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Open
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Resolved
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sortedIssues.length > 0 ? (
          sortedIssues.map((issue) => <IssuePost key={issue.id} {...issue} />)
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Issues Found</h3>
              <p className="text-slate-600">No issues match the current filter. Try selecting a different status.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
