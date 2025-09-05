"use client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useGetUsersStatsQuery,
  useUpdateUserStatusMutation,
  type CreateDepartmentOfficerRequest,
  type CreateResidentRequest,
  type UserRole,
  type UserStatus
} from "@/services/admin";
import {
  AlertTriangle,
  Calendar,
  Loader2,
  MapPin,
  Plus,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  UserX
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function AdminUsers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userType, setUserType] = useState<"resident" | "department_officer" | "">("")
  const [filterType, setFilterType] = useState<"all" | "resident" | "department_officer" | "urban_councilor">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all")
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    address: "",
    phone_number: "",
    nic: "",
    password: "",
    confirmPassword: "",
    department_name: "",
  })

  const getAdminUserData = () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return {
          adminUserId: user.user_id || user.id,
          adminRole: user.role as UserRole
        }
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error)
    }
    return { adminUserId: null, adminRole: null }
  }

  const { adminUserId, adminRole } = getAdminUserData()


  // API Hooks
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError
  } = useGetUsersStatsQuery({
    admin_user_id: adminUserId,
    admin_role: adminRole ?? ''
  })

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useGetUsersQuery({
    admin_user_id: adminUserId,
    admin_role: adminRole ?? '',
    type: filterType,
    status: filterStatus
  })

  const router = useRouter()
    ;
  const [createUser, {
    isLoading: createLoading,
    error: createError
  }] = useCreateUserMutation()

  const [updateUserStatus, {
    isLoading: updateStatusLoading
  }] = useUpdateUserStatusMutation()

  const [deleteUser, {
    isLoading: deleteLoading
  }] = useDeleteUserMutation()

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: '' as 'suspend' | 'activate' | 'delete' | '',
    userId: 0,
    userName: '',
    currentStatus: '' as UserStatus
  })

  // Refetch users when filters change
  useEffect(() => {
    refetchUsers()
  }, [filterType, filterStatus, refetchUsers])

  const handleUserAction = (userId: number, action: 'suspend' | 'activate' | 'delete') => {
    const user = usersData?.users.find(u => u.user_id === userId)
    if (!user) return

    setConfirmDialog({
      isOpen: true,
      action,
      userId,
      userName: user.username,
      currentStatus: user.status
    })
  }

  const confirmUserAction = async () => {
    const { action, userId } = confirmDialog

    try {
      if (action === 'delete') {
        await deleteUser({
          user_id: userId,
          admin_user_id: adminUserId,
          admin_role: adminRole ?? ""
        }).unwrap()
      } else {
        const newStatus: UserStatus = action === 'suspend' ? 'suspended' : 'active'
        await updateUserStatus({
          user_id: userId,
          status: newStatus,
          admin_user_id: adminUserId.toString(),
          admin_role: adminRole ?? "",
          reason: `User ${action}d by administrator`
        }).unwrap()
      }

      setConfirmDialog({ isOpen: false, action: '', userId: 0, userName: '', currentStatus: 'active' })
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    }
  }

  const cancelUserAction = () => {
    setConfirmDialog({ isOpen: false, action: '', userId: 0, userName: '', currentStatus: 'active' })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUserTypeChange = (type: "resident" | "department_officer" | "") => {
    setUserType(type)
    if (type === "resident") {
      setFormData(prev => ({
        ...prev,
        department_name: ""
      }))
    }
  }

  const validateForm = (): boolean => {
    if (!userType || !formData.username || !formData.password || !formData.address || !formData.phone_number) {
      return false
    }

    if (userType === "resident") {
      return !!(formData.name && formData.nic && formData.confirmPassword)
    }

    if (userType === "department_officer") {
      return !!formData.department_name
    }

    return false
  }

  const handleCreateUser = async () => {
    if (!validateForm()) {
      return
    }

    try {
      let userData: CreateResidentRequest | CreateDepartmentOfficerRequest

      if (userType === "resident") {
        userData = {
          username: formData.username,
          password: formData.password,
          userType: "resident",
          admin_user_id: adminUserId.toString(),
          admin_role: adminRole ?? '',
          name: formData.name,
          address: formData.address,
          phone_number: formData.phone_number,
          nic: formData.nic,
        }
      } else {
        userData = {
          username: formData.username,
          password: formData.password,
          userType: "department_officer",
          admin_user_id: adminUserId.toString(),
          admin_role: adminRole ?? '',
          department_name: formData.department_name,
          address: formData.address,
          phone_number: formData.phone_number,
        }
      }

      await createUser(userData).unwrap()
      setIsDialogOpen(false)
      resetForm()
      // You might want to show a success toast here
    } catch (error) {
      console.error('Failed to create user:', error)
      // You might want to show an error toast here
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      address: "",
      phone_number: "",
      nic: "",
      password: "",
      confirmPassword: "",
      department_name: "",
    })
    setUserType("")
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "urban_councilor":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "department_officer":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Loading states
  if (statsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-slate-600">Loading users...</span>
        </div>
      </div>
    )
  }

  // Error states
  if (statsError || usersError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600">
            {statsError && 'error' in statsError ? statsError.error :
              usersError && 'error' in usersError ? usersError.error :
                'Failed to load user data'}
          </p>
        </div>
      </div>
    )
  }

  const userStats = statsData?.statistics
  const users = usersData?.users || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-600">View and manage community members</p>
        </div>

        <button
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Users
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="resident">Residents</option>
            <option value="department_officer">Department Officers</option>
            <option value="urban_councilor">Urban Councilors</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-900">{userStats.totalUsers}</p>
            <p className="text-xs text-slate-600">Total Users</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4 text-center">
            <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-600">{userStats.activeUsers}</p>
            <p className="text-xs text-slate-600">Active</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4 text-center">
            <UserX className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-red-600">{userStats.suspendedUsers}</p>
            <p className="text-xs text-slate-600">Suspended</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4 text-center">
            <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-purple-600">{userStats.totalDepartments}</p>
            <p className="text-xs text-slate-600">Departments</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-emerald-600">+{userStats.residentsThisWeek}</p>
            <p className="text-xs text-slate-600">This Week</p>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.user_id} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {user.username || user.username}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                        ID: {user.user_id}
                      </span>
                      <span className={`text-xs px-2 py-1 border rounded ${getStatusColor(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 border rounded ${getRoleColor(user.role)} flex items-center gap-1`}>
                        {user.role === 'urban_councilor' && <Shield className="h-3 w-3" />}
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">
                          Username: <span className="font-medium text-slate-900">@{user.username}</span>
                        </p>
                        {user.phoneNumber && (
                          <p className="text-slate-600">
                            Phone: <span className="font-medium text-slate-900">{user.phoneNumber}</span>
                          </p>
                        )}
                        {user.nic && (
                          <p className="text-slate-600">
                            NIC: <span className="font-medium text-slate-900">{user.nic}</span>
                          </p>
                        )}
                      </div>
                      <div>
                        {user.address && (
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-600">
                              Address: <span className="font-medium text-slate-900">{user.address}</span>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-600">
                            Joined: <span className="font-medium text-slate-900">{formatDate(user.created_at)}</span>
                          </span>
                        </div>
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
                    {user.status === "active" ? (
                      <button
                        onClick={() => handleUserAction(user.user_id, "suspend")}
                        disabled={updateStatusLoading}
                        className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-transparent border border-red-200 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {updateStatusLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Suspend User"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(user.user_id, "activate")}
                        disabled={updateStatusLoading}
                        className="w-full px-3 py-2 text-sm font-medium text-green-600 bg-transparent border border-green-200 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {updateStatusLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Activate User"}
                      </button>
                    )}

                    <button
                      onClick={() => handleUserAction(user.user_id, "delete")}
                      disabled={deleteLoading}
                      className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-transparent border border-red-200 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Delete User"}
                    </button>
                    <button
                      onClick={() => router.push(`/user/profile?${user.user_id}`)}
                      className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-transparent border border-red-200 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "View User Profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new resident or department officer to the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Type Selection */}
            <div className="space-y-2">
              <label htmlFor="userType" className="block text-sm font-medium text-slate-700">
                User Type
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => handleUserTypeChange(e.target.value as typeof userType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select user type</option>
                <option value="resident">Resident</option>
                <option value="department_officer">Department Officer</option>
              </select>
            </div>

            {userType && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name - Only for residents */}
                {userType === "resident" && (
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="text"
                    placeholder="Enter phone number"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* NIC Number - Only for residents */}
                {userType === "resident" && (
                  <div className="space-y-2">
                    <label htmlFor="nic" className="block text-sm font-medium text-slate-700">
                      NIC Number
                    </label>
                    <input
                      id="nic"
                      type="text"
                      placeholder="Enter NIC number"
                      value={formData.nic}
                      onChange={(e) => handleInputChange("nic", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Department Name - Only for officers */}
                {userType === "department_officer" && (
                  <div className="space-y-2">
                    <label htmlFor="department_name" className="block text-sm font-medium text-slate-700">
                      Department Name
                    </label>
                    <input
                      id="department_name"
                      type="text"
                      placeholder="Enter department name"
                      value={formData.department_name}
                      onChange={(e) => handleInputChange("department_name", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Confirm Password - Only for residents */}
                {userType === "resident" && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  {'data' in createError ? '' : 'Failed to create user'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <button
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              disabled={!validateForm() || createLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={cancelUserAction}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle>
                  {confirmDialog.action === 'suspend' ? 'Suspend User' :
                    confirmDialog.action === 'activate' ? 'Activate User' : 'Delete User'}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription>
            Are you sure you want to {confirmDialog.action} <span className="font-medium text-slate-900">{confirmDialog.userName}</span>?
            {confirmDialog.action === 'suspend'
              ? ' This will prevent them from accessing the platform.'
              : confirmDialog.action === 'activate'
                ? ' This will restore their access to the platform.'
                : ' This action cannot be undone.'
            }
          </DialogDescription>

          <DialogFooter className="flex gap-3">
            <button
              onClick={cancelUserAction}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmUserAction}
              disabled={updateStatusLoading || deleteLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${confirmDialog.action === 'activate'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
            >
              {(updateStatusLoading || deleteLoading) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                confirmDialog.action === 'suspend' ? 'Suspend User' :
                  confirmDialog.action === 'activate' ? 'Activate User' : 'Delete User'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {users.length === 0 && !usersLoading && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Users Found</h3>
          <p className="text-slate-600">No users match your current search criteria.</p>
        </div>
      )}
    </div>
  )
}