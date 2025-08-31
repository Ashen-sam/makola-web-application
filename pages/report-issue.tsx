"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import FreeMapComponent from "@/components/ui/FreeMapComponent"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import { AlertTriangle, Calendar, Camera, Clock, Upload, X } from "lucide-react"
import Image from "next/image"
import type React from "react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

interface FormData {
  title: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  date: string
  time: string
  priority: "low" | "medium" | "high"
  category: string
  photos: File[]
}

interface FormErrors {
  title?: string
  description?: string
  location?: string
  date?: string
  time?: string
  priority?: string
  category?: string
  photos?: string
}

interface User {
  user_id: number
  role: "resident" | "urban_councilor"
  username: string
}

interface PhotoPreview {
  file: File
  preview: string
  id: string
}

export default function ReportIssue() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: "",
    latitude: undefined,
    longitude: undefined,
    date: "",
    time: "",
    priority: "medium" as const,
    category: "",
    photos: [],
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [user, setUser] = useState<User | null>(null)

  const MAX_PHOTOS = 5
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  // Get user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const isAuthenticated = localStorage.getItem('isAuthenticated')

    if (userData && isAuthenticated === 'true') {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log('User data loaded:', parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        toast.error('Authentication error. Please log in again.')
        window.location.href = '/auth/login'
      }
    } else {
      toast.error('Please log in to report issues')
      window.location.href = '/auth/login'
    }
  }, [])

  const categories = [
    "Road & Transportation",
    "Street Lighting",
    "Waste Management",
    "Water & Drainage",
    "Public Safety",
    "Parks & Recreation",
    "Noise Pollution",
    "Other",
  ]

  const priorities = [
    { value: "low", label: "Low", description: "Minor issue, not urgent" },
    { value: "medium", label: "Medium", description: "Moderate issue, needs attention" },
    { value: "high", label: "High", description: "Important issue, requires prompt action" },
  ]

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters"
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required"
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Please select a location on the map"
    }

    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    if (!formData.time) {
      newErrors.time = "Time is required"
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle location change from LocationMapComponent
  const handleLocationChange = (location: string, coordinates?: { lat: number; lng: number }) => {
    setFormData((prev) => ({
      ...prev,
      location,
      latitude: coordinates?.lat,
      longitude: coordinates?.lng,
    }))

    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: undefined }))
    }
  }

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Check if adding these files would exceed the maximum
    if (photoPreviews.length + files.length > MAX_PHOTOS) {
      toast.error(`You can only upload up to ${MAX_PHOTOS} photos`)
      return
    }

    const validFiles: File[] = []
    // const newPreviews: PhotoPreview[] = []

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
        continue
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`)
        continue
      }

      validFiles.push(file)

      // Create preview
      const reader = new FileReader()
      const id = Math.random().toString(36).substring(2)

      reader.onload = (e) => {
        const preview: PhotoPreview = {
          file,
          preview: e.target?.result as string,
          id
        }

        setPhotoPreviews(prev => [...prev, preview])
      }
      reader.readAsDataURL(file)
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...validFiles]
      }))

      setErrors(prev => ({ ...prev, photos: undefined }))
      toast.success(`${validFiles.length} photo(s) uploaded successfully`)
    }

    // Reset the input
    e.target.value = ''
  }

  const removePhoto = (id: string) => {
    const previewToRemove = photoPreviews.find(p => p.id === id)
    if (!previewToRemove) return

    setPhotoPreviews(prev => prev.filter(p => p.id !== id))
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo !== previewToRemove.file)
    }))
  }

  const uploadPhotosToSupabase = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    const totalFiles = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        const fileExt = file.name.split('.').pop()
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2)
        const fileName = `${timestamp}-${randomString}-${i + 1}.${fileExt}`
        const filePath = `${fileName}`

        // Update progress
        const baseProgress = 25 + (i / totalFiles) * 50
        setUploadProgress(baseProgress)

        const { data, error } = await supabase.storage
          .from('issue-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error(`Error uploading photo ${i + 1}:`, error)
          throw new Error(`Upload failed for ${file.name}: ${error.message}`)
        }

        console.log(`Upload ${i + 1} successful:`, data)

        const { data: publicUrlData } = supabase.storage
          .from('issue-photos')
          .getPublicUrl(data.path)

        uploadedUrls.push(publicUrlData.publicUrl)

      } catch (error) {
        console.error(`Photo upload error for file ${i + 1}:`, error)
        throw error
      }
    }

    setUploadProgress(75)
    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("User not authenticated. Please log in again.")
      return
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    setErrors({})

    // Show loading toast
    const loadingToast = toast.loading("Submitting your issue report...")

    try {
      let photoUrls: string[] = []

      if (formData.photos.length > 0) {
        setUploadProgress(10)
        toast.loading(`Uploading ${formData.photos.length} photo(s)...`, { id: loadingToast })
        photoUrls = await uploadPhotosToSupabase(formData.photos)
      }

      // Prepare issue data according to your backend API structure
      const issueData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        location: formData.location.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        date_observed: formData.date,
        time_observed: formData.time,
        user_id: user.user_id,
        role: user.role,
        ...(photoUrls.length > 0 && { photos: photoUrls })
      }

      console.log('Submitting issue data:', issueData)

      // Make direct API call instead of RTK Query for better error handling
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create issue')
      }

      console.log('Issue created successfully:', result)

      // Success toast
      toast.success("Issue reported successfully! Thank you for helping improve our community.", {
        id: loadingToast,
        duration: 4000,
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        latitude: undefined,
        longitude: undefined,
        date: "",
        time: "",
        priority: "medium",
        category: "",
        photos: [],
      })
      setPhotoPreviews([])
      setErrors({})
      setUploadProgress(0)

    } catch (error: unknown) {
      console.error('Error creating issue:', error)

      let errorMessage = "Failed to submit issue. Please try again."

      if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: string }).message === "string") {
        errorMessage = (error as { message: string }).message
      }

      // Error toast
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p className="text-slate-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <AlertTriangle className="h-6 w-6 text-emerald-600" />
            Report Community Issue
          </CardTitle>
          <p className="text-slate-600">
            Help improve our community by reporting issues that need attention. Provide as much detail as possible for
            faster resolution.
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Logged in as: {user.username} ({user.role}) - ID: {user.user_id}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && uploadProgress > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>
                  {uploadProgress < 25 ? 'Preparing...' :
                    uploadProgress < 75 ? `Uploading ${formData.photos.length} photo(s)...` :
                      uploadProgress < 100 ? 'Processing...' : 'Submitting issue...'}
                </span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-medium">
                  Issue Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Brief, descriptive title of the issue"
                  className={`h-11 ${errors.title ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                  disabled={isLoading}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700 font-medium">
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`h-11 ${errors.category ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} w-full`}
                  >
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Location *
                </Label>
                <FreeMapComponent
                  value={formData.location}
                  onChange={handleLocationChange}
                  error={errors.location}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-700 font-medium">
                  Priority Level *
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value as "low" | "medium" | "high")}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`h-11 ${errors.priority ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"} w-full`}
                  >
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div>
                          <div className="font-medium">{priority.label}</div>
                          <div className="text-xs text-slate-500">{priority.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && <p className="text-sm text-red-600">{errors.priority}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700 font-medium">
                  Date Observed *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={`h-11 pl-10 ${errors.date ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-slate-700 font-medium">
                  Time Observed *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className={`h-11 pl-10 ${errors.time ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.time && <p className="text-sm text-red-600">{errors.time}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Provide detailed description of the issue, including any relevant context or impact on the community"
                  className={`min-h-[140px] resize-none ${errors.description ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                  disabled={isLoading}
                  maxLength={500}
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                <p className="text-xs text-slate-500">{formData.description.length}/500 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos" className="text-slate-700 font-medium">
                  Photos (Optional - Up to {MAX_PHOTOS})
                </Label>

                {/* Photo Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors min-h-[140px] flex items-center justify-center">
                  {photoPreviews.length === 0 ? (
                    <div className="space-y-2">
                      <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                      <div>
                        <Label htmlFor="photos" className="cursor-pointer">
                          <span className="text-emerald-600 hover:text-emerald-700 font-medium">Click to upload</span>
                          <span className="text-slate-600"> or drag and drop</span>
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB each (max {MAX_PHOTOS} photos)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <Label htmlFor="photos" className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                        + Add more photos ({photoPreviews.length}/{MAX_PHOTOS})
                      </Label>
                    </div>
                  )}

                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotosUpload}
                    className="hidden"
                    disabled={isLoading || photoPreviews.length >= MAX_PHOTOS}
                  />
                </div>

                {/* Photo Previews */}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {photoPreviews.map((preview) => (
                      <div key={preview.id} className="relative group">
                        <Image
                          src={preview.preview}
                          alt={`Preview ${preview.id}`}
                          className="w-full h-20 object-cover rounded-lg border"
                          width={80}
                          height={80}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(preview.id)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.photos && <p className="text-sm text-red-600">{errors.photos}</p>}
              </div>
            </div>

            <div className="flex justify-center pt-4 border-t border-slate-200">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full max-w-md h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadProgress > 0 && uploadProgress < 100 ?
                      `Uploading ${formData.photos.length} photo(s)...` :
                      'Submitting Issue...'
                    }
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Submit Issue Report
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}