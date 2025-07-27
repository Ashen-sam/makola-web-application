"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAddCommentToIssueMutation, useGetCommentsForIssueQuery, useUpvoteIssueMutation } from "@/services/issues"
import { AlertTriangle, ArrowUp, CheckCircle, Clock, Loader2, MapPin, MessageCircle, Share2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
}
interface User {
  user_id: number;
  role: "resident" | "urban_councilor";
  username: string;
}

interface IssuePostProps {
  id: string
  author: string
  avatar: string
  title: string
  description: string
  photo?: string
  location: string
  timestamp: string
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "resolved" | "closed"
  likes: number
  upvotes: number
  comments: Comment[]
  isLiked: boolean
  isUpvoted: boolean
  issueId?: string | number
  user?: User
}

export default function IssuePost({
  author,
  avatar,
  title,
  description,
  photo,
  location,
  timestamp,
  priority,
  status,
  upvotes,
  issueId,
  user,
  isUpvoted: initialIsUpvoted,
}: IssuePostProps) {
  const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted)
  const [upvoteCount, setUpvoteCount] = useState(upvotes)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [hasLoadedComments, setHasLoadedComments] = useState(false) // New state to track if comments have been loaded

  const numericIssueId = typeof issueId === 'string' ? parseInt(issueId) : issueId;
  const [addComment, { isLoading: isAddingComment }] = useAddCommentToIssueMutation()
  const [upvoteIssue] = useUpvoteIssueMutation()

  // Modified query - skip until comments are requested
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useGetCommentsForIssueQuery(numericIssueId as number, {
    skip: !hasLoadedComments || numericIssueId === undefined, // Skip until hasLoadedComments is true
  });

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Fixed transformedComments with proper type checking and error handling
  const transformedComments = useMemo(() => {
    // Add comprehensive type checking
    if (!commentsData) {
      console.log('commentsData is null/undefined');
      return [];
    }

    // Check if commentsData is an object with a comments property
    if (typeof commentsData === 'object' && !Array.isArray(commentsData)) {
      // Handle case where API returns { comments: [...] } or similar structure
      if ('comments' in commentsData && Array.isArray(commentsData.comments)) {
        return commentsData.comments.map(comment => ({
          id: comment.comment_id.toString(),
          author: comment.users?.username || 'Unknown User',
          avatar: "/placeholder.svg?height=32&width=32",
          content: comment.content,
          timestamp: formatTimestamp(comment.created_at),
        }));
      }

      // Handle case where API returns empty object {} when no comments
      console.log('commentsData is an object but not expected format:', commentsData);
      return [];
    }

    if (!Array.isArray(commentsData)) {
      console.error('commentsData is not an array:', commentsData);
      return [];
    }

    return commentsData.map(comment => ({
      id: comment.comment_id.toString(),
      author: comment.users?.username || 'Unknown User',
      avatar: "/placeholder.svg?height=32&width=32",
      content: comment.content,
      timestamp: formatTimestamp(comment.created_at),
    }));
  }, [commentsData]);

  // Modified handleCommentToggle function
  const handleCommentToggle = () => {
    if (!showComments && !hasLoadedComments) {
      // First time clicking comments - trigger API call
      setHasLoadedComments(true)
    }
    setShowComments(!showComments)
  }

  const handleComment = async () => {
    if (!newComment.trim()) return;

    if (!user) {
      return;
    }

    try {
      if (typeof numericIssueId === "number" && !isNaN(numericIssueId)) {
        await addComment({
          issueId: numericIssueId as number,
          data: {
            content: newComment.trim(),
            user_id: user.user_id,
          }
        }).unwrap();
      } else {
        throw new Error("Issue ID is not valid.");
      }

      setNewComment("");
      // Refetch comments to get the updated list
      refetchComments();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error adding comment:', error.message);
      } else {
        console.error('Error adding comment:', error);
      }
    }
  };

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

  const handleUpvote = async () => {
    if (!user) {
      return;
    }

    try {
      if (typeof numericIssueId !== "number" || isNaN(numericIssueId)) {
        throw new Error("Issue ID is not valid.");
      }
      const result = await upvoteIssue({
        issueId: numericIssueId as number,
        data: {
          user_id: user.user_id,
          action: "upvote"
        }
      }).unwrap();

      setUpvoteCount(result.vote_count);
      setIsUpvoted(!isUpvoted);
    } catch (error: unknown) {
      console.error('Error upvoting:', error);
    }
  };

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

        {photo && (
          <div className="rounded-lg overflow-hidden">
            <img src={photo} alt="Issue" className="w-full h-64 object-cover" />
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
              onClick={handleCommentToggle} // Updated to use new function
              className="flex items-center gap-2 text-slate-600 hover:text-slate-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{transformedComments.length}</span>
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
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isAddingComment ? "Adding..." : "Comment"}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : transformedComments.length > 0 ? (
                transformedComments.map((comment: Comment) => (
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
                ))
              ) : (
                <p className="text-center text-slate-500 py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}