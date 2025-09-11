// types/departmentOfficer.ts
import { baseApi } from "@/services/baseApi";

export interface DepartmentStats {
  totalIssuesAssigned: number;
  resolvedIssues: number;
  inProgressIssues: number;
  newIssuesToday: number;
  resolutionRate: number;
}

export interface StatsResponse {
  department: string;
  stats: DepartmentStats;
  timestamp: string;
}

export interface Resident {
  nic?: string;
  name: string;
  address: string;
  phone_number: string;
}

export interface Issue {
  issue_id: number;
  title: string;
  photos: string[];
  category: string;
  description: string;
  status: "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  created_date: string;
  vote_count: number;
  location: string;
  latitude: number;
  longitude: number;
  date_observed: string;
  time_observed: string;
  user_id: number;
  resident_id: number;
  assigned_department: string;
  residents: Resident;
  comment_count: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Filters {
  status: string;
  priority: string;
}

export interface IssuesResponse {
  issues: Issue[];
  pagination: Pagination;
  department: string;
  filters: Filters;
}

export interface UpdateStatusRequest {
  status: "in_progress" | "resolved";
  user_id: number;
  role: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  issue: Issue;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  department: string;
  timestamp: string;
}

export interface StatsParams {
  user_id: number;
  role: string;
}

export interface IssuesParams {
  user_id: number;
  role: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

const controller = "department-officer";

export const departmentOfficerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get department officer stats
    getDepartmentOfficerStats: builder.query<StatsResponse, StatsParams>({
      query: ({ user_id, role }) => ({
        url: `/${controller}/stats`,
        params: { user_id, role },
      }),
      providesTags: ["DepartmentOfficerStats"],
    }),

    // Get department officer issues
    getDepartmentOfficerIssues: builder.query<IssuesResponse, IssuesParams>({
      query: ({ user_id, role }) => ({
        url: `/${controller}/issues`,
        params: {
          user_id,
          role,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              "DepartmentOfficerIssues",
              ...result.issues.map(({ issue_id }) => ({
                type: "Issue" as const,
                id: issue_id,
              })),
            ]
          : ["DepartmentOfficerIssues"],
    }),

    // Update issue status
    updateIssueStatus: builder.mutation<
      UpdateStatusResponse,
      { issue_id: number; data: UpdateStatusRequest }
    >({
      query: ({ issue_id, data }) => ({
        url: `${controller}/issues/${issue_id}/status`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { issue_id }) => [
        "DepartmentOfficerStats",
        "DepartmentOfficerIssues",
        { type: "Issue", id: issue_id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDepartmentOfficerStatsQuery,
  useGetDepartmentOfficerIssuesQuery,
  useUpdateIssueStatusMutation,
  useLazyGetDepartmentOfficerStatsQuery,
  useLazyGetDepartmentOfficerIssuesQuery,
} = departmentOfficerApi;
