"use client"
//admin dashboard
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Users, AlertTriangle, CheckCircle, Clock, TrendingUp, Eye, UserPlus, Settings, Calendar, Loader2 } from "lucide-react"
import { useGetUsersStatsQuery, useGetUsersQuery } from "@/services/admin"
import { useState, useEffect } from "react"
import Link from "next/link"

// Interface for user data in localStorage
interface StoredUser {
  user_id: number;
  username: string;
  role: string;
  status: string;
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<StoredUser | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Get admin user data from localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser: StoredUser = JSON.parse(storedUser);
        setAdminUser(parsedUser);
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }, []);

  // API calls - only make calls when we have admin user data
  const {
    data: userStatsData,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats
  } = useGetUsersStatsQuery(
    {
      admin_user_id: adminUser?.user_id || 0,
      admin_role: adminUser?.role || "",
    },
    {
      skip: !adminUser, // Skip the query if we don't have admin user data
    }
  );

  const {
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
  } = useGetUsersQuery(
    {
      admin_user_id: adminUser?.user_id || 0,
      admin_role: adminUser?.role || "",
      type: "all",
      status: "all",
    },
    {
      skip: !adminUser, // Skip the query if we don't have admin user data
    }
  );

  // Extract statistics from API response
  const adminStats = userStatsData?.statistics || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalDepartments: 0,
    residentsThisWeek: 0,
    residentsToday: 0,
    recentUsers: [],
  };

  // Calculate user statistics for chart
  const getUserRoleData = () => {
    if (!usersData?.users) return [];

    const roleCounts = usersData.users.reduce((acc, user) => {
      const role = user.role === 'department_officer' ? 'Department Officer' :
        user.role === 'urban_councilor' ? 'Urban Councilor' :
          user.role === 'resident' ? 'Resident' : user.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
      color: role === 'Resident' ? '#10b981' :
        role === 'Department Officer' ? '#3b82f6' :
          role === 'Urban Councilor' ? '#8b5cf6' : '#6b7280'
    }));
  };

  // Recent activity from recent users
  const getRecentActivity = () => {
    if (!adminStats.recentUsers || adminStats.recentUsers.length === 0) {
      return [
        { time: "No recent activity", action: "No recent user registrations", user: "System", type: "system" }
      ];
    }

    return adminStats.recentUsers.slice(0, 5).map((user) => {

      const timeAgo = new Date(user.created_at);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - timeAgo.getTime()) / (1000 * 60 * 60));
      const timeDisplay = diffInHours < 1 ? "Less than 1 hour ago" :
        diffInHours === 1 ? "1 hour ago" :
          diffInHours < 24 ? `${diffInHours} hours ago` :
            `${Math.floor(diffInHours / 24)} days ago`;

      return {
        time: timeDisplay,
        action: `New ${user.role.replace('_', ' ')} registered`,
        user: user.username,
        type: "user"
      };
    });
  };

  const recentActivity = getRecentActivity();

  // Mock data for issues (since this is not in the users API)
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
  ];

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
      case "system":
        return <Clock className="h-4 w-4 text-slate-400" />
      default:
        return <Clock className="h-4 w-4 text-slate-600" />
    }
  }

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (!adminUser) return;

    const interval = setInterval(() => {
      refetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchStats, adminUser]);

  // Show nothing during SSR
  if (!isClient) {
    return null;
  }

  // No user in localStorage
  if (!adminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">No admin user found in session</p>
          <p className="text-slate-600 text-sm">Please log in again</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isStatsLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-slate-600">Loading dashboard...</p>
          <p className="text-slate-500 text-sm mt-2">Welcome back, {adminUser.username}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError || usersError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">Error loading dashboard data</p>
          <p className="text-slate-600 text-sm mb-4">
            Logged in as: {adminUser.username} ({adminUser.role})
          </p>
          <Button onClick={() => refetchStats()} className="bg-emerald-600 hover:bg-emerald-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {adminUser.username} ({adminUser.role.replace('_', ' ')}) - Manage community issues and users
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {userStatsData?.timestamp ? new Date(userStatsData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
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
            <p className="text-xl font-bold text-green-600">+{adminStats.residentsToday}</p>
            <p className="text-xs text-slate-600">New Today</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-purple-600">+{adminStats.residentsThisWeek}</p>
            <p className="text-xs text-slate-600">This Week</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-emerald-600">{adminStats.activeUsers}</p>
            <p className="text-xs text-slate-600">Active Users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-orange-600">{adminStats.suspendedUsers}</p>
            <p className="text-xs text-slate-600">Suspended</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <Settings className="h-6 w-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-900">{adminStats.totalDepartments}</p>
            <p className="text-xs text-slate-600">Departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Roles Overview Chart */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Users by Role</CardTitle>
            <p className="text-sm text-slate-600">Distribution of users by their roles</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getUserRoleData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
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
            <p className="text-sm text-slate-600">Latest user registrations</p>
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
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/issueList">View All Issues</Link>
            </Button>
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
            <p className="text-sm text-emerald-700">Manage community issues</p>
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