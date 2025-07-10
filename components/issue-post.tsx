"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share2, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, ArrowUp } from "lucide-react"

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
}

interface IssuePostProps {
  id: string
  author: string
  avatar: string
  title: string
  description: string
  image?: string
  location: string
  timestamp: string
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "resolved" | "closed"
  likes: number
  upvotes: number
  comments: Comment[]
  isLiked: boolean
  isUpvoted: boolean
}

export default function IssuePost({
  author,
  avatar,
  title,
  description,
  image,
  location,
  timestamp,
  priority,
  status,
  likes,
  upvotes,
  comments,
  isLiked: initialIsLiked,
  isUpvoted: initialIsUpvoted,
}: IssuePostProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted)
  const [likeCount, setLikeCount] = useState(likes)
  const [upvoteCount, setUpvoteCount] = useState(upvotes)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [postComments, setPostComments] = useState(comments)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const handleUpvote = () => {
    setIsUpvoted(!isUpvoted)
    setUpvoteCount(isUpvoted ? upvoteCount - 1 : upvoteCount + 1)
  }

  const handleComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: "You",
        avatar: "/placeholder.svg?height=32&width=32",
        content: newComment,
        timestamp: "Just now",
      }
      setPostComments([...postComments, comment])
      setNewComment("")
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
      case "open":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-3 w-3" />
      case "in-progress":
        return <Clock className="h-3 w-3" />
      case "resolved":
        return <CheckCircle className="h-3 w-3" />
      case "closed":
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900">{author}</p>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
                <span>•</span>
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={`text-xs ${getPriorityColor(priority)}`}>{priority.toUpperCase()}</Badge>
            <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              {status.replace("-", " ").toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-700 leading-relaxed">{description}</p>
        </div>

        {image && (
          <div className="rounded-lg overflow-hidden">
            <img src={image || "/placeholder.svg"} alt="Issue" className="w-full h-64 object-cover" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className={`flex items-center gap-2 ${isUpvoted
                  ? "text-emerald-600 hover:text-emerald-700 bg-emerald-50"
                  : "text-slate-600 hover:text-slate-700"
                }`}
            >
              <ArrowUp className={`h-4 w-4 ${isUpvoted ? "fill-current" : ""}`} />
              <span>{upvoteCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${isLiked ? "text-red-600 hover:text-red-700" : "text-slate-600 hover:text-slate-700"
                }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{postComments.length}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-700">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>

          {/* Priority Indicator */}
          <div className="text-xs text-slate-500">Priority: {upvoteCount} votes</div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* Add Comment */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">You</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none border-slate-300 focus:border-emerald-500"
                />
                <Button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {postComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-slate-100 text-slate-700">
                      {comment.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-semibold text-sm text-slate-900">{comment.author}</p>
                      <p className="text-slate-700 mt-1">{comment.content}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{comment.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
