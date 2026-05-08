import { createFileRoute, Link } from "@tanstack/react-router";
import { Video, Wifi, AlertTriangle, Truck, Activity, Radio } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { MapView } from "@/components/map-view";
import { StatusBadge } from "@/components/status-badge";
import { VEHICLES, generateTimeSeries, formatTimeAgo } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral · SMOV" },
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

  const series = generateTimeSeries(24, 88, 6);

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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapView vehicles={VEHICLES} height={420} />
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

      <Card className="border-border/60 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Disponibilidade da frota (24h)</h2>
            <p className="text-xs text-muted-foreground">Percentual de veículos com câmera e conexão ativas</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.18 230)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.7 0.18 230)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
              <YAxis domain={[60, 100]} stroke="oklch(0.7 0.02 250)" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.21 0.025 250)",
                  border: "1px solid oklch(0.3 0.025 250)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.7 0.18 230)"
                strokeWidth={2}
                fill="url(#g1)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
