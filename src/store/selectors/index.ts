import type { RootState } from "../index";

// Export all selectors
export * from "./clientSelectors";
export * from "./jobSelectors";
export * from "./candidateSelectors";
export * from "./applicationSelectors";

// Simple selectors for other entities with array conversion
export const selectCategories = (state: RootState) => {
  const categories = state.categories.categories;
  return Array.isArray(categories)
    ? categories
    : categories && typeof categories === 'object'
    ? Object.values(categories)
    : [];
};

export const selectTags = (state: RootState) => {
  const tags = state.tags.tags;
  return Array.isArray(tags)
    ? tags
    : tags && typeof tags === 'object'
    ? Object.values(tags)
    : [];
};

export const selectTeam = (state: RootState) => {
  const teamMembers = state.team.teamMembers;
  return Array.isArray(teamMembers)
    ? teamMembers
    : teamMembers && typeof teamMembers === 'object'
    ? Object.values(teamMembers)
    : [];
};

export const selectEmails = (state: RootState) => {
  const emails = state.emails.emails;
  return Array.isArray(emails)
    ? emails
    : emails && typeof emails === 'object'
    ? Object.values(emails)
    : [];
};

export const selectPipelines = (state: RootState) => {
  const pipelines = state.pipelines.pipelines;
  return Array.isArray(pipelines)
    ? pipelines
    : pipelines && typeof pipelines === 'object'
    ? Object.values(pipelines)
    : [];
};

export const selectInterviews = (state: RootState) => {
  const interviews = state.interviews.interviews;
  return Array.isArray(interviews)
    ? interviews
    : interviews && typeof interviews === 'object'
    ? Object.values(interviews)
    : [];
};

export const selectUsers = (state: RootState) => {
  const users = state.users.users;
  return Array.isArray(users)
    ? users
    : users && typeof users === 'object'
    ? Object.values(users)
    : [];
};
