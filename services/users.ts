import { baseApi } from "./baseApi";
import {
  AuthResponseSignIn,
  SignInRequest,
  SignUpRequest,
  SignUpResponse,
} from "./interface/usersInterface";

const usersAuthController = "/users";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signIn: builder.mutation<AuthResponseSignIn, SignInRequest>({
      query: (credentials) => ({
        url: `${usersAuthController}/sign-in`,
        method: "POST",
        body: credentials,
      }),
    }),
    signUp: builder.mutation<SignUpResponse, SignUpRequest>({
      query: (userData) => ({
        url: `${usersAuthController}/sign-up`,
        method: "POST",
        body: userData,
      }),
    }),
  }),
});

export const { useSignInMutation, useSignUpMutation } = authApi;
