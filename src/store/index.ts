import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { apiSlice } from "./api/apiSlice";
import { toastMiddleware } from "./middleware/toastMiddleware";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import clientsReducer from "./slices/clientsSlice";
import jobsReducer from "./slices/jobsSlice";
import candidatesReducer from "./slices/candidatesSlice";
import applicationsReducer from "./slices/applicationsSlice";
import emailsReducer from "./slices/emailsSlice";
import categoriesReducer from "./slices/categoriesSlice";
import tagsReducer from "./slices/tagsSlice";
import pipelinesReducer from "./slices/pipelinesSlice";
import interviewsReducer from "./slices/interviewsSlice";
import teamReducer from "./slices/teamSlice";
import usersReducer from "./slices/usersSlice";
import notificationsReducer from "./slices/notificationsSlice";
import messagesReducer from "./slices/messagesSlice";
import emailTemplatesReducer from "./slices/emailTemplatesSlice";

export const store = configureStore({
  reducer: {
    // API slice
    [apiSlice.reducerPath]: apiSlice.reducer,

    // Feature slices
    auth: authReducer,
    ui: uiReducer,
    users: usersReducer,
    clients: clientsReducer,
    jobs: jobsReducer,
    candidates: candidatesReducer,
    applications: applicationsReducer,
    emails: emailsReducer,
    emailTemplates: emailTemplatesReducer,
    categories: categoriesReducer,
    tags: tagsReducer,
    pipelines: pipelinesReducer,
    interviews: interviewsReducer,
    team: teamReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types - including RTK Query actions
        ignoredActions: [
          "persist/PERSIST",
          "__rtkq/focused",
          "__rtkq/unfocused",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          "meta.arg",
          "meta.baseQueryMeta",
          "payload.timestamp",
          "payload.createdAt",
          "payload.updatedAt",
          "payload.appliedAt",
          "payload.sentAt",
          "payload.receivedAt",
          "payload.jobApplications",
        ],
        // Ignore these paths in the state - Firestore Timestamps and Date objects
        ignoredPaths: [
          "items.dates",
          "candidates.currentCandidate",
          "candidates.candidates",
          "jobs.currentJob",
          "jobs.jobs",
          "applications.applications",
          "emails.emails",
          "emailTemplates.emailTemplates",
        ],
      },
    })
      .concat(apiSlice.middleware)
      .concat(toastMiddleware),
  devTools: import.meta.env.DEV,
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
