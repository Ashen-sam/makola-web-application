import { baseApi } from "@/services/baseApi";

export type UserRole =
  | "resident"
  | "urban_councilor"
  | "department_officer"
  | string;
export type UserStatus = "active" | "suspended";

export interface BaseUser {
  user_id: number;
  username: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  address: string;
  phoneNumber: string;
  nic: string;
  profile?: Profile[];
}

export interface Profile {
  resident_id: number;
  name: string;
  address: string;
  phoneNumber: string;
  nic: string;
  department_name?: string;
}

export interface UserWithProfile extends BaseUser {
  profile?: Profile;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalDepartments: number;
  residentsThisWeek: number;
  residentsToday: number;
  recentUsers: BaseUser[];
}

// Response types
export interface GetUsersStatsResponse {
  statistics: UserStatistics;
  timestamp: string;
  message: string;
}

export interface GetUsersResponse {
  users: BaseUser[];
  total: number;
  filters: {
    userType: string;
    status: string;
  };
}

export interface GetUserResponse {
  user: BaseUser;
}

export interface CreateUserResponse {
  message: string;
  user: UserWithProfile;
}

export interface UpdateUserResponse {
  message: string;
  user: BaseUser;
}

export interface UpdateUserStatusResponse {
  message: string;
  user: BaseUser;
  previousStatus: UserStatus;
  newStatus: UserStatus;
  reason: string;
}

export interface DeleteUserResponse {
  message: string;
  deletedUser: {
    user_id: number;
    username: string;
    role: UserRole;
  };
}

// Request types
export interface GetUsersStatsRequest {
  admin_user_id: number;
  admin_role: UserRole;
}

export interface GetUsersRequest {
  admin_user_id: number;
  admin_role: UserRole;
  type?: "all" | "resident" | "department_officer" | "urban_councilor";
  status?: "all" | "active" | "suspended";
}

export interface GetUserRequest {
  user_id: number;
  admin_user_id: number;
  admin_role: UserRole;
}

export interface CreateResidentRequest {
  username: string;
  password: string;
  userType: "resident";
  admin_user_id: string;
  admin_role: UserRole;
  name: string;
  address: string;
  phone_number: string;
  nic: string;
}

export interface CreateDepartmentOfficerRequest {
  username: string;
  password: string;
  userType: "department_officer";
  admin_user_id: string;
  admin_role: UserRole;
  department_name: string;
  address: string;
  phone_number: string;
}

export type CreateUserRequest =
  | CreateResidentRequest
  | CreateDepartmentOfficerRequest;

export interface UpdateResidentRequest {
  username?: string;
  password?: string;
  admin_user_id: string;
  admin_role: UserRole;
  name?: string;
  address?: string;
  phone_number?: string;
  nic?: string;
}

export interface UpdateDepartmentOfficerRequest {
  username?: string;
  password?: string;
  admin_user_id: string;
  admin_role: UserRole;
  department_name?: string;
  address?: string;
  phone_number?: string;
}

export type UpdateUserRequest =
  | UpdateResidentRequest
  | UpdateDepartmentOfficerRequest;

export interface UpdateUserStatusRequest {
  user_id: number;
  status: UserStatus;
  admin_user_id: string;
  admin_role: UserRole;
  reason: string;
}

export interface DeleteUserRequest {
  user_id: number;
  admin_user_id: number;
  admin_role: UserRole;
}

// RTK Query API
const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /admin/users/stats
    getUsersStats: builder.query<GetUsersStatsResponse, GetUsersStatsRequest>({
      query: ({ admin_user_id, admin_role }) => ({
        url: `admin/users/stats`,
        params: {
          admin_user_id,
          admin_role,
        },
      }),
      providesTags: ["AdminUserStats"],
    }),

    // GET /admin/users
    getUsers: builder.query<GetUsersResponse, GetUsersRequest>({
      query: ({ admin_user_id, admin_role, type = "all", status = "all" }) => ({
        url: `admin/users`,
        params: {
          admin_user_id,
          admin_role,
          type,
          status,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ user_id }) => ({
                type: "AdminUser" as const,
                id: user_id,
              })),
              { type: "AdminUser", id: "LIST" },
            ]
          : [{ type: "AdminUser", id: "LIST" }],
    }),

    // GET /admin/users/:id
    getUser: builder.query<GetUserResponse, GetUserRequest>({
      query: ({ user_id, admin_user_id, admin_role }) => ({
        url: `admin/users/${user_id}`,
        params: {
          admin_user_id,
          admin_role,
        },
      }),
      providesTags: (result, error, { user_id }) => [
        { type: "AdminUser", id: user_id },
      ],
    }),

    // POST /admin/users
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest>({
      query: (userData) => ({
        url: `admin/users`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: [{ type: "AdminUser", id: "LIST" }, "AdminUserStats"],
    }),

    // PUT /admin/users/:id
    updateUser: builder.mutation<
      UpdateUserResponse,
      { user_id: number } & UpdateUserRequest
    >({
      query: ({ user_id, ...userData }) => ({
        url: `admin/users/${user_id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: (result, error, { user_id }) => [
        { type: "AdminUser", id: user_id },
        { type: "AdminUser", id: "LIST" },
        "AdminUserStats",
      ],
    }),

    // PATCH /admin/users/:id/status
    updateUserStatus: builder.mutation<
      UpdateUserStatusResponse,
      UpdateUserStatusRequest
    >({
      query: ({ user_id, ...statusData }) => ({
        url: `admin/users/${user_id}/status`,
        method: "PATCH",
        body: statusData,
      }),
      invalidatesTags: (result, error, { user_id }) => [
        { type: "AdminUser", id: user_id },
        { type: "AdminUser", id: "LIST" },
        "AdminUserStats",
      ],
    }),

    // DELETE /admin/users/:id
    deleteUser: builder.mutation<DeleteUserResponse, DeleteUserRequest>({
      query: ({ user_id, admin_user_id, admin_role }) => ({
        url: `admin/users/${user_id}`,
        method: "DELETE",
        params: {
          admin_user_id,
          admin_role,
        },
      }),
      invalidatesTags: (result, error, { user_id }) => [
        { type: "AdminUser", id: user_id },
        { type: "AdminUser", id: "LIST" },
        "AdminUserStats",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersStatsQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  // Lazy query hooks
  useLazyGetUsersStatsQuery,
  useLazyGetUsersQuery,
  useLazyGetUserQuery,
} = adminUsersApi;

export default adminUsersApi;
