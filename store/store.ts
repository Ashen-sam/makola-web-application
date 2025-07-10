import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    // auth: authReducer,
    // [authApi.reducerPath]: authApi.reducer,
    // [issueApi.reducerPath]: issueApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
