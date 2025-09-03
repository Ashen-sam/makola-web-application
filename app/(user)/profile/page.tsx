"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowUp,
  Award,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Edit3,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  User,
  X,
  XCircle
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

// Import API hooks and types
import {
  Issue,
  UpdateIssueRequest,
  useDeleteIssueMutation,
  useGetIssuesByUserIdQuery,
  useUpdateIssueMutation
} from "@/services/issues"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Fixed Types matching API structure
interface UserProfile {
  username: string
  fullName: string
  email: string
  phoneNumber: string
  nic: string
  location: string
  bio: string
  joinDate: string
  avatar: string
}

interface UserStats {
  issuesReported: number
  issuesResolved: number
  commentsPosted: number
  likesReceived: number
  upvotesReceived: number
  communityRank: string
}

// UI Issue type that matches the component's display needs
interface UIIssue {
  id: string
  issue_id: number
  title: string
  description: string
  location: string
  priority: "low" | "medium" | "high"
  status: "open" | "in-progress" | "resolved" | "closed"
  category: string
  photo?: string | null
  upvotes: number
  comments: number
  createdAt: string
  dateObserved: string | null
  timeObserved: string | null
  resident_id?: number
  photos?: string[]
}

// User interface from localStorage (matching your stored structure)
interface StoredUser {
  user_id?: number
  resident_id?: number
  username: string
  name?: string
  full_name?: string
  email: string
  phone_number: string
  nic: string
  address: string
  bio?: string
  created_at: string
  avatar?: string
  role: "resident" | "urban_councilor"
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("stats")
  const [editingIssue, setEditingIssue] = useState<UIIssue | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [user, setUser] = useState<StoredUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  const router = useRouter()
  // Initialize user data from localStorage
  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = '/auth/login'
        return
      }

      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData: StoredUser = JSON.parse(storedUser)
        setUser(userData)

        const userId = userData.user_id || userData.resident_id
        if (userId) {
          setCurrentUserId(userId)
        } else {
          console.error('No valid user ID found in stored user data')
          setErrors({ general: 'Invalid user data. Please log in again.' })
        }
      } else {
        console.error('No user data found in localStorage')
        window.location.href = '/auth/login'
        return
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error)
      setErrors({ general: 'Error loading user data. Please log in again.' })
      window.location.href = '/auth/login'
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  // API Hooks with proper type checking
  const {
    data: userIssuesData,
    isLoading: isLoadingIssues,
    error: issuesError,
    refetch: refetchIssues
  } = useGetIssuesByUserIdQuery(
    {
      userId: currentUserId!,
      page: 1,
      limit: 50
    },
    {
      skip: !currentUserId
    }
  )

  const [updateIssue, { isLoading: isUpdatingIssue }] = useUpdateIssueMutation()
  const [deleteIssue, { isLoading: isDeletingIssue }] = useDeleteIssueMutation()

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    nic: "",
    location: "",
    bio: "",
    joinDate: "",
    avatar: "",
  })

  const [editProfile, setEditProfile] = useState<UserProfile>(profile)

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      const updatedProfile: UserProfile = {
        username: user.username || "",
        fullName: user.name || user.full_name || "",
        email: user.email || "",
        phoneNumber: user.phone_number || "",
        nic: user.nic || "",
        location: user.address || "",
        bio: user.bio || "Active community member passionate about improving our neighborhood.",
        joinDate: user.created_at
          ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          : "Recently",
        avatar: user.avatar || "/placeholder.svg?height=120&width=120",
      }
      setProfile(updatedProfile)
      setEditProfile(updatedProfile)
    }
  }, [user])

  // Transform API Issue data to UI format
  const transformApiIssueToUI = (issue: Issue): UIIssue => {
    return {
      id: issue.issue_id.toString(),
      issue_id: issue.issue_id,
      title: issue.title,
      description: issue.description,
      location: issue.location || issue.address || "Location not specified",
      priority: issue.priority,
      status: mapApiStatusToUI(issue.status),
      category: issue.category,
      photos: issue.photos,
      upvotes: issue.vote_count || 0,
      comments: issue.comments?.length || 0,
      createdAt: issue.created_date,
      dateObserved: issue.date_observed,
      timeObserved: issue.time_observed,
      resident_id: issue.resident_id,
    }
  }

  // Helper function to map API status to UI status
  const mapApiStatusToUI = (status: Issue['status']): UIIssue['status'] => {
    switch (status) {
      case 'in_progress':
        return 'in-progress'
      case 'resolved':
        return 'resolved'
      case 'closed':
        return 'closed'
      case 'open':
        return 'open'
      default:
        return 'open'
    }
  }



  // Transform issues from API
  const transformedIssues = useMemo(() => {
    if (!userIssuesData?.issues) return []
    return userIssuesData.issues.map(transformApiIssueToUI)
  }, [userIssuesData, transformApiIssueToUI])

  // Calculate stats from the API data
  const userStats: UserStats = useMemo(() => {
    const allIssues = transformedIssues || []
    return {
      issuesReported: allIssues.length,
      issuesResolved: allIssues.filter(issue => issue.status === "resolved").length,
      commentsPosted: 45, // This would need a separate API call
      likesReceived: 89, // This would need a separate API call
      upvotesReceived: allIssues.reduce((total, issue) => total + issue.upvotes, 0),
      communityRank: "Community Champion",
    }
  }, [transformedIssues])

  const filteredIssues = useMemo(() => {
    if (activeTab === "stats") return []
    if (activeTab === "all-issues") return transformedIssues
    return transformedIssues.filter(issue => issue.status === activeTab)
  }, [transformedIssues, activeTab])

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!editProfile.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!editProfile.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editProfile.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!editProfile.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }

    if (!editProfile.location.trim()) {
      newErrors.location = "Location is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateProfile()) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (user) {
        const updatedUser: StoredUser = {
          ...user,
          name: editProfile.fullName,
          email: editProfile.email,
          phone_number: editProfile.phoneNumber,
          address: editProfile.location,
          bio: editProfile.bio,
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      setProfile(editProfile)
      setIsEditing(false)
      setErrors({})
    } catch (error) {
      console.log(error)
      setErrors({ general: "Failed to update profile. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditProfile(profile)
    setIsEditing(false)
    setErrors({})
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditProfile((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleEditIssue = (issue: UIIssue) => {
    setEditingIssue({ ...issue })
    setSelectedPhotos(issue.photos || []) // Initialize with existing photos
    setIsEditDialogOpen(true)
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const remainingSlots = 4 - selectedPhotos.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
            setSelectedPhotos(prev => [...prev, result])
          }
        }
        reader.readAsDataURL(file)
      }
    })

    // Reset input
    event.target.value = ''
  }
  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
  }
  const handleSaveIssue = async () => {
    if (!editingIssue || !user || !currentUserId) return

    try {
      setIsLoading(true)

      // Create proper UpdateIssueRequest matching API interface
      const updateData: UpdateIssueRequest = {
        title: editingIssue.title,
        description: editingIssue.description,
        priority: editingIssue.priority,
        category: editingIssue.category,
        location: editingIssue.location,
        date_observed: editingIssue.dateObserved || undefined,
        time_observed: editingIssue.timeObserved || undefined,
        user_id: currentUserId,
        role: user.role,
        photos: selectedPhotos,
      }

      await updateIssue({
        id: editingIssue.issue_id,
        data: updateData
      }).unwrap()

      await refetchIssues()
      setIsEditDialogOpen(false)
      setEditingIssue(null)
      setSelectedPhotos([]) // Reset photos
      setErrors({})
    } catch (error: unknown) {
      console.error("Failed to update issue:", error)

      const err = error as { data?: { message?: string } }

      setErrors({
        general: err?.data?.message || "Failed to update issue. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }


  const handleDeleteIssue = async (issueId: string) => {
    if (!user || !currentUserId) return

    try {
      const numericIssueId = parseInt(issueId)

      await deleteIssue({
        id: numericIssueId,
        data: {
          user_id: currentUserId,
          role: user.role
        }
      }).unwrap()

      await refetchIssues()
      setErrors({})
    } catch (error: unknown) {
      console.error("Failed to delete issue:", error)

      const err = error as { data?: { message?: string } }

      setErrors({
        general: err?.data?.message || "Failed to delete issue. Please try again.",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-blue-100 text-blue-800 border-blue-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-slate-100 text-slate-800 border-slate-200"
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200"
      case "resolved": return "bg-green-100 text-green-800 border-green-200"
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertTriangle className="h-3 w-3" />
      case "in-progress": return <Clock className="h-3 w-3" />
      case "resolved": return <CheckCircle className="h-3 w-3" />
      case "closed": return <XCircle className="h-3 w-3" />
      default: return null
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error("Invalid date format:", dateString, error)
      return 'Unknown date'
    }
  }

  // Loading states
  if (isInitialLoading) {
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

  if (isLoadingIssues) {
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

  if (issuesError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                Failed to load your issues. Please refresh the page or try again later.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => refetchIssues()}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                Unable to load user profile. Please log in again.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => window.location.href = '/auth/login'}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Profile Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardContent className="p-6">
          {errors.general && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">
                    {profile.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{userStats.communityRank}</Badge>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1">
                  <Label className="text-slate-600 text-sm">Username</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-900">@{profile.username}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label className="text-slate-600 text-sm">Phone</Label>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editProfile.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        className={`${errors.phoneNumber ? "border-red-300" : "border-slate-300"}`}
                      />
                      {errors.phoneNumber && <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-900">{profile.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <Label className="text-slate-600 text-sm">Location</Label>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editProfile.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className={`${errors.location ? "border-red-300" : "border-slate-300"}`}
                      />
                      {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-900">{profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Join Date */}
                <div className="space-y-1">
                  <Label className="text-slate-600 text-sm">Member Since</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-900">{profile.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm">Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editProfile.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[80px] resize-none border-slate-300"
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
                )}
              </div>


            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 ">
        <TabsList className="grid w-full grid-cols-5 bg-slate-200 ">
          <TabsTrigger value="stats" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Statistics
          </TabsTrigger>
          <TabsTrigger value="all-issues" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            All Issues ({transformedIssues.length})
          </TabsTrigger>
          <TabsTrigger value="open" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Open ({transformedIssues.filter(i => i.status === "open").length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            In Progress ({transformedIssues.filter(i => i.status === "in-progress").length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Resolved ({transformedIssues.filter(i => i.status === "resolved").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{userStats.issuesReported}</p>
                <p className="text-sm text-slate-600">Issues Reported</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{userStats.issuesResolved}</p>
                <p className="text-sm text-slate-600">Issues Resolved</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{userStats.commentsPosted}</p>
                <p className="text-sm text-slate-600">Comments Posted</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{userStats.likesReceived}</p>
                <p className="text-sm text-slate-600">Likes Received</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4 text-center">
                <ArrowUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{userStats.upvotesReceived}</p>
                <p className="text-sm text-slate-600">Upvotes Received</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Issues Content */}
        {activeTab !== "stats" && (
          <TabsContent value={activeTab}>
            <div className="space-y-4">

              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <Card key={issue.id} className="bg-white/80 backdrop-blur-sm border-slate-200">
                    <CardContent className="">
                      <div className="flex items-center text-sm mb-3 gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(issue.createdAt)}
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{issue.title}</h3>
                          <div className="mb-2">
                            {issue.photos && issue.photos.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3 w-full">
                                {issue.photos.slice(0, 4).map((photo, index) => (
                                  <div
                                    key={index}
                                    className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden shadow-sm"
                                  >
                                    <Image
                                      width={400}
                                      height={300}
                                      src={photo}
                                      alt={`${issue.title} - Image ${index + 1}`}
                                      className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              null
                            )}
                          </div>
                          <p className="text-slate-700 text-md mb-3 break-all line-clamp-2">{issue.description}</p>
                          <div className=" flex-col  items-center  text-sm text-slate-600">
                            <div className="flex items-center gap-1 mb-4">
                              {issue.location}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${getPriorityColor(issue.priority)}`}>
                                {issue.priority.toUpperCase()}
                              </Badge>
                              <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                                {getStatusIcon(issue.status)}
                                {issue.status.replace("-", " ").toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {issue.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 absolute top-3 right-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditIssue(issue)}
                            className="flex items-center gap-1"
                            disabled={isUpdatingIssue}
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                disabled={isDeletingIssue}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-slate-600 break-all line-clamp-2">
                                  This action cannot be undone. This will permanently delete your issue &quot;{issue.title}&quot; and remove it from the community feed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteIssue(issue.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={isDeletingIssue}
                                >
                                  {isDeletingIssue ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete Issue"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Issue Stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <ArrowUp className="h-4 w-4" />
                            {issue.upvotes} upvotes
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {issue.comments} comments
                          </div>
                          {issue.dateObserved && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Observed: {formatDate(issue.dateObserved)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No Issues Found
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {activeTab === "all-issues"
                        ? "You haven't reported any issues yet."
                        : `You don't have any ${activeTab.replace("-", " ")} issues.`
                      }
                    </p>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => router.push('/report')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Report Your First Issue
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Issue Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="min-w-[1200px]  ">
          <DialogHeader>
            <DialogTitle>Edit Issue</DialogTitle>
            <DialogDescription>
              Update your issue details. Changes will be reflected in the community feed.
            </DialogDescription>
          </DialogHeader>

          {editingIssue && (
            <div className="space-y-4 py-1  ">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={editingIssue.title}
                  onChange={(e) =>
                    setEditingIssue({ ...editingIssue, title: e.target.value })
                  }
                  placeholder="Enter issue title"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={editingIssue.description}
                  onChange={(e) =>
                    setEditingIssue({ ...editingIssue, description: e.target.value })
                  }
                  placeholder="Describe the issue in detail"
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photos">Photos (Max 4)</Label>
                <div className={`${selectedPhotos.length === 0 ? 'grid-cols-1' : 'grid-cols-2'} grid gap-3`}>
                  {/* Display existing photos */}
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          width={200}
                          height={100}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Photo Upload - appears in the next grid position */}
                  {selectedPhotos.length < 4 && (
                    <div className={`border-2  border-dashed border-slate-300  p-4 text-center hover:border-emerald-400 transition-colors rounded-lg h-32 flex flex-col items-center justify-center `}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center cursor-pointer text-slate-600 hover:text-slate-800 h-full"
                      >
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-xs font-medium text-center">
                          Add Photos ({selectedPhotos.length}/4)
                        </span>
                        <span className="text-xs text-slate-500 mt-1 text-center">
                          Click to select images
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={editingIssue.priority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setEditingIssue({ ...editingIssue, priority: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          High
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={editingIssue.category}
                    onValueChange={(value) =>
                      setEditingIssue({ ...editingIssue, category: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Sanitation">Sanitation</SelectItem>
                      <SelectItem value="Roads">Roads</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                      <SelectItem value="Water Supply">Water Supply</SelectItem>
                      <SelectItem value="Electricity">Electricity</SelectItem>
                      <SelectItem value="Public Transport">Public Transport</SelectItem>
                      <SelectItem value="Waste Management">Waste Management</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editingIssue.location || ""}
                  onChange={(e) =>
                    setEditingIssue({ ...editingIssue, location: e.target.value })
                  }
                  placeholder="Enter specific location or address"
                  className="w-full"
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateObserved">Date Observed</Label>
                  <Input
                    id="dateObserved"
                    type="date"
                    value={editingIssue.dateObserved || ''}
                    onChange={(e) =>
                      setEditingIssue({
                        ...editingIssue,
                        dateObserved: e.target.value
                      })
                    }
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeObserved">Time Observed</Label>
                  <Input
                    id="timeObserved"
                    type="time"
                    value={editingIssue.timeObserved || ''}
                    onChange={(e) =>
                      setEditingIssue({
                        ...editingIssue,
                        timeObserved: e.target.value
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div> */}

              {/* Current Status Display */}
              <Badge className={`${getStatusColor(editingIssue.status)} flex items-center gap-1 absolute top-3 right-15`}>
                {getStatusIcon(editingIssue.status)}
                {editingIssue.status.replace("-", " ").toUpperCase()}
              </Badge>
            </div>
          )
          }

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingIssue(null)
                setErrors({})
              }}
              disabled={isUpdatingIssue}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveIssue}
              disabled={isUpdatingIssue || !editingIssue?.title.trim() || !editingIssue?.description.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            >
              {isUpdatingIssue ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >
    </div >
  )
}