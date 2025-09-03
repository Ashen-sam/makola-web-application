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

// Updated Comment interface with replies support
export interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user_id: number;
  issue_id: number;
  parent_comment_id: number | null;
  users: User;
  replies?: Comment[]; // For nested replies
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
  residents?: Resident;
  comments?: Comment[];
  latitude?: number;
  longitude?: number;
  comment_count?: number;
  users: User;
  user_id: number;
  assigned_officer?: string;
  assigned_department?: string; // Added for assigned officer
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
  assigned_officer?: string; // Added for assigned officer
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

interface AssignDepartmentResponse {
  message: string;
  issue: Issue;
  assigned_department: string;
  notified_officers: number;
}

interface AssignDepartmentRequest {
  department_name: string;
  user_id: string;
  role: string;
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

// Updated Comment Request Types
interface CreateCommentRequest {
  content: string;
  user_id: number;
  role: "resident" | "urban_councilor";
  parent_comment_id?: number | null; // For replies
}

interface CreateReplyRequest {
  content: string;
  user_id: number;
  role: "resident" | "urban_councilor";
  parent_comment_id: number; // Required for replies
}

// Updated Comment Response Types
export interface CreateCommentResponse {
  message: string;
  comment: Comment;
  isReply: boolean;
  parentCommentId?: number | null;
}

export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  rootComments: number;
}

export interface UpdateCommentRequest {
  content: string;
  user_id: number;
  role: "resident" | "urban_councilor";
}

export interface UpdateCommentResponse {
  message: string;
  comment: Comment;
}

export interface DeleteCommentRequest {
  user_id: number;
  role: "resident" | "urban_councilor";
}

export interface DeleteCommentResponse {
  message: string;
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

    // ===== COMMENTS API ENDPOINTS =====

    // GET - Get all comments for an issue (with nested replies)
    getCommentsForIssue: builder.query<GetCommentsResponse, number>({
      query: (issueId) => ({
        url: `/issues/${issueId}/comments`,
        method: "GET",
      }),
      transformResponse: (
        response: GetCommentsResponse
      ): GetCommentsResponse => {
        console.log("Raw comments response:", response);
        return response;
      },
      providesTags: (result, error, issueId) => [
        { type: "Comments", id: `issue-${issueId}` },
      ],
    }),

    // POST - Add a new comment to an issue (root comment)
    addCommentToIssue: builder.mutation<
      CreateCommentResponse,
      { issueId: number; data: CreateCommentRequest }
    >({
      query: ({ issueId, data }) => ({
        url: `/issues/${issueId}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { issueId }) => [
        { type: "Comments", id: `issue-${issueId}` },
        { type: "Issues", id: issueId },
      ],
    }),

    // POST - Add a reply to an existing comment
    addReplyToComment: builder.mutation<
      CreateCommentResponse,
      { issueId: number; data: CreateReplyRequest }
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

    // PUT - Update a comment (only by the comment author)
    updateComment: builder.mutation<
      UpdateCommentResponse,
      { commentId: number; data: UpdateCommentRequest }
    >({
      query: ({ commentId, data }) => ({
        url: `/comments/${commentId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { commentId }) => [
        "Comments",
        { type: "Comments", id: commentId },
      ],
    }),
    updateIssueStatus: builder.mutation<
      UpdateIssueResponse,
      {
        id: number;
        status: "open" | "in_progress" | "closed" | "resolved";
        user_id: number;
        role: "resident" | "urban_councilor";
      }
    >({
      query: ({ id, status, user_id, role }) => ({
        url: `/issues/${id}/status`,
        method: "PATCH",
        body: {
          status,
          user_id,
          role,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Issues", id },
        { type: "Issues", id: "LIST" },
        { type: "Stats", id: "LIST" },
      ],
    }),

    // DELETE - Delete a comment (by author or urban_councilor)
    deleteComment: builder.mutation<
      DeleteCommentResponse,
      { commentId: number; data: DeleteCommentRequest }
    >({
      query: ({ commentId, data }) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: (result, error, { commentId }) => [
        "Comments",
        { type: "Comments", id: commentId },
      ],
    }),
    assignDepartment: builder.mutation<
      AssignDepartmentResponse,
      { issueId: number; departmentData: AssignDepartmentRequest }
    >({
      query: ({ issueId, departmentData }) => ({
        url: `/issues/${issueId}/assign-department`,
        method: "PATCH",
        body: departmentData,
      }),
      invalidatesTags: (result, error, { issueId }) => [
        { type: "Issue", id: issueId },
        "Issue",
      ],
    }),

    // Upvote issue
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

    // Get issues by user ID
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
  // Issue hooks
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
  useUpvoteIssueMutation,
  useValidateLocationMutation,
  useGetMakolaBoundariesQuery,
  useGetIssuesByLocationQuery,
  useGetIssuesByUserIdQuery,
  useUpdateIssueStatusMutation,
  // Comment hooks
  useGetCommentsForIssueQuery,
  useAddCommentToIssueMutation,
  useAddReplyToCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useAssignDepartmentMutation,
} = issuesApi;
