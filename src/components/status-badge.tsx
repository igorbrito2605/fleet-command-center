import { cn } from "@/lib/utils";

type Status = "online" | "offline" | "unstable" | "fault" | "connected" | "disconnected" | "operational" | "degraded" | "down";

const styles: Record<Status, { label: string; cls: string; dot: string }> = {
  online: { label: "Online", cls: "bg-success/15 text-success ring-success/30", dot: "bg-success glow-success" },
  connected: { label: "Conectado", cls: "bg-success/15 text-success ring-success/30", dot: "bg-success glow-success" },
  operational: { label: "Operacional", cls: "bg-success/15 text-success ring-success/30", dot: "bg-success glow-success" },
  unstable: { label: "Instável", cls: "bg-warning/15 text-warning ring-warning/30", dot: "bg-warning glow-warning" },
  degraded: { label: "Degradado", cls: "bg-warning/15 text-warning ring-warning/30", dot: "bg-warning glow-warning" },
  offline: { label: "Offline", cls: "bg-destructive/15 text-destructive ring-destructive/30", dot: "bg-destructive glow-destructive" },
  disconnected: { label: "Desconectado", cls: "bg-destructive/15 text-destructive ring-destructive/30", dot: "bg-destructive glow-destructive" },
  fault: { label: "Falha", cls: "bg-destructive/15 text-destructive ring-destructive/30", dot: "bg-destructive glow-destructive" },
  down: { label: "Inoperante", cls: "bg-destructive/15 text-destructive ring-destructive/30", dot: "bg-destructive glow-destructive" },
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const s = styles[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full pulse-dot", s.dot)} />
      {label ?? s.label}
    </span>
  );
}

export function CriticalityBadge({ level }: { level: "low" | "medium" | "high" | "critical" }) {
  const map = {
    low: { cls: "bg-muted/40 text-muted-foreground ring-border", label: "Baixa" },
    medium: { cls: "bg-info/15 text-primary ring-primary/30", label: "Média" },
    high: { cls: "bg-warning/15 text-warning ring-warning/30", label: "Alta" },
    critical: { cls: "bg-destructive/15 text-destructive ring-destructive/30", label: "Crítica" },
  } as const;
  const m = map[level];
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1", m.cls)}>
      {m.label}
    </span>
  );
}
