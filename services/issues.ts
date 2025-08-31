import { baseApi } from "@/services/baseApi";

// Types
interface Resident {
  name: string;
  address: string;
  phone_number: string;
  resident_id?: number;
}

export interface User {
  role: "resident" | "urban_councilor";
  username: string;
  user_id?: number | string;
}

interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user_id: number;
  issue_id: number;
  users: User;
}

export interface Issue {
  issue_id: number;
  photos: string[];
  title: string;
  photo: string | null;
  category: string;
  description: string;
  status: "open" | "in_progress" | "closed" | "resolved";
  priority: "low" | "medium" | "high";
  created_date: string;
  vote_count: number;
  address: string | null;
  resident_id: number;
  location: string | null;
  date_observed: string | null;
  time_observed: string | null;
  residents: Resident;
  comments?: Comment[];
  latitude?: number;
  longitude?: number;
  comment_count?: number;
  users: User;
  user_id: number; // Optional comment count
}

interface CreateIssueRequest {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  location?: string;
  date_observed?: string;
  time_observed?: string;
  user_id: number;
  role: "resident" | "urban_councilor";
  photo?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  status?: "open" | "in_progress" | "closed";
  location?: string;
  date_observed?: string;
  time_observed?: string;
  user_id: number;
  role: "resident" | "urban_councilor";
  latitude?: number;
  longitude?: number;
  photos?: string[];
}

// Location validation types
interface LocationValidationRequest {
  latitude: number;
  longitude: number;
}

interface LocationValidationResponse {
  valid: boolean;
  message: string;
  coordinates?: { latitude: number; longitude: number };
}

interface MakolaBoundariesResponse {
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  polygon: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
}

interface DeleteIssueRequest {
  user_id: number;
  role: "resident" | "urban_councilor";
}

interface GetIssuesResponse {
  issues: Issue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GetIssueByIdResponse {
  issue: Issue;
  comments: Comment[];
}

interface CreateIssueResponse {
  message: string;
  issue: Issue;
}

interface UpdateIssueResponse {
  message: string;
  issue: Issue;
}

interface DeleteIssueResponse {
  message: string;
}

// Query parameters for getting issues
interface GetIssuesParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: "open" | "in_progress" | "closed";
  priority?: "low" | "medium" | "high";
}

interface CreateCommentRequest {
  content: string;
  user_id: number | string;
}

interface CreateCommentResponse {
  message: string;
  comment: Comment;
}
interface GetIssuesByUserIdParams extends GetIssuesParams {
  userId: number;
}

// Issues API with injected endpoints
export const issuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL - Get all issues with pagination and filtering
    getIssues: builder.query<GetIssuesResponse, GetIssuesParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);
        if (params.status) searchParams.append("status", params.status);
        if (params.priority) searchParams.append("priority", params.priority);

        return {
          url: `issues${
            searchParams.toString() ? `?${searchParams.toString()}` : ""
          }`,
          method: "GET",
        };
      },
      providesTags: ["Issues"],
    }),

    // POST - Create new issue with location validation
    createIssue: builder.mutation<CreateIssueResponse, CreateIssueRequest>({
      query: (issueData) => ({
        url: "issues/",
        method: "POST",
        body: issueData,
      }),
      invalidatesTags: ["Issues"],
    }),

    // Location validation endpoint
    validateLocation: builder.mutation<
      LocationValidationResponse,
      LocationValidationRequest
    >({
      query: (locationData) => ({
        url: "validate-location",
        method: "POST",
        body: locationData,
      }),
    }),

    // Get Makola boundaries for map initialization
    getMakolaBoundaries: builder.query<MakolaBoundariesResponse, void>({
      query: () => ({
        url: "validate-location",
        method: "GET",
      }),
    }),

    // GET BY ID - Get issue by ID with comments
    getIssueById: builder.query<GetIssueByIdResponse, number>({
      query: (id) => ({
        url: `issues/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "Issues", id },
        { type: "Comments", id: `issue-${id}` },
      ],
    }),

    // PUT - Update existing issue
    updateIssue: builder.mutation<
      UpdateIssueResponse,
      { id: number; data: UpdateIssueRequest }
    >({
      query: ({ id, data }) => ({
        url: `issues/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Issues",
        { type: "Issues", id },
      ],
    }),

    // DELETE - Delete issue
    deleteIssue: builder.mutation<
      DeleteIssueResponse,
      { id: number; data: DeleteIssueRequest }
    >({
      query: ({ id, data }) => ({
        url: `issues/${id}`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Issues",
        { type: "Issues", id },
      ],
    }),

    // Get issues by location (within certain radius)
    getIssuesByLocation: builder.query<
      GetIssuesResponse,
      {
        latitude: number;
        longitude: number;
        radius?: number; // in kilometers
      } & GetIssuesParams
    >({
      query: ({ latitude, longitude, radius = 1, ...params }) => {
        const searchParams = new URLSearchParams();
        searchParams.append("lat", latitude.toString());
        searchParams.append("lng", longitude.toString());
        searchParams.append("radius", radius.toString());

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);
        if (params.status) searchParams.append("status", params.status);
        if (params.priority) searchParams.append("priority", params.priority);

        return {
          url: `issues/by-location?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Issues"],
    }),

    // Get issues by category
    getIssuesByCategory: builder.query<
      GetIssuesResponse,
      { category: string } & GetIssuesParams
    >({
      query: ({ category, ...params }) => {
        const searchParams = new URLSearchParams();
        searchParams.append("category", category);

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.status) searchParams.append("status", params.status);
        if (params.priority) searchParams.append("priority", params.priority);

        return {
          url: `issues?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Issues"],
    }),

    // Get issues by status
    getIssuesByStatus: builder.query<
      GetIssuesResponse,
      { status: "open" | "in_progress" | "closed" } & GetIssuesParams
    >({
      query: ({ status, ...params }) => {
        const searchParams = new URLSearchParams();
        searchParams.append("status", status);

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);
        if (params.priority) searchParams.append("priority", params.priority);

        return {
          url: `issues?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Issues"],
    }),

    // Get issues by priority
    getIssuesByPriority: builder.query<
      GetIssuesResponse,
      { priority: "low" | "medium" | "high" } & GetIssuesParams
    >({
      query: ({ priority, ...params }) => {
        const searchParams = new URLSearchParams();
        searchParams.append("priority", priority);

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);
        if (params.status) searchParams.append("status", params.status);

        return {
          url: `issues?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Issues"],
    }),

    addCommentToIssue: builder.mutation<
      CreateCommentResponse,
      { issueId: number; data: CreateCommentRequest }
    >({
      query: ({ issueId, data }) => ({
        url: `issues/${issueId}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { issueId }) => [
        { type: "Comments", id: `issue-${issueId}` },
        { type: "Issues", id: issueId },
      ],
    }),

    // FIXED: Updated to handle different response formats
    getCommentsForIssue: builder.query<Comment[], number>({
      query: (issueId) => ({
        url: `issues/${issueId}/comments`,
        method: "GET",
      }),
      // Transform response to always return an array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: any): Comment[] => {
        console.log("Raw comments response:", response);

        // If response is already an array, return it
        if (Array.isArray(response)) {
          return response;
        }

        // If response has a comments property that's an array
        if (
          response &&
          typeof response === "object" &&
          Array.isArray(response.comments)
        ) {
          return response.comments;
        }

        // If response has a data property that's an array
        if (
          response &&
          typeof response === "object" &&
          Array.isArray(response.data)
        ) {
          return response.data;
        }

        // If response is an object but empty (like {}), return empty array
        if (
          response &&
          typeof response === "object" &&
          Object.keys(response).length === 0
        ) {
          console.log("Empty comments object, returning empty array");
          return [];
        }

        // If response is an object with numeric keys (like {0: comment, 1: comment})
        if (response && typeof response === "object") {
          const values = Object.values(response);
          if (
            values.length > 0 &&
            values.every(
              (item) => item && typeof item === "object" && "comment_id" in item
            )
          ) {
            return values as Comment[];
          }
        }

        console.warn("Unexpected comments response format:", response);
        return [];
      },
      providesTags: (result, error, issueId) => [
        { type: "Comments", id: `issue-${issueId}` },
      ],
    }),

    // Update the existing getIssueById to include comments in response type
    upvoteIssue: builder.mutation<
      { message: string; vote_count: number },
      { issueId: number; data: { user_id: number; action: "upvote" } }
    >({
      query: ({ issueId, data }) => ({
        url: `issues/${issueId}/vote`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { issueId }) => [
        { type: "Issues", id: issueId },
        "Issues",
      ],
    }),
    getIssuesByUserId: builder.query<
      GetIssuesResponse,
      GetIssuesByUserIdParams
    >({
      query: ({ userId, ...params }) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);
        if (params.status) searchParams.append("status", params.status);
        if (params.priority) searchParams.append("priority", params.priority);

        return {
          url: `issues/user/${userId}${
            searchParams.toString() ? `?${searchParams.toString()}` : ""
          }`,
          method: "GET",
        };
      },
      providesTags: ["Issues"],
    }),
  }),
  overrideExisting: false,
});

// Export hooks for usage in components
export const {
  useGetIssuesQuery,
  useGetIssueByIdQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useGetIssuesByCategoryQuery,
  useGetIssuesByStatusQuery,
  useGetIssuesByPriorityQuery,
  useLazyGetIssuesQuery,
  useLazyGetIssueByIdQuery,
  useLazyGetIssuesByCategoryQuery,
  useLazyGetIssuesByStatusQuery,
  useLazyGetIssuesByPriorityQuery,
  useAddCommentToIssueMutation,
  useGetCommentsForIssueQuery,
  useUpvoteIssueMutation,
  useValidateLocationMutation,
  useGetMakolaBoundariesQuery,
  useGetIssuesByLocationQuery,
  useGetIssuesByUserIdQuery,
} = issuesApi;
