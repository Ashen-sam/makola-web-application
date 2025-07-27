import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { DateTime } from "luxon";

const MAKOLA_BOUNDARIES = {
  north: 6.981,
  south: 6.9695,
  east: 79.958,
  west: 79.94,
};

function formatToLocalTime(utcDateStr: string): string {
  return DateTime
    .fromISO(utcDateStr, { zone: 'utc' })
    .setZone('Asia/Colombo')
    .toFormat('yyyy-MM-dd HH:mm:ss');
}

// Function to validate if coordinates are within Makola area
function isWithinMakolaBoundaries(lat: number, lng: number): boolean {
  return (
    lat >= MAKOLA_BOUNDARIES.south &&
    lat <= MAKOLA_BOUNDARIES.north &&
    lng >= MAKOLA_BOUNDARIES.west &&
    lng <= MAKOLA_BOUNDARIES.east
  );
}

// GET - Get all issues (both residents and admin can access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const resident_id = searchParams.get("resident_id");

    const offset = (page - 1) * limit;

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
        resident_id,
        residents (
          name,
          address,
          phone_number
        )
      `
      )
      .order("created_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (resident_id) {
      query = query.eq("resident_id", parseInt(resident_id));
    }

    const { data: issues, error } = await query;

    if (error) {
      console.error("Get issues error:", error);
      return NextResponse.json(
        { error: "Failed to fetch issues" },
        { status: 500 }
      );
    }

    // Get comment counts for all issues
    let processedIssues = [];
    if (issues && issues.length > 0) {
      const issueIds = issues.map(issue => issue.issue_id);
      
      // Get comment counts for these issues
      const { data: commentCounts, error: commentError } = await supabase
        .from("comments")
        .select("issue_id")
        .in("issue_id", issueIds);

      if (commentError) {
        console.error("Comment count error:", commentError);
        // If comment counting fails, still return issues without comment count
        processedIssues = issues.map(issue => ({
          ...issue,
          comment_count: 0
        }));
      } else {
        // Count comments per issue
        const commentCountMap: { [key: number]: number } = {};
        commentCounts?.forEach(comment => {
          commentCountMap[comment.issue_id] = (commentCountMap[comment.issue_id] || 0) + 1;
        });

        // Add comment count to each issue
        processedIssues = issues.map(issue => ({
          ...issue,
          comment_count: commentCountMap[issue.issue_id] || 0
        }));
      }
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("issues")
      .select("*", { count: "exact", head: true });

    if (category) countQuery = countQuery.eq("category", category);
    if (status) countQuery = countQuery.eq("status", status);
    if (priority) countQuery = countQuery.eq("priority", priority);
    if (resident_id)
      countQuery = countQuery.eq("resident_id", parseInt(resident_id));

    const { count } = await countQuery;

    const formattedAndProcessedIssues = processedIssues.map(issue => ({
      ...issue,
      created_date: formatToLocalTime(issue.created_date)
    }));

    return NextResponse.json({
      issues: formattedAndProcessedIssues,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get issues error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new issue (only residents can create)
export async function POST(request: NextRequest) {
  try {
    const {
      title,
      photos = [], 
      category,
      description,
      priority = "medium",
      location,
      latitude,
      longitude,
      date_observed,
      time_observed,
      user_id,
      role,
    } = await request.json();

    // Validate required fields
    if (!title || !category || !user_id || role !== "resident") {
      return NextResponse.json(
        {
          error:
            'Title, category, user_id, and role as "resident" are required',
        },
        { status: 400 }
      );
    }

    // Validate photos array
    if (photos && Array.isArray(photos)) {
      if (photos.length > 4) {
        return NextResponse.json(
          { error: "Maximum 4 photos allowed" },
          { status: 400 }
        );
      }
      
      // Validate each photo URL
      for (const photoUrl of photos) {
        if (typeof photoUrl !== 'string' || !photoUrl.trim()) {
          return NextResponse.json(
            { error: "All photo URLs must be valid strings" },
            { status: 400 }
          );
        }
      }
    }

    // Validate coordinates if provided
    if (latitude && longitude) {
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return NextResponse.json(
          { error: "Latitude and longitude must be valid numbers" },
          { status: 400 }
        );
      }

      // Check if coordinates are within Makola boundaries
      if (!isWithinMakolaBoundaries(latitude, longitude)) {
        return NextResponse.json(
          {
            error:
              "Selected location is outside Makola area. Please select a location within Makola boundaries.",
          },
          { status: 400 }
        );
      }
    }

    // Map user_id to resident_id
    const { data: resident, error: residentError } = await supabase
      .from("residents")
      .select("resident_id")
      .eq("user_id", user_id)
      .single();

    if (residentError || !resident) {
      return NextResponse.json(
        { error: "Resident not found for given user_id" },
        { status: 400 }
      );
    }

    const issueData = {
      title,
      // photos: JSON.stringify(photos), // Store as JSON
      photos,
      category,
      description,
      priority,
      location,
      latitude,
      longitude,
      date_observed,
      time_observed,
      resident_id: resident.resident_id,
      status: "open",
      vote_count: 0,
      // created_date will be automatically set by DEFAULT CURRENT_TIMESTAMP
    };

    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .insert(issueData)
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

    if (issueError) {
      console.error("Issue creation error:", issueError);
      return NextResponse.json(
        { error: "Failed to create issue" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Issue created successfully",
        issue,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}