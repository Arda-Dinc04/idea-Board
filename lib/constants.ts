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

/** Matches DB constraint `ideas_text_length_check` after migrations apply. */
export const MIN_IDEA_LENGTH = 50;
export const MAX_IDEA_LENGTH = 1000;

export type IdeaCategory = (typeof CATEGORY_OPTIONS)[number];
export type IdeaStatus = (typeof IDEA_STATUSES)[number];
