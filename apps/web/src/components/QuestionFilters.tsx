import { SimpleSelect } from "@/components/ui";

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

const ALL_VALUE = "__all__";

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="block min-w-[8rem] flex-1 space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
        {label}
      </span>
      <SimpleSelect
        value={value === "" ? ALL_VALUE : value}
        onValueChange={(next) => onChange(next === ALL_VALUE ? "" : next)}
        options={options.map((opt) => ({
          value: opt.value === "" ? ALL_VALUE : opt.value,
          label: opt.label,
        }))}
      />
    </label>
  );
}
