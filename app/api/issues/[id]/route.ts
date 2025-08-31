import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET - Get issue by ID with comments
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;

    // Extract ID from URL as fallback
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const idFromPath = pathSegments[pathSegments.length - 1];

    const issueId = parseInt(params.id || idFromPath);

    if (isNaN(issueId)) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
    }

    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select(
        `
        issue_id,
        title,
        photos,
        category,
        description,
        status,
        priority,
        created_date,
        vote_count,
        location,
        latitude,
        longitude,
        date_observed,
        time_observed,
        user_id,
        resident_id,
        residents (
          resident_id,
          name,
          address,
          phone_number
        )
      `
      )
      .eq("issue_id", issueId)
      .single();

    if (issueError || !issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get comments for this issue
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        comment_id,
        content,
        created_at,
        user_id,
        issue_id,
        users (
          username,
          role
        )
      `
      )
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Calculate comment count
    const commentCount = comments ? comments.length : 0;

    return NextResponse.json({
      issue: {
        ...issue,
        comment_count: commentCount,
      },
      comments: comments || [],
    });
  } catch (error) {
    console.error("Get issue by ID error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update issue
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;

    // Extract ID from URL as fallback
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const idFromPath = pathSegments[pathSegments.length - 1];

    const issueId = parseInt(params.id || idFromPath);

    const {
      title,
      photos,
      category,
      description,
      priority,
      location,
      latitude,
      longitude,
      date_observed,
      time_observed,
      status,
      user_id,
      role,
    } = await request.json();

    if (isNaN(issueId)) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
    }

    // Validate photos array if provided
    if (photos && Array.isArray(photos)) {
      if (photos.length > 4) {
        return NextResponse.json(
          { error: "Maximum 4 photos allowed" },
          { status: 400 }
        );
      }

      // Validate each photo URL
      for (const photoUrl of photos) {
        if (typeof photoUrl !== "string" || !photoUrl.trim()) {
          return NextResponse.json(
            { error: "All photo URLs must be valid strings" },
            { status: 400 }
          );
        }
      }
    }

    // Get the current issue to check ownership
    const { data: currentIssue, error: currentIssueError } = await supabase
      .from("issues")
      .select("resident_id")
      .eq("issue_id", issueId)
      .single();

    if (currentIssueError || !currentIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check authorization
    let canUpdate = false;

    if (role === "urban_councilor") {
      canUpdate = true;
    } else if (role === "resident") {
      // Check if the resident owns this issue
      const { data: resident, error: residentError } = await supabase
        .from("residents")
        .select("resident_id")
        .eq("user_id", user_id)
        .single();

      if (
        !residentError &&
        resident &&
        resident.resident_id === currentIssue.resident_id
      ) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Unauthorized to update this issue" },
        { status: 403 }
      );
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    //if (photos !== undefined) updateData.photos = JSON.stringify(photos);
    if (photos !== undefined) updateData.photos = photos;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (date_observed !== undefined) updateData.date_observed = date_observed;
    if (time_observed !== undefined) updateData.time_observed = time_observed;

    // Only admin can update status
    if (status !== undefined && role === "urban_councilor") {
      updateData.status = status;
    }

    const { data: updatedIssue, error: updateError } = await supabase
      .from("issues")
      .update(updateData)
      .eq("issue_id", issueId)
      .select(
        `
        issue_id,
        title,
        photos,
        category,
        description,
        status,
        priority,
        created_date,
        vote_count,
        location,
        latitude,
        longitude,
        date_observed,
        time_observed,
        user_id,
        resident_id,
        residents (
          name,
          address,
          phone_number
        )
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update issue" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Issue updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Update issue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete issue (unchanged from your original)
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;

    // Extract ID from URL as fallback
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const idFromPath = pathSegments[pathSegments.length - 1];

    const issueId = parseInt(params.id || idFromPath);
    const { user_id, role } = await request.json();

    if (isNaN(issueId)) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
    }

    // Get the current issue to check ownership
    const { data: currentIssue, error: currentIssueError } = await supabase
      .from("issues")
      .select("resident_id")
      .eq("issue_id", issueId)
      .single();

    if (currentIssueError || !currentIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check authorization
    let canDelete = false;

    if (role === "urban_councilor") {
      canDelete = true;
    } else if (role === "resident") {
      // Check if the resident owns this issue
      const { data: resident, error: residentError } = await supabase
        .from("residents")
        .select("resident_id")
        .eq("user_id", user_id)
        .single();

      if (
        !residentError &&
        resident &&
        resident.resident_id === currentIssue.resident_id
      ) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: "Unauthorized to delete this issue" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("issues")
      .delete()
      .eq("issue_id", issueId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete issue" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Delete issue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
