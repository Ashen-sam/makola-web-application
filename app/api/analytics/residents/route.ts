import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Location type mapping
const LOCATION_TYPES = [
  { patterns: ["Road", "Rd"], type: "Road" },
  { patterns: ["Street", "St"], type: "Street" },
  { patterns: ["Lane", "Ln"], type: "Lane" },
  { patterns: ["Avenue", "Ave"], type: "Avenue" },
  { patterns: ["Drive"], type: "Drive" },
  { patterns: ["Boulevard"], type: "Boulevard" },
  { patterns: ["Court"], type: "Court" },
  { patterns: ["Place", "Pl"], type: "Place" },
  { patterns: ["Terrace", "Ter"], type: "Terrace" },
  { patterns: ["Circle"], type: "Circle" },
  { patterns: ["Mawatha", "Mw"], type: "Mawatha" },
];

interface LocationData {
  name: string;
  type: string;
  total: number;
  resolved: number;
  ongoing: number;
  successRate: number;
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

// Function to extract location type and name from address
function extractLocationInfo(
  location: string
): { name: string; type: string } | null {
  if (!location) return null;

  const parts = location.split(",").map((part) => part.trim());

  for (const part of parts) {
    const words = part.split(/\s+/);

    for (const locationTypeInfo of LOCATION_TYPES) {
      for (const pattern of locationTypeInfo.patterns) {
        // Check if any word in the part matches the pattern (case insensitive)
        const patternIndex = words.findIndex(
          (word) => word.toLowerCase() === pattern.toLowerCase()
        );

        if (patternIndex !== -1) {
          // Extract the name (all words before the pattern)
          const nameParts = words.slice(0, patternIndex);
          if (nameParts.length > 0) {
            const name = nameParts.join(" ");
            return {
              name: `${name} ${locationTypeInfo.type}`,
              type: locationTypeInfo.type,
            };
          }
        }
      }
    }
  }

  return null;
}

// Function to calculate percentage
function calculatePercentage(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export async function GET(request: NextRequest) {
  try {
    // Get all issues from Makola
    const { data: allIssues, error: issuesError } = await supabase
      .from("issues")
      .select("issue_id, location, status, category, created_date");

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      return NextResponse.json(
        { error: "Failed to fetch issues data" },
        { status: 500 }
      );
    }

    const issues = allIssues || [];

    // 1. Basic Statistics
    const totalIssues = issues.length;
    const resolvedIssues = issues.filter(
      (issue) => issue.status === "resolved"
    ).length;
    const ongoingIssues = issues.filter(
      (issue) => issue.status === "open" || issue.status === "in_progress"
    ).length;
    const overallSuccessRate = calculatePercentage(resolvedIssues, totalIssues);

    // 2. Location-based Analytics
    const locationMap = new Map<
      string,
      {
        total: number;
        resolved: number;
        ongoing: number;
        type: string;
      }
    >();

    issues.forEach((issue) => {
      const locationInfo = extractLocationInfo(issue.location);
      if (locationInfo) {
        const key = locationInfo.name;

        if (!locationMap.has(key)) {
          locationMap.set(key, {
            total: 0,
            resolved: 0,
            ongoing: 0,
            type: locationInfo.type,
          });
        }

        const locationData = locationMap.get(key)!;
        locationData.total++;

        if (issue.status === "resolved") {
          locationData.resolved++;
        } else if (issue.status === "open" || issue.status === "in_progress") {
          locationData.ongoing++;
        }
      }
    });

    const locationAnalytics: LocationData[] = Array.from(locationMap.entries())
      .map(([name, data]) => ({
        name,
        type: data.type,
        total: data.total,
        resolved: data.resolved,
        ongoing: data.ongoing,
        successRate: calculatePercentage(data.resolved, data.total),
      }))
      .sort((a, b) => b.total - a.total); // Sort by total issues descending

    // 3. Category Analytics (Types of Issues)
    const categoryMap = new Map<string, number>();
    issues.forEach((issue) => {
      const category = issue.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const categoryAnalytics: CategoryData[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: calculatePercentage(count, totalIssues),
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // 4. Summary Analytics
    const bestPerformingLocation = locationAnalytics.reduce((best, current) => {
      if (
        !best ||
        current.successRate > best.successRate ||
        (current.successRate === best.successRate &&
          current.resolved > best.resolved)
      ) {
        return current;
      }
      return best;
    }, null as LocationData | null);

    const mostReportedLocation =
      locationAnalytics.length > 0 ? locationAnalytics[0] : null;
    const mostReportedIssueType =
      categoryAnalytics.length > 0 ? categoryAnalytics[0] : null;

    // Response data
    const analyticsData = {
      basicStats: {
        totalIssues,
        resolvedIssues,
        ongoingIssues,
        overallSuccessRate,
      },
      locationAnalytics: locationAnalytics,
      categoryAnalytics: categoryAnalytics,
      summary: {
        bestPerformingLocation: bestPerformingLocation
          ? {
              name: bestPerformingLocation.name,
              successRate: bestPerformingLocation.successRate,
              resolvedCount: bestPerformingLocation.resolved,
            }
          : null,
        mostReportedLocation: mostReportedLocation
          ? {
              name: mostReportedLocation.name,
              totalIssues: mostReportedLocation.total,
            }
          : null,
        mostReportedIssueType: mostReportedIssueType
          ? {
              category: mostReportedIssueType.category,
              percentage: mostReportedIssueType.percentage,
            }
          : null,
        overallSuccessRate,
      },
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
