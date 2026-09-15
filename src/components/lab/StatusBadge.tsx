import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatusTone =
  | "baseline"
  | "experimental"
  | "best"
  | "invalid"
  | "improved"
  | "regressed"
  | "demo"
  | "neutral";

const toneClasses: Record<StatusTone, string> = {
  baseline: "border-border bg-secondary text-secondary-foreground",
  experimental:
    "border-experimental/45 bg-experimental/12 text-experimental",
  best: "border-signal/50 bg-signal/12 text-signal",
  invalid: "border-weakness/50 bg-weakness/12 text-weakness",
  improved: "border-improved/50 bg-improved/12 text-improved",
  regressed: "border-regressed/50 bg-regressed/12 text-regressed",
  demo: "border-border bg-muted text-muted-foreground",
  neutral: "border-border bg-transparent text-muted-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
