// types/profile.ts
import { baseApi } from "@/services/baseApi";

export interface ResidentDetails {
  resident_id: number;
  name: string;
  address: string;
  phone_number: string;
  nic: string;
  issue_count: number;
  badge: string;
}

export interface OfficerDetails {
  officer_id: number;
  department_name: string;
  address: string;
  phone_number: string;
}

export interface BaseProfile {
  user_id: number;
  username: string;
  role: "resident" | "urban_councilor" | "department_officer";
  profile_picture: string | null;
  status: string;
  created_at: string;
}

export interface ResidentProfile extends BaseProfile {
  role: "resident";
  resident_details: ResidentDetails;
}

export interface OfficerProfile extends BaseProfile {
  role: "department_officer";
  officer_details: OfficerDetails;
}

export interface UrbanCouncilorProfile extends BaseProfile {
  role: "urban_councilor";
  // Add councilor_details if needed
}

export type UserProfile =
  | ResidentProfile
  | OfficerProfile
  | UrbanCouncilorProfile;

// API Response Types
export interface GetProfileResponse {
  profile: UserProfile;
}

export interface UpdateProfileResponse {
  message: string;
}

export interface DeleteProfileResponse {
  message: string;
}

export interface UploadProfilePictureResponse {
  message: string;
  profile_picture: string;
}

export interface RemoveProfilePictureResponse {
  message: string;
}

// Request Types
export interface UpdateResidentProfileRequest {
  user_id: number;
  username: string;
  profile_picture?: string;
  name: string;
  address: string;
  phone_number: string;
  nic: string;
}

export interface UpdateOfficerProfileRequest {
  user_id: number;
  username: string;
  profile_picture?: string;
  department_name: string;
  officer_address: string;
  officer_phone: string;
}

export type UpdateProfileRequest =
  | UpdateResidentProfileRequest
  | UpdateOfficerProfileRequest;

export interface DeleteProfileRequest {
  user_id: number;
  role: "resident" | "department_officer";
}

export interface UploadProfilePictureRequest {
  file: File;
  user_id: number;
}

export interface RemoveProfilePictureRequest {
  user_id: number;
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/profile - Get profile by user ID
    getProfile: builder.query<GetProfileResponse, { user_id: number }>({
      query: ({ user_id }) => ({
        url: `/profile?user_id=${user_id}`,
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    // PUT /api/profile - Update profile
    updateProfile: builder.mutation<
      UpdateProfileResponse,
      UpdateProfileRequest
    >({
      query: (profileData) => ({
        url: "/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["Profile"],
    }),

    // DELETE /api/profile - Delete profile
    deleteProfile: builder.mutation<
      DeleteProfileResponse,
      DeleteProfileRequest
    >({
      query: (deleteData) => ({
        url: "/profile",
        method: "DELETE",
        body: deleteData,
      }),
      invalidatesTags: ["Profile"],
    }),

    // POST /api/profile/upload - Upload profile picture
    uploadProfilePicture: builder.mutation<
      UploadProfilePictureResponse,
      UploadProfilePictureRequest
    >({
      query: ({ file, user_id }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", user_id.toString());

        return {
          url: "/profile/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Profile"],
    }),

    // DELETE /api/profile/upload - Remove profile picture
    removeProfilePicture: builder.mutation<
      RemoveProfilePictureResponse,
      RemoveProfilePictureRequest
    >({
      query: (removeData) => ({
        url: "/profile/upload",
        method: "DELETE",
        body: removeData,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useUploadProfilePictureMutation,
  useRemoveProfilePictureMutation,
} = profileApi;

// Type guards for runtime type checking
export const isResidentProfile = (
  profile: UserProfile
): profile is ResidentProfile => {
  return profile.role === "resident";
};

export const isOfficerProfile = (
  profile: UserProfile
): profile is OfficerProfile => {
  return profile.role === "department_officer";
};

export const isUrbanCouncilorProfile = (
  profile: UserProfile
): profile is UrbanCouncilorProfile => {
  return profile.role === "urban_councilor";
};
