"use client"
//officer issue post component
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Comment,
    Issue,
    useAddCommentToIssueMutation,
    useAddReplyToCommentMutation,
    useDeleteCommentMutation,
    useGetCommentsForIssueQuery,
    User,
    useUpdateCommentMutation
} from "@/services/issues"
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Edit,
    Edit3,
    Eye,
    Loader2,
    MessageCircle,
    Reply,
    Trash2,
    Calendar,
    MapPin,
    Phone,
    ArrowUp
} from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

interface OfficerIssuePostProps extends Issue {
    handleStatusChange?: (issueId: number, newStatus: string) => void
    handleAddComment?: (issueId: number, comment: string) => void
    isUpdatingStatus?: boolean
    assigned_officer?: string
    department?: string

}

export default function OfficerIssuePost({
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
    handleAddComment,
    isUpdatingStatus,
    assigned_officer,
    department,
    vote_count,
    residents,
    date_observed,
    time_observed,
}: OfficerIssuePostProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [hasLoadedComments, setHasLoadedComments] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [statusUpdate, setStatusUpdate] = useState("")

    // Reply states
    const [replyingTo, setReplyingTo] = useState<number | null>(null)
    const [replyContent, setReplyContent] = useState("")

    // Edit states
    const [editingComment, setEditingComment] = useState<number | null>(null)
    const [editContent, setEditContent] = useState("")

    // API hooks
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

    console.log(issue_id, 'issue id')

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

    // Comment handlers
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
        // Only allow users to modify their own comments
        return comment.user_id === currentUserId;
    };

    // Officer action handlers



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
            case "assigned":
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
            case "assigned":
                return <AlertTriangle className="h-3 w-3" />
            case "in_progress":
                return <Clock className="h-3 w-3" />
            case "resolved":
                return <CheckCircle className="h-3 w-3" />
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
                                            <Badge className={`text-xs ${comment.users?.role === 'department_officer'
                                                ? 'bg-green-100 text-green-800'
                                                : comment.users?.role === 'urban_councilor'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {comment.users?.role === 'department_officer' ? 'Officer' :
                                                    comment.users?.role === 'urban_councilor' ? 'Councilor' : 'Resident'}
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
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-md font-semibold">
                                {users?.username
                                    ? users.username
                                        .split(" ") // split by space
                                        .map((n) => n[0]?.toUpperCase()) // take first letter of each part
                                        .join("") // join them together
                                    : "U"}
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
                            {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                            {getStatusIcon(status!)}
                            {status?.replace("_", " ")}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="bg-slate-50 px-3 py-1 rounded-md">
                    <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
                    <p className="text-slate-700 text-md leading-relaxed break-words line-clamp-3">{description}</p>
                    <div className="flex gap-2 mt-1 text-md text-slate-600">
                        <div className=" font-semibold">Location: {location || 'Not specified'}</div>
                    </div>

                    {/* Show assigned officer and department if available */}
                    {assigned_officer && department && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50 rounded">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm text-emerald-800">
                                Assigned to you ({department})
                            </span>
                        </div>
                    )}
                </div>

                {/* Officer Actions Panel */}
                <div className="bg-slate-100 p-4 rounded-lg space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        Officer Actions
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Update */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Update Status:</Label>
                            <div className="flex gap-2">
                                <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                                    <SelectTrigger className="flex-1 bg-white">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleStatusChange ? () => handleStatusChange(issue_id, statusUpdate) : undefined}
                                    disabled={!statusUpdate || isUpdatingStatus}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                    </div>

                    {/* View Details Button */}
                    <div className="flex gap-2 pt-2 border-t border-slate-300">
                        <Dialog open={showDetails} onOpenChange={setShowDetails} >
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    View Full Details
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                <DialogHeader className="flex-shrink-0 pb-4 border-b">
                                    <DialogTitle className="text-left">Issue Details</DialogTitle>
                                </DialogHeader>

                                <div className="flex-1 overflow-y-auto">
                                    <div className="space-y-6 p-1">
                                        {/* Issue Header - Responsive Layout */}
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 line-clamp-2 break-words">
                                                    {title}
                                                </h2>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge className={getPriorityColor(priority!)}>
                                                        {priority?.toUpperCase()}
                                                    </Badge>
                                                    <Badge className={getStatusColor(status!)}>
                                                        {status?.replace("_", " ").toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Issue Photo - Responsive */}
                                        {allPhotos.length > 0 && (
                                            <div className="w-full">
                                                <div className="rounded-lg overflow-hidden bg-slate-50">
                                                    {renderFacebookPhotoGrid()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        <div>
                                            <h3 className="font-semibold mb-2 text-lg">Description</h3>
                                            <p className="text-slate-700 leading-relaxed break-words">
                                                {description}
                                            </p>
                                        </div>

                                        {/* Issue Metadata - Responsive Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-semibold mb-3 text-lg">Location Details</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-500" />
                                                        <span className="break-words">{location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-3 text-lg">Issue Stats</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUp className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                                        <span>{vote_count} upvotes</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                                        <span>{currentCommentCount} comments</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Observer Information - Responsive */}
                                        {date_observed && time_observed && (
                                            <div>
                                                <h3 className="font-semibold mb-3 text-lg">Observation Details</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                                        <span>Date: {new Date(date_observed).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                                        <span>Time: {time_observed}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reporter Contact Info */}
                                        {residents && (
                                            <div>
                                                <h3 className="font-semibold mb-3 text-lg">Reporter Contact</h3>
                                                <div className="space-y-2 text-sm">
                                                    {residents.phone_number && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                                            <span className="break-all">{residents.phone_number}</span>
                                                        </div>
                                                    )}
                                                    {residents.address && (
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-500" />
                                                            <p className="text-slate-600 break-words">{residents.address}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
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
                                    onClick={() => {
                                        if (handleAddComment) {
                                            handleAddComment(issue_id, newComment);
                                            // setNewComment("");
                                            // setShowComments(true);
                                        }
                                    }}
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

            {/* Photo Modal */}
            {selectedPhoto && (
                <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Issue Photo</DialogTitle>
                        </DialogHeader>
                        <Image
                            src={selectedPhoto}
                            alt="Issue photo"
                            width={800}
                            height={600}
                            className="w-full h-auto object-contain rounded-lg"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}