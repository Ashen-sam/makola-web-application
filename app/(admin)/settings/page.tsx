"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Camera,
  Save,
  RefreshCw,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  Loader2
} from "lucide-react"
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useUploadProfilePictureMutation,
  useRemoveProfilePictureMutation,
  isUrbanCouncilorProfile,
  type UrbanCouncilorProfile
} from "@/services/profile"

interface UserData {
  user_id: number
  username: string
  role: string
  status: string
}

export default function UrbanCouncilorProfile() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get user data from localStorage on component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsedUser: UserData = JSON.parse(storedUser)

        // Validate that user is urban councilor
        if (parsedUser.role !== 'urban_councilor') {
          setAuthError('Access denied. This page is only for urban councilors.')
          return
        }

        setUserData(parsedUser)
      } else {
        setAuthError('User not found. Please log in again.')
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error)
      setAuthError('Invalid user data. Please log in again.')
    }
  }, [])

  // API Hooks - only call if we have valid user data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useGetProfileQuery(
    { user_id: userData?.user_id || 0 },
    { skip: !userData?.user_id }
  )

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation()
  const [uploadProfilePicture, { isLoading: isUploading }] = useUploadProfilePictureMutation()
  const [removeProfilePicture, { isLoading: isRemoving }] = useRemoveProfilePictureMutation()

  // Form state
  const [formData, setFormData] = useState({
    username: ""
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profileData?.profile && isUrbanCouncilorProfile(profileData.profile)) {
      setFormData({
        username: profileData.profile.username
      })
    }
  }, [profileData])

  const profile = profileData?.profile as UrbanCouncilorProfile | undefined

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file")
      return
    }

    try {
      const result = await uploadProfilePicture({
        file,
        user_id: profile.user_id
      }).unwrap()

      alert(result.message)
      refetchProfile() // Refresh profile data

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Upload failed:", error)
      alert(error?.data?.message || "Failed to upload profile picture")
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!profile) return

    try {
      const result = await removeProfilePicture({
        user_id: profile.user_id
      }).unwrap()

      alert(result.message)
      refetchProfile() // Refresh profile data
    } catch (error: any) {
      console.error("Remove failed:", error)
      alert(error?.data?.message || "Failed to remove profile picture")
    }
  }

  const handleUpdateProfile = async () => {
    if (!profile) return

    // Validate form
    if (!formData.username.trim()) {
      alert("Username is required")
      return
    }

    try {
      const result = await updateProfile({
        user_id: profile.user_id,
        username: formData.username.trim(),
        ...(profile.profile_picture && { profile_picture: profile.profile_picture })
      }).unwrap()

      // Update localStorage with new username
      if (userData) {
        const updatedUserData = { ...userData, username: formData.username.trim() }
        localStorage.setItem('user', JSON.stringify(updatedUserData))
        setUserData(updatedUserData)
      }

      alert(result.message)
      refetchProfile() // Refresh profile data
    } catch (error: any) {
      console.error("Update failed:", error)
      alert(error?.data?.message || "Failed to update profile")
    }
  }

  const handleDeleteProfile = async () => {
    if (!profile) return

    try {
      const result = await deleteProfile({
        user_id: profile.user_id,
        role: profile.role
      }).unwrap()

      // Clear localStorage
      localStorage.removeItem('user')

      alert(result.message)
      // Redirect to login page
      window.location.href = "/login"
    } catch (error: any) {
      console.error("Delete failed:", error)
      alert(error?.data?.message || "Failed to delete profile")
      setShowDeleteConfirm(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = "/login"
  }

  // Authentication error state
  if (authError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {authError}
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleLogout}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700"
        >
          Go to Login
        </Button>
      </div>
    )
  }

  // Wait for user data to load
  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading user data...</span>
          </div>
        </div>
      </div>
    )
  }

  // Loading profile state
  if (isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  // Profile API error state
  if (profileError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load profile. Please try again.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => refetchProfile()}
          variant="outline"
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Profile not found or wrong role
  if (!profile || !isUrbanCouncilorProfile(profile)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Urban councilor profile not found or access denied.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const isLoading = isUpdating || isUploading || isRemoving || isDeleting

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600">Manage your urban councilor profile</p>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as: {userData.username} (ID: {userData.user_id})
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleUpdateProfile}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {/* Profile Picture Display */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {profile.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-slate-400" />
                  )}
                </div>
                {profile.profile_picture && (
                  <button
                    onClick={handleRemoveProfilePicture}
                    disabled={isLoading}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg disabled:opacity-50"
                    title="Remove profile picture"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div className="w-full space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={isLoading}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Max 5MB • JPG, PNG, GIF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value="Urban Councilor"
                    disabled
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={profile.status}
                    disabled
                    className="bg-slate-50 capitalize"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="created_at">Member Since</Label>
                  <Input
                    id="created_at"
                    value={new Date(profile.created_at).toLocaleDateString()}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={profile.user_id}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-white/80 backdrop-blur-sm border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Deleting your profile is permanent and cannot be undone. All your data will be lost.
                </AlertDescription>
              </Alert>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Profile
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to delete your profile?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteProfile}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Yes, Delete
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}