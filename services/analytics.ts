import { baseApi } from "@/services/baseApi";

// Type definitions for the analytics API
export interface BasicStats {
  totalIssues: number;
  resolvedIssues: number;
  ongoingIssues: number;
  overallSuccessRate: number;
}

export interface LocationAnalytic {
  name: string;
  type: string;
  total: number;
  resolved: number;
  ongoing: number;
  successRate: number;
}

export interface CategoryAnalytic {
  category: string;
  count: number;
  percentage: number;
}

export interface BestPerformingLocation {
  name: string;
  successRate: number;
  resolvedCount: number;
}

export interface MostReportedLocation {
  name: string;
  totalIssues: number;
}

export interface MostReportedIssueType {
  category: string;
  percentage: number;
}

export interface AnalyticsSummary {
  bestPerformingLocation: BestPerformingLocation;
  mostReportedLocation: MostReportedLocation;
  mostReportedIssueType: MostReportedIssueType;
  overallSuccessRate: number;
}

export interface AnalyticsData {
  basicStats: BasicStats;
  locationAnalytics: LocationAnalytic[];
  categoryAnalytics: CategoryAnalytic[];
  summary: AnalyticsSummary;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

// Request parameters interface (if you need to add query parameters later)
// export interface AnalyticsRequest {
//   // Add any query parameters here if needed
//   // For example:
//   // dateFrom?: string;
//   // dateTo?: string;
//   // locationId?: string;
// }

// Inject endpoints into the base API
export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getResidentsAnalytics: builder.query<AnalyticsResponse, void>({
      query: () => ({
        url: "/analytics/residents",
        method: "GET",
      }),
      // Optional: Add tags for cache invalidation
      providesTags: ["Analytics"],
      // Optional: Transform response if needed
      transformResponse: (response: AnalyticsResponse) => response,
      // Optional: Keep cached data for 5 minutes
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

// Export hooks for use in components
export const {
  useGetResidentsAnalyticsQuery,
  useLazyGetResidentsAnalyticsQuery,
} = analyticsApi;

// Export types for use in other files
