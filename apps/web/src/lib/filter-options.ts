import {
  difficulties,
  questionStatuses,
  questionTypes,
} from "@llb/shared";

export const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  ...questionTypes.map((value) => ({
    value,
    label:
      value === "mcq"
        ? "MCQ"
        : value === "true_false"
          ? "True / False"
          : value === "multi_select"
            ? "Multi-select"
            : value === "print_output"
              ? "Print / output"
              : "Spot the bug",
  })),
];

export const DIFFICULTY_FILTER_OPTIONS = [
  { value: "", label: "All difficulties" },
  ...difficulties.map((value) => ({
    value,
    label: value[0]!.toUpperCase() + value.slice(1),
  })),
];

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  ...questionStatuses.map((value) => ({
    value,
    label: value[0]!.toUpperCase() + value.slice(1),
  })),
];

export const ATTEMPTED_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "no", label: "Not attempted" },
  { value: "yes", label: "Attempted" },
];
