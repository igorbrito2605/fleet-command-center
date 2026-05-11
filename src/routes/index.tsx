import { createFileRoute, Link } from "@tanstack/react-router";
import { Video, Wifi, AlertTriangle, Truck, Activity, Radio } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { VEHICLES, formatTimeAgo } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral · SafeFleet" },
      { name: "description", content: "Centro de operações em tempo real para a frota." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const total = VEHICLES.length;
  const online = VEHICLES.filter((v) => v.cameraStatus === "online").length;
  const connected = VEHICLES.filter((v) => v.connectionStatus === "connected").length;
  const noEvents = VEHICLES.filter((v) => v.minutesSinceEvent > 240).length;
  const critical = VEHICLES.filter((v) => v.criticality === "critical").length;

  

  const recentAlerts = [...VEHICLES]
    .filter((v) => v.cameraStatus !== "online" || v.connectionStatus !== "connected")
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Centro de Operações
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Visão Geral da Frota</h1>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link to="/cameras">Câmeras</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/conexao">Conexão</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/eventos">Eventos</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Frota total" value={total} icon={<Truck className="h-5 w-5" />} tone="info" />
        <KpiCard
          label="Câmeras online"
          value={online}
          hint={`${((online / total) * 100).toFixed(1)}% disponibilidade`}
          icon={<Video className="h-5 w-5" />}
          tone="success"
        />
        <KpiCard
          label="Conectados"
          value={connected}
          hint={`${total - connected} sem comunicação`}
          icon={<Wifi className="h-5 w-5" />}
          tone="info"
        />
        <KpiCard
          label="Sem eventos > 4h"
          value={noEvents}
          icon={<Activity className="h-5 w-5" />}
          tone="warning"
        />
        <KpiCard
          label="Alertas críticos"
          value={critical}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="destructive"
        />
      </div>

      <div className="grid gap-4">
        <Card className="border-border/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Status operacional da frota</h2>
              <p className="text-xs text-muted-foreground">Distribuição consolidada por categoria</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Atualizado agora</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Câmeras online", value: online, total, tone: "success" as const },
              { label: "Câmeras instáveis", value: VEHICLES.filter(v => v.cameraStatus === "unstable").length, total, tone: "warning" as const },
              { label: "Câmeras offline", value: VEHICLES.filter(v => v.cameraStatus === "offline" || v.cameraStatus === "fault").length, total, tone: "destructive" as const },
              { label: "Conexão ativa", value: connected, total, tone: "info" as const },
              { label: "GPS ativo", value: VEHICLES.filter(v => v.gps).length, total, tone: "success" as const },
              { label: "Em ignição", value: VEHICLES.filter(v => v.ignition).length, total, tone: "info" as const },
            ].map((row) => {
              const pct = (row.value / row.total) * 100;
              const barColor =
                row.tone === "success" ? "var(--success)" :
                row.tone === "warning" ? "var(--warning)" :
                row.tone === "destructive" ? "var(--destructive)" : "var(--primary)";
              return (
                <div key={row.label} className="rounded-md border border-border/60 bg-muted/10 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="font-medium text-foreground">{row.value}<span className="text-muted-foreground">/{row.total}</span></span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="border-border/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Alertas recentes</h2>
          <Radio className="h-4 w-4 text-destructive pulse-dot" />
        </div>
        <div className="space-y-2 max-h-[360px] overflow-auto scrollbar-thin pr-1">
          {recentAlerts.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{v.id} · {v.plate}</div>
                <div className="text-xs text-muted-foreground">
                  {v.cameraStatus !== "online" ? "Câmera " : "Conexão "}
                  {formatTimeAgo(v.lastTransmission)}
                </div>
              </div>
              <StatusBadge status={v.cameraStatus !== "online" ? v.cameraStatus : v.connectionStatus} />
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
