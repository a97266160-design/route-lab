import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function MetricTile({
  label,
  value,
  unit,
  hint,
  tone = "default",
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  tone?: "default" | "signal" | "experimental" | "weakness";
  sub?: ReactNode;
  className?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    signal: "text-signal",
    experimental: "text-experimental",
    weakness: "text-weakness",
  }[tone];

  return (
    <div className={cn("panel px-3.5 py-3", className)}>
      <div className="flex items-center gap-1.5">
        <span className="label-caps">{label}</span>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`About ${label}`} className="text-muted-foreground/70">
                <Info className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs">{hint}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div className={cn("num mt-1.5 flex items-baseline gap-1 text-2xl font-medium", toneClass)}>
        {value}
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
