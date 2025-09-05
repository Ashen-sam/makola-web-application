"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useGetUsersQuery, UserRole } from "@/services/admin"
import {
  Comment,
  Issue,
  User,
  useAddCommentToIssueMutation,
  useAddReplyToCommentMutation,
  useDeleteCommentMutation,
  useGetCommentsForIssueQuery,
  useUpdateCommentMutation
} from "@/services/issues"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  MessageCircle,
  Reply,
  Trash2,
  UserCheck,
  XCircle
} from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

interface AdminIssuePostProps extends Issue {

  assignedOfficer?: string
  handleDeleteIssue?: (issueId: number) => void
  handleStatusChange?: (issueId: number, newStatus: string) => void
  handleAssignOfficer?: (issueId: number, officerName: string) => void
}

export default function AdminIssuePost({
  issue_id,
  title,
  description,
  photos,
  location,
  priority,
  status,
  comment_count = 0,
  created_date,
  users,
  photo,
  handleStatusChange,
  handleDeleteIssue,
  handleAssignOfficer,
  assignedOfficer,
}: AdminIssuePostProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)


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

  const {
    data: usersData,
    isLoading: usersLoading,
  } = useGetUsersQuery({
    admin_user_id: adminUserId,
    admin_role: adminRole ?? '',
    type: 'department_officer',
    status: 'active'
  })

  console.log('Users Data:', usersData)
  // Reply states
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Edit states
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")

  // Admin states
  const [showAdminActions, setShowAdminActions] = useState(false)
  const [newOfficerName, setNewOfficerName] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // API hooks - removed duplicates, keeping only necessary ones
  const [addComment, { isLoading: isAddingComment }] = useAddCommentToIssueMutation()
  const [addReply, { isLoading: isAddingReply }] = useAddReplyToCommentMutation()
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateCommentMutation()
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteCommentMutation()


  // Combine single photo and multiple photos
  const allPhotos = useMemo(() => {
    const photoArray: string[] = []
    if (photo) photoArray.push(photo)
    if (photos && Array.isArray(photos)) {
      photoArray.push(...photos)
    }
    return photoArray
  }, [photo, photos])

  // Comments query - skip until comments are requested
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useGetCommentsForIssueQuery(issue_id, {
    skip: !hasLoadedComments,
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

  // Utility functions
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

    const transformComment = (apiComment: Comment): Comment => ({
      comment_id: apiComment.comment_id,
      content: apiComment.content,
      created_at: apiComment.created_at,
      user_id: apiComment.user_id,
      issue_id: apiComment.issue_id,
      parent_comment_id: apiComment.parent_comment_id,
      users: apiComment.users,
      replies: apiComment.replies?.map(transformComment) || []
    });

    return commentsData.comments.map(transformComment);
  }, [commentsData]);

  // Get current comment count
  const currentCommentCount = transformedComments.length > 0 ? transformedComments.length : comment_count;

  // Comment toggle handler
  const handleCommentToggle = () => {
    if (!showComments && !hasLoadedComments) {
      setHasLoadedComments(true)
    }
    setShowComments(!showComments)
  }

  // Comment handlers - consolidated and cleaned up
  const handleComment = async () => {
    if (!newComment.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert('Please log in to comment');
      return;
    }

    try {
      await addComment({
        issueId: issue_id,
        data: {
          content: newComment.trim(),
          user_id: currentUserId as number,
          role: currentUserRole,
        }
      }).unwrap();

      setNewComment("");
      refetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    }
  };

  const handleReply = async (parentCommentId: number) => {
    if (!replyContent.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert('Please log in to reply');
      return;
    }

    try {
      await addReply({
        issueId: issue_id,
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
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Error adding reply. Please try again.');
    }
  };

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


  // Helper functions for editing/replying
  const startEditing = (comment: Comment) => {
    setEditingComment(comment.comment_id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const startReplying = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent("");
  };

  const cancelReplying = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const canModifyComment = (comment: Comment) => {
    if (!currentUser || !currentUserId) return false;
    if (comment.user_id === currentUserId) return true;
    if (currentUserRole === 'urban_councilor') return true;
    return false;
  };

  // Style helper functions
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
      case "in_progress":
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
      case "in_progress":
        return <Clock className="h-3 w-3" />
      case "resolved":
        return <CheckCircle className="h-3 w-3" />
      case "closed":
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  // Facebook-style photo grid renderer
  const renderFacebookPhotoGrid = () => {
    const photoCount = allPhotos.length;

    if (photoCount === 0) return null;

    if (photoCount === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-[400px]">
          {allPhotos.map((photo, index) => (
            <Image
              key={index + 1}
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
          } gap-2 w-full ${photoCount === 1 ? "h-[400px]" : ""}`}
      >
        {allPhotos.slice(0, 4).map((photo, index) => (
          <Image
            width={400}
            height={300}
            key={index + 1}
            src={photo}
            alt={`Issue photo ${index + 1}`}
            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all"
            onClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>
    );
  };

  // Render individual comment with replies
  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.comment_id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} group`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback className="bg-slate-100 text-slate-700">
            {comment.users?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {editingComment === comment.comment_id ? (
            // Edit mode
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none border-slate-300 focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditComment(comment.comment_id)}
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
                      <p className="font-semibold text-sm text-slate-900">
                        {comment.users?.username || 'Unknown User'}
                      </p>
                      <Badge className={`text-xs ${comment.users?.role === 'urban_councilor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {comment.users?.role === 'urban_councilor' ? 'Councilor' : 'Resident'}
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
                        onClick={() => handleDeleteComment(comment.comment_id)}
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
                    onClick={() => startReplying(comment.comment_id)}
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
      {replyingTo === comment.comment_id && (
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
                  onClick={() => handleReply(comment.comment_id)}
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

  return (
    <div className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md rounded-md py-3 transition-shadow group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10 border flex items-center justify-center">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                {users?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-lg text-slate-900">{users?.username || 'Unknown User'}</p>
              <span className="text-slate-500" title={created_date ? formatFullDateTime(created_date) : undefined}>
                {created_date ? formatTimestamp(created_date) : 'Unknown time'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge className={`text-xs ${getPriorityColor(priority!)}`}>{priority}</Badge>
            <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(status!)}`}>
              {getStatusIcon(status!)}
              {status?.replace("_", " ")}
            </Badge>
            {/* Admin Actions Toggle */}
            {currentUserRole === 'urban_councilor' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminActions(!showAdminActions)}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                Admin Actions
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="bg-slate-50 px-3 py-1 rounded-md">
          <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
          <p className="text-slate-700 text-md leading-relaxed break-words line-clamp-3">{description}</p>
          <div className="flex gap-2 mt-1 text-md text-slate-600">
            <div>Location: {location || 'Not specified'}</div>
          </div>

          {/* Show assigned officer if available */}
          {assignedOfficer && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Assigned to: <strong>{assignedOfficer}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Admin Actions Panel */}
        {showAdminActions && currentUserRole === 'urban_councilor' && (
          <div className="bg-slate-100 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Admin Actions
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Change */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Change Status:</Label>
                <Select
                  value={status}
                  onValueChange={(newStatus) => {
                    if (handleStatusChange) {
                      handleStatusChange(issue_id, newStatus);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assign Officer */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Assign Officer:</Label>
                <div className="flex gap-2">
                  <Select
                    value={newOfficerName}
                    onValueChange={setNewOfficerName}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select an officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <SelectItem value="" disabled>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading officers...
                        </SelectItem>
                      ) : (usersData?.users?.length ?? 0) > 0 ? (
                        (usersData?.users ?? []).map((user) => (
                          <SelectItem
                            key={user.user_id}
                            value={user.username}
                          >
                            {user.username} - {user.profile?.department_name || 'No Department'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No officers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleAssignOfficer && handleAssignOfficer(issue_id, newOfficerName)}
                    disabled={!newOfficerName.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-300">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Issue
              </Button>
            </div>
          </div>
        )}

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
              onClick={handleCommentToggle}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{currentCommentCount}</span>
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
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {currentUser?.username?.[0]?.toUpperCase() || 'U'}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this issue? This action cannot be undone and will remove all associated comments and data.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteIssue && handleDeleteIssue(issue_id)}
              >
                Delete Issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}