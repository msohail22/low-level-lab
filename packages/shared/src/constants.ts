export const questionTypes = [
  "mcq",
  "true_false",
  "multi_select",
  "print_output",
  "spot_bug",
] as const;

export type QuestionType = (typeof questionTypes)[number];

export const difficulties = ["beginner", "intermediate", "advanced"] as const;

export type Difficulty = (typeof difficulties)[number];

export const questionStatuses = [
  "draft",
  "pending",
  "approved",
  "rejected",
] as const;

export type QuestionStatus = (typeof questionStatuses)[number];

export const uiEventNames = [
  "question_view",
  "abandon",
  "hint_reveal",
  "option_hover",
  "submit_click",
  "retry_click",
  "bookmark_toggle",
  "sandbox_check",
] as const;

export type UiEventName = (typeof uiEventNames)[number];

export const achievementSlugs = [
  "first-correct",
  "streak-3",
  "streak-7",
  "ten-correct",
  "daily-challenger",
  "first-contribute",
] as const;

export type AchievementSlug = (typeof achievementSlugs)[number];
