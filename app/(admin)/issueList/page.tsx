"use client"
//admin issue list page
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    useGetIssuesQuery,
    useUpdateIssueMutation,
    useDeleteIssueMutation,
    useUpdateIssueStatusMutation,
    useAssignDepartmentMutation
} from "@/services/issues"
import { AlertTriangle, ArrowUp, CheckCircle, Clock, Filter, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import AdminIssuePost from "../issues/page"
import { useGetUsersQuery } from "@/services/admin"

export default function AdminFeedPage() {
    const [filter, setFilter] = useState("all")
    const [sortBy, setSortBy] = useState("recent")
    const [page, setPage] = useState(1)
    const limit = 10
    const getAdminUserData = () => {
        try {
            const userData = localStorage.getItem('user')
            if (userData) {
                const user = JSON.parse(userData)
                return {
                    adminUserId: user.user_id || user.id,
                    adminRole: user.role
                }
            }
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error)
        }
        return { adminUserId: null, adminRole: null }
    }

    const { adminUserId, adminRole } = getAdminUserData()

    const { data: usersData } = useGetUsersQuery({
        admin_user_id: adminUserId,
        admin_role: adminRole ?? '',
        type: 'department_officer',
        status: 'active'
    });
    // Add this import to your existing mutation hooks
    const [assignDepartment, { isLoading: isAssigningDepartment }] = useAssignDepartmentMutation()
    const queryParams = useMemo(() => {
        const params: any = { page, limit }

        if (filter !== "all") {
            params.status = filter as "open" | "in-progress" | "resolved"
        }

        return params
    }, [filter, page, limit])

    const {
        data: issuesData,
        isLoading,
        error,
        refetch
    } = useGetIssuesQuery(queryParams)

    // API hooks - removed duplicates, keeping only necessary ones
    const [updateIssue] = useUpdateIssueMutation()
    const [deleteIssue] = useDeleteIssueMutation()
    const [updateIssueStatus, { isLoading: isUpdatingStatus, }] = useUpdateIssueStatusMutation()

    // Transform API data to match component structure
    const transformedIssues = useMemo(() => {
        if (!issuesData?.issues) return []

        return issuesData.issues.map((issue) => ({
            id: issue.issue_id.toString(),
            author: issue.users?.username || "Unknown User",
            avatar: "/placeholder.svg?height=40&width=40",
            title: issue.title,
            description: issue.description,
            photo: issue.photo || undefined,
            photos: issue.photos || [],
            location: issue.location || issue.address || "Location not specified",
            timestamp: formatTimestamp(issue.created_date),
            created_date: issue.created_date,
            priority: mapPriority(issue.priority),
            status: mapStatus(issue.status),
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
                username: issue.users?.username || "Unknown User",
            },
            issue_id: issue.issue_id,
            users: issue.users,
            assignedOfficer: issue.assigned_officer || undefined,
        }))
    }, [issuesData])

    // Calculate stats from the issues data
    const stats = useMemo(() => {
        const allIssues = issuesData?.issues || []
        const totalIssues = issuesData?.pagination.total || 0
        const inProgressCount = allIssues.filter(issue => issue.status === "in_progress").length
        const resolvedCount = allIssues.filter(issue => issue.status === "resolved").length
        const totalUpvotes = allIssues.reduce((sum, issue) => sum + issue.vote_count, 0)

        return [
            { label: "Total Issues", value: totalIssues.toString(), icon: AlertTriangle, color: "text-slate-600" },
            { label: "In Progress", value: inProgressCount.toString(), icon: Clock, color: "text-blue-600" },
            { label: "Resolved", value: resolvedCount.toString(), icon: CheckCircle, color: "text-green-600" },
            { label: "Total Upvotes", value: totalUpvotes.toString(), icon: ArrowUp, color: "text-emerald-600" },
        ]
    }, [issuesData])

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

    // Admin handlers - consolidated and cleaned up
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
                id: issueId,
                status: newStatus as "open" | "in_progress" | "closed" | "resolved",
                user_id: currentUserId,
                role: currentUserRole,
            }).unwrap();
            refetch();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status. Please try again.');
        }
    };

    const handleAssignOfficer = async (issueId: number, officerName: string) => {
        // Get user data directly from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
            alert('Please log in to assign officer');
            return;
        }

        let parsedUser;
        try {
            parsedUser = JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            alert('Invalid user data. Please log in again.');
            return;
        }

        const currentUserId = parsedUser.user_id;
        const currentUserRole = parsedUser.role;

        if (!currentUserId || !currentUserRole) {
            alert('Invalid user credentials. Please log in again.');
            return;
        }

        try {
            // Find the selected officer to get their department
            const selectedOfficer = usersData?.users?.find(user => user.username === officerName);
            const departmentName = selectedOfficer?.profile?.department_name;

            if (!departmentName) {
                alert('Selected officer does not have a department assigned');
                return;
            }

            await assignDepartment({
                issueId: issueId,
                departmentData: {
                    department_name: departmentName,
                    user_id: currentUserId.toString(),
                    role: currentUserRole,
                }
            }).unwrap();

            alert('Officer assigned successfully!');
            refetch(); // Refresh the issues list
        } catch (error) {
            console.error('Error assigning officer:', error);
            alert('Error assigning officer. Please try again.');
        }
    };

    const handleDeleteIssue = async (issueId: number) => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            alert('Please log in to delete issue');
            return;
        }
        const parsedUser = JSON.parse(userData);
        const currentUserId = parsedUser.user_id;
        const currentUserRole = parsedUser.role;

        try {
            await deleteIssue({
                id: issueId,
                data: {
                    user_id: currentUserId,
                    role: currentUserRole,
                }
            }).unwrap();
            refetch();
        } catch (error) {
            console.error('Error deleting issue:', error);
            alert('Error deleting issue. Please try again.');
        }
    };

    // Loading state
    if (isLoading && page === 1) {
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
    if (error) {
        return (
            <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                    <CardContent className="p-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Issues</h3>
                        <p className="text-slate-600 mb-4">
                            There was an error loading the issues. Please try again.
                        </p>
                        <button
                            onClick={() => refetch()}
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
                    <Tabs value={filter} onValueChange={handleFilterChange}>
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

            {/* Issues List */}
            <div className="space-y-4">
                {sortedIssues.length > 0 ? (
                    <>
                        {sortedIssues.map((issue) => (
                            <AdminIssuePost
                                key={issue.issue_id}
                                {...issue}
                                handleDeleteIssue={handleDeleteIssue}
                                handleStatusChange={handleStatusChange}
                                handleAssignOfficer={handleAssignOfficer}
                                isUpdatingStatus={isUpdatingStatus}
                            />
                        ))}

                        {/* Load More Button */}
                        {issuesData?.pagination && page < issuesData.pagination.totalPages && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
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

// Helper functions - consolidated from both files
function formatTimestamp(dateString: string): string {
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

function mapPriority(priority: string): "critical" | "high" | "medium" | "low" {
    switch (priority.toLowerCase()) {
        case 'critical':
            return 'critical'
        case 'high':
            return 'high'
        case 'medium':
            return 'medium'
        case 'low':
            return 'low'
        default:
            return 'medium'
    }
}

function mapStatus(status: string): "open" | "in-progress" | "resolved" {
    switch (status) {
        case 'in_progress':
            return 'in-progress'
        case 'resolved':
        case 'closed':
            return 'resolved'
        default:
            return 'open'
    }
}