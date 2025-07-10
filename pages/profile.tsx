"use client"

import { useState } from "react"
import { Card, CardContent, } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Award,
  TrendingUp,
  MessageCircle,
  Heart,
  ArrowUp,
} from "lucide-react"

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

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [profile, setProfile] = useState<UserProfile>({
    username: "johndoe",
    fullName: "John Doe",
    email: "john.doe@email.com",
    phoneNumber: "+94 77 123 4567",
    nic: "123456789V",
    location: "Makola, Colombo",
    bio: "Active community member passionate about improving our neighborhood. Always ready to help report and resolve local issues.",
    joinDate: "January 2024",
    avatar: "/placeholder.svg?height=120&width=120",
  })

  const [editProfile, setEditProfile] = useState<UserProfile>(profile)

  const userStats: UserStats = {
    issuesReported: 12,
    issuesResolved: 8,
    commentsPosted: 45,
    likesReceived: 89,
    upvotesReceived: 156,
    communityRank: "Community Champion",
  }



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
    if (!validateProfile()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

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



  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                        <Save className="h-4 w-4" />
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

                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-slate-600 text-sm">Email</Label>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editProfile.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`${errors.email ? "border-red-300" : "border-slate-300"}`}
                      />
                      {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-900">{profile.email}</span>
                    </div>
                  )}
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
                <div className="space-y-1 md:col-span-2">
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

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 bg-slate-100">
          <TabsTrigger value="stats" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white ">
            Statistics
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


      </Tabs>
    </div>
  )
}
