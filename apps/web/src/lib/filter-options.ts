export const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "mcq", label: "MCQ" },
  { value: "true_false", label: "True / False" },
  { value: "multi_select", label: "Multi-select" },
  { value: "print_output", label: "Print / output" },
  { value: "spot_bug", label: "Spot the bug" },
];

export const DIFFICULTY_FILTER_OPTIONS = [
  { value: "", label: "All difficulties" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const ATTEMPTED_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "no", label: "Not attempted" },
  { value: "yes", label: "Attempted" },
];
