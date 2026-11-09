const styles: Record<string, string> = {
  easy: "text-easy",
  medium: "text-medium",
  hard: "text-hard",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${styles[difficulty] ?? ""}`}>
      {difficulty}
    </span>
  );
}
