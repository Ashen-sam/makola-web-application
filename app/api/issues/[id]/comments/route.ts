import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getSocketIO } from "../../../../../lib/socketService";

// GET - Get all comments for an issue with nested replies
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const issueId = parseInt(resolvedParams.id);

    if (isNaN(issueId)) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        comment_id,
        content,
        created_at,
        user_id,
        issue_id,
        parent_comment_id,
        users (
          username,
          role
        )
      `
      )
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Organize comments with replies (nested structure)
    const commentsMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    comments?.forEach((comment) => {
      commentsMap.set(comment.comment_id, {
        ...comment,
        replies: [],
      });
    });

    // Second pass: organize into parent-child structure
    comments?.forEach((comment) => {
      if (comment.parent_comment_id) {
        // This is a reply
        const parentComment = commentsMap.get(comment.parent_comment_id);
        if (parentComment) {
          parentComment.replies.push(commentsMap.get(comment.comment_id));
        }
      } else {
        // This is a root comment
        rootComments.push(commentsMap.get(comment.comment_id));
      }
    });

    return NextResponse.json({
      comments: rootComments,
      total: comments?.length || 0,
      rootComments: rootComments.length,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a comment or reply to an issue
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const issueId = parseInt(resolvedParams.id);
    const { content, user_id, role, parent_comment_id } = await request.json();

    if (isNaN(issueId)) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
    }

    if (!content || !user_id || !role) {
      return NextResponse.json(
        { error: "Content, user_id, and role are required" },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Comment content cannot exceed 1000 characters" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["resident", "urban_councilor", "department_officer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if issue exists and get issue details
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("issue_id, title, user_id")
      .eq("issue_id", issueId)
      .single();

    if (issueError || !issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check if user exists and verify role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, username, role")
      .eq("user_id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify role matches
    if (user.role !== role) {
      return NextResponse.json({ error: "Role mismatch" }, { status: 403 });
    }

    // If it's a reply, validate parent comment exists and belongs to this issue
    let parentComment = null;
    if (parent_comment_id) {
      const { data: parentCommentData, error: parentError } = await supabase
        .from("comments")
        .select(
          `
          comment_id, 
          issue_id, 
          user_id,
          users (
            username,
            role
          )
        `
        )
        .eq("comment_id", parent_comment_id)
        .eq("issue_id", issueId)
        .single();

      if (parentError || !parentCommentData) {
        return NextResponse.json(
          {
            error: "Parent comment not found or does not belong to this issue",
          },
          { status: 404 }
        );
      }

      parentComment = parentCommentData;
    }

    // Create comment or reply
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        content,
        user_id,
        issue_id: issueId,
        parent_comment_id: parent_comment_id || null,
      })
      .select(
        `
        comment_id,
        content,
        created_at,
        user_id,
        issue_id,
        parent_comment_id,
        users (
          username,
          role
        )
      `
      )
      .single();

    if (commentError) {
      console.error("Comment creation error:", commentError);
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: 500 }
      );
    }

    // Create notifications
    const notificationsToCreate = [];

    // 1. Notify issue owner if commenter is not the owner
    if (issue.user_id && issue.user_id !== user_id) {
      const isReply = parent_comment_id ? true : false;
      const notificationMessage =
        role === "urban_councilor"
          ? isReply
            ? `Admin replied to a comment on your issue "${issue.title}".`
            : `Admin commented on your issue "${issue.title}".`
          : isReply
          ? `Someone replied to a comment on your issue "${issue.title}".`
          : `Someone commented on your issue "${issue.title}".`;

      notificationsToCreate.push({
        userId: issue.user_id,
        message: notificationMessage,
        type: "issue_owner",
      });
    }

    // 2. If it's a reply, notify the original commenter (if different from issue owner and current user)
    if (
      parentComment &&
      parentComment.user_id &&
      parentComment.user_id !== user_id &&
      parentComment.user_id !== issue.user_id
    ) {
      const replyMessage =
        role === "urban_councilor"
          ? `Admin replied to your comment on issue "${issue.title}".`
          : `Someone replied to your comment on issue "${issue.title}".`;

      notificationsToCreate.push({
        userId: parentComment.user_id,
        message: replyMessage,
        type: "comment_reply",
      });
    }

    // Create all notifications
    for (const notificationData of notificationsToCreate) {
      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          message: notificationData.message,
        })
        .select("notification_id")
        .single();

      if (!notificationError && notification) {
        // Get resident_id for the user (only residents have resident_id)
        const { data: resident, error: residentError } = await supabase
          .from("residents")
          .select("resident_id")
          .eq("user_id", notificationData.userId)
          .single();

        if (!residentError && resident) {
          await supabase.from("resident_notifications").insert({
            resident_id: resident.resident_id,
            notification_id: notification.notification_id,
            read_status: false,
          });
        }
      }
    }

    // Initialize Socket.IO if not already done
    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"
        }/api/socket/io`
      );
    } catch (socketInitError) {
      console.log("Socket.IO initialization skipped");
    }

    // Emit socket event for real-time comment updates
    const socketIO = getSocketIO();
    if (socketIO) {
      const eventName = parent_comment_id ? "newReply" : "newComment";

      socketIO.emit(eventName, {
        issueId: issueId,
        comment: comment,
        parentCommentId: parent_comment_id,
        timestamp: new Date().toISOString(),
      });

      // Send real-time notifications to affected users
      for (const notificationData of notificationsToCreate) {
        socketIO.to(`user_${notificationData.userId}`).emit("notification", {
          issueId: issueId,
          issueTitle: issue.title,
          commenterRole: role,
          commenterUsername: user.username,
          message: notificationData.message,
          type: notificationData.type,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        message: parent_comment_id
          ? "Reply added successfully"
          : "Comment added successfully",
        comment,
        isReply: !!parent_comment_id,
        parentCommentId: parent_comment_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add comment/reply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
