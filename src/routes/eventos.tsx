import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Activity, Brain } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { CriticalityBadge, StatusBadge } from "@/components/status-badge";
import { VEHICLES, generateTimeSeries, formatTimeAgo } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos · SMOV" },
      { name: "description", content: "Análise de não geração de eventos e anomalias operacionais." },
    ],
  }),
  component: EventsPage,
});

const PAGE_SIZE = 8;

function EventsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const noEvents = VEHICLES.filter((v) => v.minutesSinceEvent > 240);
  const criticalAbsent = VEHICLES.filter((v) => v.criticality === "critical");
  const avgGap = Math.round(VEHICLES.reduce((s, v) => s + v.minutesSinceEvent, 0) / VEHICLES.length);
  const failures = VEHICLES.filter((v) => v.operationalStatus === "down").length;

  const series = generateTimeSeries(24, 50, 25).map((d) => ({ ...d, value: Math.round(d.value) }));

  const ranking = [...VEHICLES]
    .sort((a, b) => b.minutesSinceEvent - a.minutesSinceEvent)
    .slice(0, 10)
    .map((v) => ({ name: v.plate, minutos: v.minutesSinceEvent }));

  const filtered = useMemo(() => {
    return VEHICLES.filter((v) => {
      if (filter !== "all" && v.criticality !== filter) return false;
      if (q && !`${v.id} ${v.plate} ${v.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.minutesSinceEvent - a.minutesSinceEvent);
  }, [q, filter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Heatmap data: hours x days (7x24)
  const heatmap = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, h) => {
      const seed = Math.sin(day * 13 + h * 7);
      return Math.max(0, Math.round((seed + 1) * 5 + (h > 17 || h < 6 ? -3 : 2)));
    }),
  );
  const maxHeat = Math.max(...heatmap.flat());
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Inteligência operacional</p>
        <h1 className="text-2xl font-semibold tracking-tight">Não geração de eventos</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Sem eventos > 4h" value={noEvents.length} icon={<Activity className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Críticos ausentes" value={criticalAbsent.length} icon={<AlertTriangle className="h-5 w-5" />} tone="destructive" />
        <KpiCard label="Tempo médio sem evento" value={`${Math.floor(avgGap / 60)}h${avgGap % 60}m`} icon={<Clock className="h-5 w-5" />} tone="info" />
        <KpiCard label="Falhas operacionais" value={failures} icon={<Brain className="h-5 w-5" />} tone="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 p-5">
          <h3 className="mb-2 text-sm font-semibold">Eventos gerados nas últimas 24h</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="oklch(0.7 0.18 230)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 p-5">
          <h3 className="mb-2 text-sm font-semibold">Ranking · maiores gaps de evento</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking}>
                <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="oklch(0.7 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} unit="m" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="minutos" fill="oklch(0.65 0.24 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-border/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Heatmap operacional · falhas por hora/dia</h3>
            <p className="text-xs text-muted-foreground">Análise de anomalias e previsão de falhas</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Baixo</span>
            <div className="flex">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
                <div key={o} className="h-3 w-4" style={{ background: `oklch(0.65 0.24 25 / ${o})` }} />
              ))}
            </div>
            <span>Alto</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex items-center gap-1 pl-10 text-[10px] text-muted-foreground">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="w-6 text-center">{String(h).padStart(2, "0")}</div>
              ))}
            </div>
            {heatmap.map((row, di) => (
              <div key={di} className="mt-1 flex items-center gap-1">
                <div className="w-10 text-xs text-muted-foreground">{days[di]}</div>
                {row.map((val, hi) => (
                  <div
                    key={hi}
                    className="h-6 w-6 rounded-sm ring-1 ring-border/60 transition-transform hover:scale-110"
                    title={`${days[di]} ${hi}h · ${val} falhas`}
                    style={{
                      background: `oklch(0.65 0.24 25 / ${Math.min(0.95, val / maxHeat + 0.05)})`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-border/60 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-sm font-semibold">Detalhamento por veículo</h3>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar..."
            className="h-8 w-56"
          />
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda criticidade</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">Exportar PDF</Button>
        </div>
        <div className="overflow-auto rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Último evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tempo sem evento</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead>Possível causa</TableHead>
                <TableHead>Status operacional</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium">{v.id}</div>
                    <div className="font-mono text-xs text-muted-foreground">{v.plate}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatTimeAgo(v.lastEvent)}</TableCell>
                  <TableCell className="text-xs">{v.lastEventType}</TableCell>
                  <TableCell className="tabular-nums">
                    {Math.floor(v.minutesSinceEvent / 60)}h{v.minutesSinceEvent % 60}m
                  </TableCell>
                  <TableCell><CriticalityBadge level={v.criticality} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.cause}</TableCell>
                  <TableCell><StatusBadge status={v.operationalStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} resultados</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span>{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: "oklch(0.21 0.025 250)",
  border: "1px solid oklch(0.3 0.025 250)",
  borderRadius: 8,
  fontSize: 12,
};
