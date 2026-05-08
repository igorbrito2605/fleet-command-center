import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  trend?: { value: string; positive?: boolean };
}

const toneStyles: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-primary",
};

const toneBg: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-muted/40 ring-border",
  success: "bg-success/10 ring-success/30",
  warning: "bg-warning/10 ring-warning/30",
  destructive: "bg-destructive/10 ring-destructive/30",
  info: "bg-primary/10 ring-primary/30",
};

export function KpiCard({ label, value, hint, icon, tone = "default", trend }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 p-5 backdrop-blur transition-all hover:border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn("text-3xl font-semibold tabular-nums tracking-tight", toneStyles[tone])}>
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg ring-1", toneBg[tone])}>
            <div className={toneStyles[tone]}>{icon}</div>
          </div>
        )}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent",
          tone === "success" && "via-success",
          tone === "warning" && "via-warning",
          tone === "destructive" && "via-destructive",
          tone === "info" && "via-primary",
          tone === "default" && "via-border",
        )}
      />
    </Card>
  );
}
