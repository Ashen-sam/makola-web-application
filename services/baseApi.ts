import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api",
    prepareHeaders: (headers) => {
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "Issues",
    "Comments",
    "Residents",
    "Users",
    "AdminUserStats",
    "AdminUser",
    "Issue",
    "Stats",
  ],
  endpoints: () => ({}),
});
