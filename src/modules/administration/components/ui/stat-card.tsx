import type { LucideIcon } from "lucide-react";

const TONES = {
  default: {
    ring: "border-primary/15 hover:border-primary/30",
    chip: "bg-primary/10 text-primary border-primary/20",
    bar: "bg-primary/40",
  },
  success: {
    ring: "border-emerald-500/15 hover:border-emerald-500/30",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    bar: "bg-emerald-500/40",
  },
  warning: {
    ring: "border-amber-500/15 hover:border-amber-500/30",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    bar: "bg-amber-500/40",
  },
  danger: {
    ring: "border-red-500/15 hover:border-red-500/30",
    chip: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    bar: "bg-red-500/40",
  },
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div
      className={`tfl-glass tfl-glass-soft group relative overflow-hidden rounded-2xl border p-5 transition-colors duration-300 ${t.ring}`}
    >
      <span className={`absolute inset-x-0 top-0 h-px ${t.bar}`} />
      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg border ${t.chip}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="font-mono text-2xl font-medium tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
    </div>
  );
}
