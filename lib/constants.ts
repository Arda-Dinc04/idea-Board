export const CATEGORY_OPTIONS = [
  "Startup",
  "Game",
  "AI Tool",
  "Website",
  "Social",
  "Useless but Funny",
  "Other",
] as const;

export const IDEA_STATUSES = [
  "submitted",
  "working",
  "completed",
  "archived",
] as const;

export const DEFAULT_BUILDERS = ["AD", "YanLeCunn", "Texas", "Miami"] as const;

export type IdeaCategory = (typeof CATEGORY_OPTIONS)[number];
export type IdeaStatus = (typeof IDEA_STATUSES)[number];
