"use client"
// Department Officer issue list page
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    useGetDepartmentOfficerIssuesQuery,
    useGetDepartmentOfficerStatsQuery,
    useUpdateIssueStatusMutation
} from "@/services/departmentOfficer"
import {
    useAddCommentToIssueMutation
} from "@/services/issues"
import { AlertTriangle, CheckCircle, ClipboardCheck, Clock, Filter, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import OfficerIssuePost from "../officerIssuePost/page"

export default function DepartmentOfficerHomePage() {
    const [filter, setFilter] = useState("all")
    const [sortBy, setSortBy] = useState("recent")
    const [page, setPage] = useState(1)
    const limit = 10

    const getDepartmentOfficerData = () => {
        try {
            const userData = localStorage.getItem('user')
            if (userData) {
                const user = JSON.parse(userData)
                return {
                    userId: user.user_id || user.id,
                    role: user.role,
                    officerName: user.username || user.name,
                    department: user.department || user.profile?.department_name,
                    badgeNumber: user.badge_number || "N/A"
                }
            }
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error)
        }
        return {
            userId: null,
            role: null,
            officerName: "Officer",
            department: "Department",
            badgeNumber: "N/A"
        }
    }

    const { userId, role, department } = getDepartmentOfficerData()

    // Stats query
    const {
        data: statsData,
        isLoading: isLoadingStats,
    } = useGetDepartmentOfficerStatsQuery({
        user_id: userId,
        role: role
    }, {
        skip: !userId || !role
    })

    // Issues query params
    const issuesParams = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
            user_id: userId,
            role: role,
            page,
            limit
        }

        if (filter !== "all") {
            params.status = filter === "assigned" ? "in_progress" : filter
        }

        return params
    }, [filter, page, limit, userId, role])

    const {
        data: issuesData,
        isLoading: isLoadingIssues,
        refetch: refetchIssues
    } = useGetDepartmentOfficerIssuesQuery(issuesParams, {
        skip: !userId || !role
    })

    console.log("Issues Data:", issuesData)

    // API hooks
    const [updateIssueStatus, { isLoading: isUpdatingStatus }] = useUpdateIssueStatusMutation()
    const [addComment] = useAddCommentToIssueMutation()

    // Transform API data to match component structure
    const transformedIssues = useMemo(() => {
        if (!issuesData?.issues) return []

        return issuesData.issues.map((issue) => ({
            author: issue.residents?.name || "Unknown User",
            avatar: "/placeholder.svg?height=40&width=40",
            title: issue.title,
            description: issue.description,
            photo: issue.photos?.[0] || undefined,
            photos: issue.photos || [],
            location: issue.location || "Location not specified",
            timestamp: (issue.created_date),
            created_date: issue.created_date,
            priority: issue.priority,
            status: (issue.status),
            likes: 0,
            upvotes: issue.vote_count,
            comments: [],
            comment_count: issue.comment_count || 0,
            isLiked: false,
            isUpvoted: false,
            category: issue.category,
            resident_id: issue.resident_id,
            phone_number: issue.residents?.phone_number,
            resident_address: issue.residents?.address,
            date_observed: issue.date_observed,
            time_observed: issue.time_observed,
            user_id: issue.user_id,
            user: {
                username: issue.residents?.name || "Unknown User",
            },
            issue_id: issue.issue_id,
            users: {
                username: issue.residents?.name || "Unknown User",
            },
            department: issue.assigned_department,
            assigned_officer: department,
            residents: issue.residents,
            latitude: issue.latitude,
            longitude: issue.longitude,
            vote_count: issue.vote_count
        }))
    }, [issuesData, department])

    // Calculate stats from the API response
    const stats = useMemo(() => {
        if (!statsData?.stats) {
            return [
                { label: "Total Issues", value: "0", icon: ClipboardCheck, color: "text-blue-600" },
                { label: "In Progress", value: "0", icon: Clock, color: "text-yellow-600" },
                { label: "Resolved", value: "0", icon: CheckCircle, color: "text-green-600" },
                { label: "New Today", value: "0", icon: AlertTriangle, color: "text-orange-600" },
            ]
        }

        const { stats: apiStats } = statsData
        return [
            {
                label: "Total Issues",
                value: apiStats.totalIssuesAssigned.toString(),
                icon: ClipboardCheck,
                color: "text-blue-600"
            },
            {
                label: "In Progress",
                value: apiStats.inProgressIssues.toString(),
                icon: Clock,
                color: "text-yellow-600"
            },
            {
                label: "Resolved",
                value: apiStats.resolvedIssues.toString(),
                icon: CheckCircle,
                color: "text-green-600"
            },
            {
                label: "New Today",
                value: apiStats.newIssuesToday.toString(),
                icon: AlertTriangle,
                color: "text-orange-600"
            },
        ]
    }, [statsData])

    // Sort issues based on selected sort option
    const sortedIssues = useMemo(() => {
        const issues = [...transformedIssues]

        if (sortBy === "upvotes") {
            return issues.sort((a, b) => b.upvotes - a.upvotes)
        } else if (sortBy === "priority") {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
            return issues.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        }

        // Default: recent (already sorted by API)
        return issues
    }, [transformedIssues, sortBy])

    // Handle pagination
    const handleLoadMore = () => {
        if (issuesData?.pagination && page < issuesData.pagination.totalPages) {
            setPage(prev => prev + 1)
        }
    }

    // Reset page when filter changes
    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter)
        setPage(1)
    }

    // Department Officer handlers
    const handleStatusChange = async (issueId: number, newStatus: string) => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            alert('Please log in to update status');
            return;
        }
        const parsedUser = JSON.parse(userData);
        const currentUserId = parsedUser.user_id;
        const currentUserRole = parsedUser.role;

        try {
            await updateIssueStatus({
                issue_id: issueId,
                data: {
                    status: newStatus as "in_progress" | "resolved",
                    user_id: currentUserId,
                    role: currentUserRole,
                }
            }).unwrap();
            refetchIssues();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status. Please try again.');
        }

        console.log(issueId, newStatus, "status change sam")
    };

    console.log()

    const handleAddComment = async (issueId: number, comment: string) => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            alert('Please log in to add comment');
            return;
        }
        const parsedUser = JSON.parse(userData);
        const currentUserId = parsedUser.user_id;
        const currentUserRole = parsedUser.role;
        console.log(currentUserRole, 'role of the user')

        try {
            await addComment({
                issueId: issueId,
                data: {
                    content: comment,
                    user_id: currentUserId,
                    role: currentUserRole,
                }
            }).unwrap();
            refetchIssues();
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Error adding comment. Please try again.');
        }
    };

    // Loading state
    if ((isLoadingIssues || isLoadingStats) && page === 1) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 p-4">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex gap-2 items-center justify-center">
                            <div className="w-5 h-5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-5 h-5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-5 h-5 bg-emerald-600 rounded-full animate-bounce"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error state
    if (false) {
        return (
            <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                    <CardContent className="p-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Data</h3>
                        <p className="text-slate-600 mb-4">
                            There was an error loading the department data. Please try again.
                        </p>
                        <button
                            onClick={() => refetchIssues()}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                            Retry
                        </button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Department Officer Header */}
            {/* <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                                    {officerName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{officerName}</h1>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Building2 className="h-4 w-4" />
                                    <span>{department} - Department Officer</span>
                                    <span>•</span>
                                    <span>Badge #{badgeNumber}</span>
                                </div>
                            </div>
                        </div>
                        {statsData?.stats && (
                            <div className="text-right">
                                <p className="text-sm text-slate-600">Resolution Rate</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {Math.round(statsData.stats.resolutionRate)}%
                                </p>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card> */}

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
                            Department Issues Management
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
                    <Tabs value={filter} onValueChange={handleFilterChange}>
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                            <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                All Issues
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
                            <OfficerIssuePost
                                key={issue.issue_id}
                                {...issue}
                                handleStatusChange={handleStatusChange}
                                handleAddComment={handleAddComment}
                                isUpdatingStatus={isUpdatingStatus}
                            />
                        ))}

                        {/* Load More Button */}
                        {issuesData?.pagination && page < issuesData.pagination.totalPages && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingIssues}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoadingIssues ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        `Load More (${issuesData.pagination.totalPages - page} pages remaining)`
                                    )}
                                </button>
                            </div>
                        )}
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

