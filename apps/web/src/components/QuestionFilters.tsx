type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="block min-w-[8rem] flex-1 space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
        {label}
      </span>
      <select
        className="auth-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
