/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
//this is officer home page for managing assigned issues
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    AlertTriangle,
    ArrowUp,
    CheckCircle,
    Clock,
    Filter,
    Loader2,
    MapPin,
    MessageCircle,
    Edit3,
    Eye,
    Calendar,
    User,
    Building2,
    ClipboardCheck
} from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

// Mock data - replace with actual API calls
const mockAssignedIssues = [
    {
        issue_id: 1,
        title: "Broken Street Light on Main Road",
        description: "The street light has been flickering for weeks and now completely stopped working. It's creating safety concerns for pedestrians at night.",
        photo: "/placeholder.svg?height=300&width=400",
        photos: ["/placeholder.svg?height=300&width=400"],
        location: "Main Road, Downtown",
        address: "123 Main Road, Downtown District",
        created_date: "2024-01-15T10:30:00Z",
        priority: "high",
        status: "assigned",
        category: "Infrastructure",
        vote_count: 15,
        comment_count: 8,
        department: "Public Works",
        assigned_officer: "Officer Smith",
        date_observed: "2024-01-14",
        time_observed: "19:30",
        users: {
            username: "john_doe",
        },
        residents: {
            phone_number: "+1234567890",
            address: "456 Oak Street"
        }
    },
    {
        issue_id: 2,
        title: "Pothole on Highway 5",
        description: "Large pothole causing damage to vehicles. Multiple residents have reported car damage.",
        photo: "/placeholder.svg?height=300&width=400",
        photos: ["/placeholder.svg?height=300&width=400"],
        location: "Highway 5, Mile Marker 23",
        address: "Highway 5, Mile Marker 23",
        created_date: "2024-01-16T14:15:00Z",
        priority: "critical",
        status: "in_progress",
        category: "Road Maintenance",
        vote_count: 32,
        comment_count: 12,
        department: "Public Works",
        assigned_officer: "Officer Smith",
        date_observed: "2024-01-15",
        time_observed: "08:00",
        users: {
            username: "mary_johnson",
        },
        residents: {
            phone_number: "+1234567891",
            address: "789 Pine Avenue"
        }
    }
]

export default function OfficerHomePage() {
    const [filter, setFilter] = useState("all")
    const [sortBy, setSortBy] = useState("recent")
    const [selectedIssue, setSelectedIssue] = useState<any>(null)
    const [statusUpdate, setStatusUpdate] = useState("")
    const [newComment, setNewComment] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [page, setPage] = useState(1)
    const limit = 10

    // Mock current officer data - replace with actual auth
    const currentOfficer = {
        officer_id: 1,
        name: "Officer Smith",
        department: "Public Works",
        badge_number: "PW001"
    }

    // Filter issues based on current filter
    const filteredIssues = useMemo(() => {
        let issues = mockAssignedIssues

        if (filter !== "all") {
            issues = issues.filter(issue => issue.status === filter)
        }

        return issues
    }, [filter])

    // Sort issues based on selected sort option
    const sortedIssues = useMemo(() => {
        const issues = [...filteredIssues]

        if (sortBy === "priority") {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
            return issues.sort((a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder])
        } else if (sortBy === "upvotes") {
            return issues.sort((a, b) => b.vote_count - a.vote_count)
        }

        // Default: recent (by created_date)
        return issues.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
    }, [filteredIssues, sortBy])

    // Calculate stats
    const stats = useMemo(() => {
        const totalAssigned = mockAssignedIssues.length
        const inProgressCount = mockAssignedIssues.filter(issue => issue.status === "in_progress").length
        const resolvedCount = mockAssignedIssues.filter(issue => issue.status === "resolved").length
        const pendingCount = mockAssignedIssues.filter(issue => issue.status === "assigned").length

        return [
            { label: "Assigned Issues", value: totalAssigned.toString(), icon: ClipboardCheck, color: "text-blue-600" },
            { label: "In Progress", value: inProgressCount.toString(), icon: Clock, color: "text-yellow-600" },
            { label: "Pending", value: pendingCount.toString(), icon: AlertTriangle, color: "text-orange-600" },
            { label: "Resolved", value: resolvedCount.toString(), icon: CheckCircle, color: "text-green-600" },
        ]
    }, [])

    // Helper functions
    const formatTimestamp = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMs = now.getTime() - date.getTime()
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        const diffInHours = Math.floor(diffInMinutes / 60)
        const diffInDays = Math.floor(diffInHours / 24)

        if (diffInDays > 7) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } else if (diffInDays > 0) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
        } else if (diffInHours > 0) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
        } else if (diffInMinutes > 0) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
        } else {
            return 'Just now'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "low":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "medium":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "high":
                return "bg-orange-100 text-orange-800 border-orange-200"
            case "critical":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "assigned":
                return "bg-slate-100 text-slate-800 border-slate-200"
            case "in_progress":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "resolved":
                return "bg-green-100 text-green-800 border-green-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "assigned":
                return <AlertTriangle className="h-3 w-3" />
            case "in_progress":
                return <Clock className="h-3 w-3" />
            case "resolved":
                return <CheckCircle className="h-3 w-3" />
            default:
                return null
        }
    }

    // Mock API functions - replace with actual API calls
    const updateIssueStatus = async (issueId: number, status: string) => {
        setIsUpdating(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log(`Updating issue ${issueId} to status: ${status}`)
        setIsUpdating(false)
    }

    const addCommentToIssue = async (issueId: number, comment: string) => {
        setIsUpdating(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log(`Adding comment to issue ${issueId}: ${comment}`)
        setNewComment("")
        setIsUpdating(false)
    }

    const handleStatusUpdate = async () => {
        if (selectedIssue && statusUpdate) {
            await updateIssueStatus(selectedIssue.issue_id, statusUpdate)
            setStatusUpdate("")
        }
    }

    const handleAddComment = async () => {
        if (selectedIssue && newComment.trim()) {
            await addCommentToIssue(selectedIssue.issue_id, newComment.trim())
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Officer Header */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                                    {currentOfficer.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{currentOfficer.name}</h1>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Building2 className="h-4 w-4" />
                                    <span>{currentOfficer.department}</span>
                                    <span>•</span>
                                    <span>Badge #{currentOfficer.badge_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats Cards */}
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

            {/* Filter and Sort Controls */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-slate-900">
                            <Filter className="h-5 w-5" />
                            Assigned Issues Management
                        </CardTitle>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="priority">Highest Priority</SelectItem>
                                <SelectItem value="upvotes">Most Upvoted</SelectItem>
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
                            <TabsTrigger value="assigned" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                Pending
                            </TabsTrigger>
                            <TabsTrigger
                                value="in_progress"
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

            {/* Issues List */}
            <div className="space-y-4">
                {sortedIssues.length > 0 ? (
                    <>
                        {sortedIssues.map((issue) => (
                            <Card key={issue.issue_id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                                                <AvatarFallback className="bg-slate-100 text-slate-700">
                                                    {issue.users.username
                                                        .split("_")
                                                        .map((n: string) => n[0])
                                                        .join("")
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-slate-900">@{issue.users.username}</p>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{issue.location}</span>
                                                    <span>•</span>
                                                    <span>{formatTimestamp(issue.created_date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className={`text-xs ${getPriorityColor(issue.priority)}`}>
                                                {issue.priority.toUpperCase()}
                                            </Badge>
                                            <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                                                {getStatusIcon(issue.status)}
                                                {issue.status.replace("_", " ").toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900 mb-2">{issue.title}</h3>
                                        <p className="text-slate-700 text-sm leading-relaxed line-clamp-2">{issue.description}</p>
                                    </div>

                                    {/* Issue Photo */}
                                    {issue.photo && (
                                        <div className="rounded-lg overflow-hidden">
                                            <Image
                                                src={issue.photo}
                                                alt="Issue photo"
                                                width={400}
                                                height={200}
                                                className="w-full h-48 object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Issue Metadata */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Observed: {new Date(issue.date_observed).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>Time: {issue.time_observed}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ArrowUp className="h-3 w-3" />
                                            <span>{issue.vote_count} upvotes</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" />
                                            <span>{issue.comment_count} comments</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-2">
                                            {/* Status Update */}
                                            <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                                                <SelectTrigger className="w-32">
                                                    <SelectValue placeholder="Update Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Button
                                                onClick={handleStatusUpdate}
                                                disabled={!statusUpdate || isUpdating}
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Edit3 className="h-4 w-4 mr-1" />}
                                                Update
                                            </Button>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* View Details Dialog */}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedIssue(issue)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Issue Details</DialogTitle>
                                                    </DialogHeader>

                                                    {selectedIssue && (
                                                        <div className="space-y-6">
                                                            {/* Issue Header */}
                                                            <div>
                                                                <h2 className="text-xl font-semibold mb-2">{selectedIssue.title}</h2>
                                                                <div className="flex gap-2 mb-4">
                                                                    <Badge className={getPriorityColor(selectedIssue.priority)}>
                                                                        {selectedIssue.priority.toUpperCase()}
                                                                    </Badge>
                                                                    <Badge className={getStatusColor(selectedIssue.status)}>
                                                                        {selectedIssue.status.replace("_", " ").toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            {/* Issue Photo */}
                                                            {selectedIssue.photo && (
                                                                <Image
                                                                    src={selectedIssue.photo}
                                                                    alt="Issue photo"
                                                                    width={600}
                                                                    height={300}
                                                                    className="w-full rounded-lg object-cover"
                                                                />
                                                            )}

                                                            {/* Description */}
                                                            <div>
                                                                <h3 className="font-semibold mb-2">Description</h3>
                                                                <p className="text-slate-700">{selectedIssue.description}</p>
                                                            </div>

                                                            {/* Location & Contact Info */}
                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h3 className="font-semibold mb-2">Location</h3>
                                                                    <p className="text-slate-700">{selectedIssue.address}</p>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold mb-2">Reporter Contact</h3>
                                                                    <p className="text-slate-700">{selectedIssue.residents.phone_number}</p>
                                                                    <p className="text-slate-600 text-sm">{selectedIssue.residents.address}</p>
                                                                </div>
                                                            </div>

                                                            {/* Add Comment Section */}
                                                            <div>
                                                                <h3 className="font-semibold mb-2">Add Officer Note</h3>
                                                                <div className="space-y-2">
                                                                    <Textarea
                                                                        placeholder="Add a note or comment about this issue..."
                                                                        value={newComment}
                                                                        onChange={(e) => setNewComment(e.target.value)}
                                                                        className="min-h-[100px] resize-none"
                                                                    />
                                                                    <Button
                                                                        onClick={handleAddComment}
                                                                        disabled={!newComment.trim() || isUpdating}
                                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                                    >
                                                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                                        Add Comment
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
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