"use client"
//issue post for resident and admin
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Link } from "lucide-react"
import {
  useAddCommentToIssueMutation,
  useAddReplyToCommentMutation,
  useDeleteCommentMutation,
  useGetCommentsForIssueQuery,
  useGetIssueByIdQuery,
  User,
  useUpdateCommentMutation,
  useUpvoteIssueMutation
} from "@/services/issues"
import { AlertTriangle, ArrowUp, CheckCircle, ChevronLeft, ChevronRight, Clock, Edit, Loader2, MessageCircle, Reply, Share2, Trash2, XCircle } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import toast from "react-hot-toast"
// Updated Comment interface to match API response
interface ApiComment {
  comment_id: number;
  content: string;
  created_at: string;
  user_id: number;
  issue_id: number;
  parent_comment_id: number | null;
  users: {
    role: "resident" | "urban_councilor";
    username: string;
  };
  replies?: ApiComment[];
}

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  created_at: string
  user_id: number
  parent_comment_id: number | null
  role: "resident" | "urban_councilor"
  replies?: Comment[]
}

interface IssuePostProps {
  id?: string
  author?: string
  avatar?: string
  title?: string
  description: string
  photo?: string
  photos?: string[]
  location: string
  timestamp?: string
  priority?: "low" | "medium" | "high" | "critical"
  status?: "open" | "in-progress" | "resolved" | "closed"
  likes?: number
  upvotes?: number
  comments?: Comment[]
  isLiked?: boolean
  isUpvoted: boolean
  issueId?: string | number
  created_at?: string
  comment_count?: number
  user_id?: number,
  user: {
    username: string
  };
}
export default function IssuePost({
  author,
  title,
  description,
  photo,
  photos,
  location,
  timestamp,
  priority,
  status,
  upvotes,
  issueId,
  isUpvoted: initialIsUpvoted,
  created_at,
  comment_count = 0,
}: IssuePostProps) {
  const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [upvoteCount, setUpvoteCount] = useState(upvotes)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  // Reply states
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Edit states
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")

  const numericIssueId = typeof issueId === 'string' ? parseInt(issueId) : issueId;

  // API hooks
  const [addComment, { isLoading: isAddingComment }] = useAddCommentToIssueMutation()
  const [addReply, { isLoading: isAddingReply }] = useAddReplyToCommentMutation()
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateCommentMutation()
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteCommentMutation()
  const [upvoteIssue] = useUpvoteIssueMutation()
  const { data: issueData } = useGetIssueByIdQuery(numericIssueId as number, {
    skip: !numericIssueId || isNaN(numericIssueId),

  });
  const currentStatus = issueData?.issue?.status || status;
  // Combine single photo and multiple photos
  const allPhotos = useMemo(() => {
    const photoArray = []
    if (photo) photoArray.push(photo)
    if (photos && Array.isArray(photos)) {
      photoArray.push(...photos)
    }
    return photoArray
  }, [photo, photos])

  // Modified query - skip until comments are requested
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useGetCommentsForIssueQuery(numericIssueId as number, {
    skip: !hasLoadedComments || numericIssueId === undefined,
  });


  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  const currentUserId = currentUser?.user_id;
  const currentUserRole = currentUser?.role;

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const formatFullDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Transform API comments to component format
  const transformedComments = useMemo(() => {
    if (!commentsData?.comments) {
      return [];
    }

    const transformComment = (apiComment: ApiComment): Comment => ({
      id: apiComment.comment_id.toString(),
      author: apiComment.users?.username || 'Unknown User',
      avatar: "/placeholder.svg?height=32&width=32",
      content: apiComment.content,
      timestamp: formatTimestamp(apiComment.created_at),
      created_at: apiComment.created_at,
      user_id: apiComment.user_id,
      parent_comment_id: apiComment.parent_comment_id,
      role: apiComment.users?.role || 'resident',
      replies: apiComment.replies?.map(transformComment) || []
    });

    return commentsData.comments.map(transformComment);
  }, [commentsData]);

  // Get current comment count
  const currentCommentCount = transformedComments.length > 0 ? transformedComments.length : comment_count;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/issue/${issueId}`
    const shareText = `Check out this issue: ${title}\n\nLocation: ${location}\nStatus: ${currentStatus}\n\n${shareUrl}`

    // Check if Web Share API is supported (mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `Issue: ${title}`,
          text: `Location: ${location} | Status: ${currentStatus}`,
          url: shareUrl,
        })
      } catch (error) {
        console.log('Share was cancelled or failed')
      }
    } else {
      // Fallback for desktop - show share dialog
      setShowShareDialog(true)
    }
  }
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard!')
      setShowShareDialog(false)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Link copied to clipboard!')
      setShowShareDialog(false)
    }
  }

  // Modified handleCommentToggle function
  const handleCommentToggle = () => {
    if (!showComments && !hasLoadedComments) {
      setHasLoadedComments(true)
    }
    setShowComments(!showComments)
  }

  // Handle adding root comment
  const handleComment = async () => {
    if (!newComment.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert('Please log in to comment');
      return;
    }

    try {
      if (typeof numericIssueId === "number" && !isNaN(numericIssueId)) {
        await addComment({
          issueId: numericIssueId,
          data: {
            content: newComment.trim(),
            user_id: currentUserId as number,
            role: currentUserRole,
          }
        }).unwrap();

        setNewComment("");
        refetchComments();
      } else {
        throw new Error("Issue ID is not valid.");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    }
  };

  // Handle adding reply
  const handleReply = async (parentCommentId: number) => {
    if (!replyContent.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert('Please log in to reply');
      return;
    }

    try {
      if (typeof numericIssueId === "number" && !isNaN(numericIssueId)) {
        await addReply({
          issueId: numericIssueId,
          data: {
            content: replyContent.trim(),
            user_id: currentUserId as number,
            role: currentUserRole,
            parent_comment_id: parentCommentId
          }
        }).unwrap();

        setReplyContent("");
        setReplyingTo(null);
        refetchComments();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Error adding reply. Please try again.');
    }
  };

  // Handle editing comment
  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert('Please log in to edit');
      return;
    }

    try {
      await updateComment({
        commentId,
        data: {
          content: editContent.trim(),
          user_id: currentUserId as number,
          role: currentUserRole,
        }
      }).unwrap();

      setEditContent("");
      setEditingComment(null);
      refetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Error updating comment. Please try again.');
    }
  };
  // You could create these properties when you get the user data:
  const names = currentUser?.username.trim().split(/\s+/);
  const firstName = names?.[0] || '';
  const lastName = 'ss'

  // Then use:


  // Handle deleting comment
  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser || !currentUserId || !currentUserRole) {
      alert('Please log in to delete');
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteComment({
        commentId,
        data: {
          user_id: currentUserId as number,
          role: currentUserRole,
        }
      }).unwrap();

      refetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment. Please try again.');
    }
  };

  // Start editing a comment
  const startEditing = (comment: Comment) => {
    setEditingComment(parseInt(comment.id));
    setEditContent(comment.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  // Start replying
  const startReplying = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent("");
  };

  // Cancel replying
  const cancelReplying = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  // Check if user can edit/delete comment
  const canModifyComment = (comment: Comment) => {
    if (!currentUser || !currentUserId) return false;

    // User can edit their own comments
    if (comment.user_id === currentUserId) return true;

    // Urban councilors can delete any comment
    if (currentUserRole === 'urban_councilor') return true;

    return false;
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
    if (!currentUser || !currentUserId) {
      alert('Please log in to vote');
      return;
    }

    try {
      if (typeof numericIssueId !== "number" || isNaN(numericIssueId)) {
        throw new Error("Issue ID is not valid.");
      }

      const result = await upvoteIssue({
        issueId: numericIssueId,
        data: {
          user_id: currentUserId as number,
          action: "upvote"
        }
      }).unwrap();

      setUpvoteCount(result.vote_count);
      setIsUpvoted(!isUpvoted);
    } catch (error) {
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

  // Render individual comment with replies
  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-semibold">
            {comment.author
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {editingComment === parseInt(comment.id) ? (
            // Edit mode
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none border-slate-300 focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditComment(parseInt(comment.id))}
                  disabled={!editContent.trim() || isUpdatingComment}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isUpdatingComment ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Display mode
            <>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900">{comment.author}</p>
                      <Badge className={`text-xs ${comment.role === 'urban_councilor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                        {comment.role === 'urban_councilor' ? 'Councilor' : 'Resident'}
                      </Badge>
                    </div>
                    <p className="text-slate-700 mt-1">{comment.content}</p>
                  </div>

                  {canModifyComment(comment) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {comment.user_id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(comment)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(parseInt(comment.id))}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        disabled={isDeletingComment}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-slate-500">
                  {formatTimestamp(comment.created_at)}
                </p>
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startReplying(parseInt(comment.id))}
                    className="text-xs text-slate-500 hover:text-slate-700 h-auto p-0"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reply input */}
      {replyingTo === parseInt(comment.id) && (
        <div className="ml-11 mt-2">
          <div className="flex gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder.svg?height=24&width=24" />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] resize-none border-slate-300 focus:border-emerald-500 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReply(parseInt(comment.id))}
                  disabled={!replyContent.trim() || isAddingReply}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingReply ? "Replying..." : "Reply"}
                </Button>
                <Button
                  onClick={cancelReplying}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  // Facebook-style photo grid renderer
  const renderFacebookPhotoGrid = () => {
    const photoCount = allPhotos.length;

    if (photoCount === 0) return null;

    if (photoCount === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-[400px]">
          {allPhotos.map((photo, index) => (
            <Image
              key={index}
              width={400}
              height={300}
              src={photo}
              alt={`Issue photo ${index + 1}`}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all"
              onClick={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={`grid ${photoCount === 1
          ? "grid-cols-1"
          : photoCount === 2
            ? "grid-cols-2"
            : "grid-cols-3"
          } gap-2 w-full ${photoCount === 0 ? "h-[400px]" : ""}`}
      >
        {allPhotos.slice(0, 4).map((photo, index) => (
          <Image
            width={400}
            height={300}
            key={index}
            src={photo}
            alt={`Issue photo ${index + 1}`}
            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all"
            onClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md rounded-md py-3 transition-shadow group">
      <CardHeader className="">
        <div className="flex items-start justify-between">
          <div className="flex  gap-3 items-center ">
            <Avatar className="h-10 w-10 border  flex items-center justify-center">
              <AvatarImage src={author || "/placeholder.svg"} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-md font-semibold">
                {author!
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-lg text-slate-900">{author} : </p>
              <span title={created_at ? formatFullDateTime(created_at) : undefined}>
                {created_at ? formatTimestamp(created_at) : timestamp}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={`text-xs ${getPriorityColor(priority!)}`}>{priority}</Badge>
            <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(currentStatus!)}`}>
              {getStatusIcon(currentStatus!)}
              {currentStatus?.replace("-", " ")}
            </Badge>
          </div>

        </div>


      </CardHeader>

      <CardContent className="space-y-3    ">
        <div className="bg-slate-50 px-3 py-1 rounded-md">
          <h3 className="font-semibold text-lg text-slate-900 ">{title}</h3>
          <p className="text-slate-700 text-md leading-relaxed break-all line-clamp-3 my-2 ">{description}</p>
          <div className="flex  gap-2 mt-1 text-md text-slate-600 ">

            <div className="font-semibold">Location : {location}</div>
          </div>
        </div>

        {/* Facebook-Style Photo Gallery */}
        {allPhotos.length > 0 && (
          <div className="rounded-lg overflow-hidden w-full">
            {renderFacebookPhotoGrid()}
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
              onClick={handleCommentToggle}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{currentCommentCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-700"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* Add Comment */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                  {firstName?.[0]?.toUpperCase() + lastName?.[0]?.toUpperCase()}
                </AvatarFallback>
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
            <div className="space-y-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : transformedComments.length > 0 ? (
                transformedComments
                  .filter(comment => comment.parent_comment_id === null) // Only show root comments
                  .map((comment) => renderComment(comment))
              ) : (
                <p className="text-center text-slate-500 py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Photo Modal with Navigation */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="h-[500px] p-0 overflow-hidden">
            <DialogHeader className="absolute top-0 right-0 z-10 p-2">
              <DialogTitle className="sr-only">Photo Gallery</DialogTitle>
            </DialogHeader>

            <div className="relative flex items-center justify-center p-4">
              {/* Previous Button */}
              {Array.isArray(photos) && photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={() => {
                    const currentIndex = photos.indexOf(selectedPhoto);
                    const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
                    setSelectedPhoto(photos[prevIndex]);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Previous photo</span>
                </Button>
              )}

              {/* Photo */}
              <Image
                width={900}
                height={800}
                src={selectedPhoto}
                alt="Enlarged photo"
                className="max-w-full max-h-[80vh] object-contain rounded-md"
              />

              {/* Next Button */}
              {Array.isArray(photos) && photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={() => {
                    if (Array.isArray(photos)) {
                      const currentIndex = photos.indexOf(selectedPhoto);
                      const nextIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
                      setSelectedPhoto(photos[nextIndex]);
                    }
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Next photo</span>
                </Button>
              )}
            </div>

            {/* Photo Counter */}
            {Array.isArray(photos) && photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {photos.indexOf(selectedPhoto) + 1} of {photos.length}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {showShareDialog && (
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Issue</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
                <p className="text-sm text-slate-600">Location: {location}</p>
                <p className="text-sm text-slate-600">Status: {currentStatus}</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => copyToClipboard(`${window.location.origin}/issue/${issueId}`)}
                  className="w-full justify-start gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}