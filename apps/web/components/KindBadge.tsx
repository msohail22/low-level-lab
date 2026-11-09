import { KIND_LABELS, type Kind } from "@/lib/kinds";

export function KindBadge({ kind }: { kind: string }) {
  return (
    <span className="inline-block rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted">
      {KIND_LABELS[kind as Kind] ?? kind}
    </span>
  );
}
