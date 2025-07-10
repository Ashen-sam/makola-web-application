"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, MapPin, Calendar, Clock, AlertTriangle, Camera } from "lucide-react"
import Image from "next/image"

interface FormData {
  title: string
  description: string
  location: string
  date: string
  time: string
  priority: string
  category: string
  photo: File | null
}

interface FormErrors {
  title?: string
  description?: string
  location?: string
  date?: string
  time?: string
  priority?: string
  category?: string
  photo?: string
  general?: string
}

export default function ReportIssue() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    priority: "",
    category: "",
    photo: null,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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
    { value: "critical", label: "Critical", description: "Urgent issue, immediate action needed" },
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({ ...prev, general: "Photo size must be less than 5MB" }))
        return
      }

      setFormData((prev) => ({ ...prev, photo: file }))

      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log("Issue reported:", formData)
      alert("Issue reported successfully! Thank you for helping improve our community.")

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        date: "",
        time: "",
        priority: "",
        category: "",
        photo: null,
      })
      setPhotoPreview(null)
      setErrors({})
    } catch (error) {
      console.log(error)
      setErrors({ general: "Failed to submit issue. Please try again." })
    } finally {
      setIsLoading(false)
    }
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
        </CardHeader>

        <CardContent>
          {errors.general && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{errors.general}</AlertDescription>
            </Alert>
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
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700 font-medium">
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
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
                <Label htmlFor="location" className="text-slate-700 font-medium">
                  Location *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Specific location or address"
                    className={`h-11 pl-10 ${errors.location ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                </div>
                {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-700 font-medium">
                  Priority Level *
                </Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
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

            {/* Row 3: Date and Time */}
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
                  />
                </div>
                {errors.time && <p className="text-sm text-red-600">{errors.time}</p>}
              </div>
            </div>

            {/* Row 4: Description and Photo */}
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
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                <p className="text-xs text-slate-500">{formData.description.length}/500 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo" className="text-slate-700 font-medium">
                  Photo (Optional)
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors min-h-[140px] flex items-center justify-center">
                  {photoPreview ? (
                    <div className="space-y-3 w-full">
                      <Image
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="max-h-24 mx-auto rounded-lg object-cover"
                        width={600}
                        height={500}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhotoPreview(null)
                          setFormData((prev) => ({ ...prev, photo: null }))
                        }}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                      <div>
                        <Label htmlFor="photo" className="cursor-pointer">
                          <span className="text-emerald-600 hover:text-emerald-700 font-medium">Click to upload</span>
                          <span className="text-slate-600"> or drag and drop</span>
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  )}
                  <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
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
                    Submitting Issue...
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
