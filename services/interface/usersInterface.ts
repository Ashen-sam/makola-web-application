export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  username: string;
  password: string;
  address: string;
  phone_number: string;
  nic: string;
}

export interface BaseUser {
  user_id: number;
  email: string;
  role: "resident" | "urban_councilor";
}

export interface ResidentUser extends BaseUser {
  role: "resident";
  resident_id: number;
  name: string;
  address: string;
  phone_number: string;
  nic: string;
}

export interface UrbanCouncilorUser extends BaseUser {
  role: "urban_councilor";
}

export interface AuthResponseSignIn {
  message: string;
  user: ResidentUser | UrbanCouncilorUser;
}

export interface SignUpSuccessResponse {
  message: string;
  user: {
    user_id: number;
    role: "resident" | "urban_councilor";
    resident_id?: number;
    name: string;
  };
}

export interface SignUpErrorResponse {
  success: false;
  message: string;
}

export type SignUpResponse = SignUpSuccessResponse | SignUpErrorResponse;
