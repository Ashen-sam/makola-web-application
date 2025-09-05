"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Comment,
  Issue,
  User,
  useAddCommentToIssueMutation,
  useAddReplyToCommentMutation,
  useDeleteCommentMutation,
  useDeleteIssueMutation,
  useGetCommentsForIssueQuery,
  useGetIssueByIdQuery,
  useUpdateCommentMutation,
  useUpdateIssueMutation,
} from "@/services/issues";

interface UseAdminIssueProps {
  onStatusChange?: (issueId: number, newStatus: string) => void;
  onAssignOfficer?: (issueId: number, officerName: string) => void;
  onDeleteIssue?: (issueId: number) => void;
}

export const useAdminIssue = ({
  onStatusChange,
  onAssignOfficer,
  onDeleteIssue,
}: UseAdminIssueProps) => {
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Comment states
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  // Reply states
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Edit states
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // Admin states
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Photo states
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // API hooks
  const [addComment, { isLoading: isAddingComment }] =
    useAddCommentToIssueMutation();
  const [addReply, { isLoading: isAddingReply }] =
    useAddReplyToCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] =
    useUpdateCommentMutation();
  const [deleteComment, { isLoading: isDeletingComment }] =
    useDeleteCommentMutation();
  const [updateIssue] = useUpdateIssueMutation();
  const [deleteIssue] = useDeleteIssueMutation();

  // Fetch specific issue details
  const {
    data: issueData,
    isLoading: isLoadingIssue,
    error: issueError,
    refetch: refetchIssue,
  } = useGetIssueByIdQuery(issue_id);

  console.log("Fetched issue data:", issueData);

  // Comments query
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    error: commentsError,
    refetch: refetchComments,
  } = useGetCommentsForIssueQuery(issue_id, {
    skip: !hasLoadedComments,
  });

  // Initialize user from localStorage (Note: In production, avoid localStorage in artifacts)
  useEffect(() => {
    try {
      const userData =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("user")
          : null;

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } else {
        // Mock user for demo
        setCurrentUser({
          user_id: 1,
          username: "Admin User",
          role: "urban_councilor",
        });
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      // Fallback mock user
      setCurrentUser({
        user_id: 1,
        username: "Admin User",
        role: "urban_councilor",
      });
    }
  }, []);

  // User properties
  const currentUserId = currentUser?.user_id;
  const currentUserRole = currentUser?.role;

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
      replies: apiComment.replies?.map(transformComment) || [],
    });

    return commentsData.comments.map(transformComment);
  }, [commentsData]);

  // Get current comment count
  const currentCommentCount =
    transformedComments.length > 0
      ? transformedComments.length
      : issueData?.issue?.comment_count || 0;

  // Comment handlers
  const handleCommentToggle = () => {
    if (!showComments && !hasLoadedComments) {
      setHasLoadedComments(true);
    }
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to comment");
      return;
    }

    try {
      await addComment({
        issueId: issue_id,
        data: {
          content: newComment.trim(),
          user_id: Number(currentUserId),
          role: currentUserRole,
        },
      }).unwrap();

      setNewComment("");
      refetchComments();
      refetchIssue(); // Refresh issue to update comment_count
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error adding comment. Please try again.");
    }
  };

  const handleReply = async (parentCommentId: number) => {
    if (!replyContent.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to reply");
      return;
    }

    try {
      await addReply({
        issueId: issue_id,
        data: {
          content: replyContent.trim(),
          user_id: Number(currentUserId),
          role: currentUserRole,
          parent_comment_id: parentCommentId,
        },
      }).unwrap();

      setReplyContent("");
      setReplyingTo(null);
      refetchComments();
      refetchIssue();
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Error adding reply. Please try again.");
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to edit");
      return;
    }

    try {
      await updateComment({
        commentId,
        data: {
          content: editContent.trim(),
          user_id: Number(currentUserId),
          role: currentUserRole,
        },
      }).unwrap();

      setEditContent("");
      setEditingComment(null);
      refetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Error updating comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to delete");
      return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await deleteComment({
        commentId,
        data: {
          user_id: Number(currentUserId),
          role: currentUserRole,
        },
      }).unwrap();

      refetchComments();
      refetchIssue();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error deleting comment. Please try again.");
    }
  };

  // Admin handlers
  const handleStatusChange = async (newStatus: string) => {
    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to update status");
      return;
    }

    try {
      await updateIssue({
        id: issue_id,
        data: {
          status: newStatus as "open" | "in_progress" | "closed" | "resolved",
          user_id: Number(currentUserId),
          role: currentUserRole,
        },
      }).unwrap();

      if (onStatusChange) {
        onStatusChange(issue_id, newStatus);
      }
      refetchIssue();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status. Please try again.");
    }
  };

  const handleAssignOfficer = async () => {
    if (!newOfficerName.trim()) return;

    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to assign officer");
      return;
    }

    try {
      await updateIssue({
        id: issue_id,
        data: {
          assigned_officer: newOfficerName.trim(),
          user_id: Number(currentUserId),
          role: currentUserRole,
        },
      }).unwrap();

      setNewOfficerName("");
      if (onAssignOfficer) {
        onAssignOfficer(issue_id, newOfficerName.trim());
      }
      refetchIssue();
    } catch (error) {
      console.error("Error assigning officer:", error);
      alert("Error assigning officer. Please try again.");
    }
  };

  const handleDeleteIssue = async () => {
    if (!currentUser || !currentUserId || !currentUserRole) {
      alert("Please log in to delete issue");
      return;
    }

    try {
      await deleteIssue({
        id: issue_id,
        data: {
          user_id: Number(currentUserId),
          role: currentUserRole,
        },
      }).unwrap();

      if (onDeleteIssue) {
        onDeleteIssue(issue_id);
      }
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting issue:", error);
      alert("Error deleting issue. Please try again.");
    }
  };

  // Comment utility functions
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

    // User can edit their own comments
    if (comment.user_id === Number(currentUserId)) return true;

    // Urban councilors can delete any comment
    if (currentUserRole === "urban_councilor") return true;

    return false;
  };

  // Utility functions
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const formatFullDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return {
    // User data
    currentUser,
    currentUserId,
    currentUserRole,

    // States
    showComments,
    newComment,
    setNewComment,
    replyingTo,
    replyContent,
    setReplyContent,
    editingComment,
    editContent,
    setEditContent,
    showAdminActions,
    setShowAdminActions,
    newOfficerName,
    setNewOfficerName,
    showDeleteConfirm,
    setShowDeleteConfirm,
    selectedPhoto,
    setSelectedPhoto,

    // Data
    transformedComments,
    currentCommentCount,
    isLoadingComments,
    commentsError,

    // Loading states
    isAddingComment,
    isAddingReply,
    isUpdatingComment,
    isDeletingComment,

    // Handlers
    handleCommentToggle,
    handleComment,
    handleReply,
    handleEditComment,
    handleDeleteComment,
    handleStatusChange,
    handleAssignOfficer,
    handleDeleteIssue,

    // Utility functions
    cancelEditing,
    startReplying,
    cancelReplying,
    canModifyComment,
    formatTimestamp,
    formatFullDateTime,

    // Issue data
    issue: issueData?.issue,
    isLoadingIssue,
    issueError,
  };
};
