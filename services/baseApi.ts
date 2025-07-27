import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api",
    // Add authentication headers if needed
    prepareHeaders: (headers) => {
      // You can add authentication token here
      // const token = (getState() as RootState).auth.token;
      // if (token) {
      //   headers.set('authorization', `Bearer ${token}`);
      // }
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Issues", "Comments", "Residents", "Users"],
  endpoints: () => ({}),
});
