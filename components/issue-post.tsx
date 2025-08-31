"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAddCommentToIssueMutation, useGetCommentsForIssueQuery, User, useUpvoteIssueMutation } from "@/services/issues"
import { AlertTriangle, ArrowUp, CheckCircle, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, MessageCircle, Share2, XCircle } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  created_at: string
}


interface IssuePostProps {
  id?: string
  author?: string
  avatar?: string
  title?: string
  description: string
  photo?: string
  photos?: string[] // New prop for multiple photos
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
  user?: string
  created_at?: string // New prop for creation date/time
  comment_count?: number
  user_id?: number
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

  const numericIssueId = typeof issueId === 'string' ? parseInt(issueId) : issueId;
  const [addComment, { isLoading: isAddingComment }] = useAddCommentToIssueMutation()
  const [upvoteIssue] = useUpvoteIssueMutation()

  // Combine single photo and multiple photos
  const allPhotos = useMemo(() => {
    const photoArray = []
    if (photo) photoArray.push(photo)
    if (photos && Array.isArray(photos)) {
      photoArray.push(...photos)
    }
    console.log('Combined photos:', photoArray); // Debug log
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
        console.log('User data loaded:', parsedUser); // Debug log
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setCurrentUser(null);
      }
    } else {
      console.log('No user data found in localStorage');
      setCurrentUser(null);
    }
  }, []);
  const currentUserId = currentUser?.user_id || currentUser?.user_id;

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

  // Define the expected API response type for comments
  type IssueCommentsApiResponse = {
    comments: Array<{
      comment_id: string | number;
      users?: { username?: string };
      content: string;
      created_at: string;
    }>;
  };

  // Fixed transformedComments with proper type checking and error handling
  const transformedComments = useMemo(() => {
    if (!commentsData) {
      console.log('commentsData is null/undefined');
      return [];
    }

    // If commentsData is an object with a 'comments' array
    if (
      typeof commentsData === 'object' &&
      commentsData !== null &&
      'comments' in commentsData &&
      Array.isArray((commentsData as IssueCommentsApiResponse).comments)
    ) {
      return (commentsData as IssueCommentsApiResponse).comments.map(comment => ({
        id: comment.comment_id.toString(),
        author: comment.users?.username || 'Unknown User',
        avatar: "/placeholder.svg?height=32&width=32",
        content: comment.content,
        timestamp: formatTimestamp(comment.created_at),
        created_at: formatTimestamp(comment.created_at),
      }));
    }

    // If commentsData is an array (fallback)
    if (Array.isArray(commentsData)) {
      return commentsData.map(comment => ({
        id: comment.comment_id.toString(),
        author: comment.users?.username || 'Unknown User',
        avatar: "/placeholder.svg?height=32&width=32",
        content: comment.content,
        timestamp: formatTimestamp(comment.created_at),
        created_at: formatTimestamp(comment.created_at),
      }));
    }

    console.log('commentsData is not in expected format:', commentsData);
    return [];
  }, [commentsData]);

  // Get current comment count (from API if available, fallback to prop)
  const currentCommentCount = transformedComments.length > 0 ? transformedComments.length : comment_count;

  // Modified handleCommentToggle function
  const handleCommentToggle = () => {
    if (!showComments && !hasLoadedComments) {
      setHasLoadedComments(true)
    }
    setShowComments(!showComments)
  }

  const handleComment = async () => {
    if (!newComment.trim()) return;


    if (!currentUser) {
      console.error('User not logged in');
      alert('Please log in to comment');
      return;
    }

    if (!currentUserId) {
      alert('User ID missing. Please log in again.');
      return;
    }

    try {
      if (typeof numericIssueId === "number" && !isNaN(numericIssueId)) {
        await addComment({
          issueId: numericIssueId as number,
          data: {
            content: newComment.trim(),
            user_id: currentUserId!,
          }
        }).unwrap();

        setNewComment("");
        refetchComments();
      } else {
        throw new Error("Issue ID is not valid.");
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
      if (error instanceof Error) {
        alert(`Error adding comment: ${error.message}`);
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

    if (!currentUser) {
      console.error('User not logged in');
      alert('Please log in to vote');
      return;
    }

    if (!currentUserId) {
      alert('User ID missing. Please log in again.');
      return;
    }

    try {
      if (typeof numericIssueId !== "number" || isNaN(numericIssueId)) {
        throw new Error("Issue ID is not valid.");
      }

      const result = await upvoteIssue({
        issueId: numericIssueId as number,
        data: {
          user_id: currentUserId as number,
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

  // Facebook-style photo grid renderer - Updated to show maximum 4   photos in one frame
  const renderFacebookPhotoGrid = () => {
    const photoCount = allPhotos.length;

    if (photoCount === 0) return null;

    // If exactly 4 images – show 2x2 grid (100% width)
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

    // Fallback for other image counts
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
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border flex items-center justify-center">
              <AvatarImage src={author || "/placeholder.svg"} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                {author!
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
                <span title={created_at ? formatFullDateTime(created_at) : undefined}>
                  {created_at ? formatTimestamp(created_at) : timestamp}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={`text-xs ${getPriorityColor(priority!)}`}>{priority?.toUpperCase()}</Badge>
            <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(status!)}`}>
              {getStatusIcon(status!)}
              {status?.replace("-", " ").toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-700 text-sm leading-relaxed break-all line-clamp-3">{description}</p>
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

            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-700">
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
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
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
                      <p className="text-xs text-slate-500 mt-1" >
                        {comment.created_at ? formatTimestamp(comment.created_at) : comment.timestamp}

                      </p>
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

      {/* Photo Modal with Navigation */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className=" h-[500px] p-0 overflow-hidden">
            <DialogHeader className="absolute top-0 right-0 z-10 p-2">
              <DialogTitle className="">
              </DialogTitle>

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
    </Card>
  )
}