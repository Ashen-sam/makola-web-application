import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { DateTime } from "luxon";

function formatToLocalTime(utcDateStr: string): string {
  return DateTime.fromISO(utcDateStr, { zone: "utc" })
    .setZone("Asia/Colombo")
    .toFormat("yyyy-MM-dd HH:mm:ss");
}

// GET - Get all issues by user_id
export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = await Promise.resolve(params);

    console.log("Received params:", resolvedParams);
    console.log("user_id from params:", resolvedParams.user_id);

    // Also try extracting from URL as fallback
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const userIdFromPath = pathSegments[pathSegments.length - 1];

    console.log("URL pathname:", url.pathname);
    console.log("Path segments:", pathSegments);
    console.log("user_id from path:", userIdFromPath);

    const userIdString = resolvedParams.user_id || userIdFromPath;
    const userId = parseInt(userIdString);

    console.log("Final userIdString:", userIdString);
    console.log("Parsed userId:", userId);

    if (!userIdString || isNaN(userId)) {
      return NextResponse.json(
        {
          error: "Invalid user ID",
          debug: {
            params: resolvedParams,
            userIdString,
            userId,
            pathname: url.pathname,
          },
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const offset = (page - 1) * limit;

    // Build the query to get issues by user_id
    let query = supabase
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
        users (
          username
        ),
        resident_id,
        residents (
          name,
          address,
          phone_number
        )
      `
      )
      .eq("user_id", userId) // Filter by user_id directly
      .order("created_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply additional filters
    if (category) {
      query = query.eq("category", category);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: issues, error } = await query;

    if (error) {
      console.error("Get user issues error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user issues" },
        { status: 500 }
      );
    }

    // If no issues found, return empty array
    if (!issues || issues.length === 0) {
      return NextResponse.json({
        issues: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Get comment counts for all issues
    let processedIssues = [];
    const issueIds = issues.map((issue) => issue.issue_id);

    // Get comment counts for these issues
    const { data: commentCounts, error: commentError } = await supabase
      .from("comments")
      .select("issue_id")
      .in("issue_id", issueIds);

    if (commentError) {
      console.error("Comment count error:", commentError);
      processedIssues = issues.map((issue) => ({
        ...issue,
        comment_count: 0,
      }));
    } else {
      // Count comments per issue
      const commentCountMap: { [key: number]: number } = {};
      commentCounts?.forEach((comment) => {
        commentCountMap[comment.issue_id] =
          (commentCountMap[comment.issue_id] || 0) + 1;
      });

      // Add comment count to each issue
      processedIssues = issues.map((issue) => ({
        ...issue,
        comment_count: commentCountMap[issue.issue_id] || 0,
      }));
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("issues")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (category) countQuery = countQuery.eq("category", category);
    if (status) countQuery = countQuery.eq("status", status);
    if (priority) countQuery = countQuery.eq("priority", priority);

    const { count } = await countQuery;

    // Format dates to local time
    const formattedAndProcessedIssues = processedIssues.map((issue) => ({
      ...issue,
      created_date: formatToLocalTime(issue.created_date),
    }));

    return NextResponse.json({
      issues: formattedAndProcessedIssues,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      user_id: userId,
    });
  } catch (error) {
    console.error("Get user issues error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
