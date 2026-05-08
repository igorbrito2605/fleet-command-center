import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff, Signal, Navigation, Clock, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
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

export const Route = createFileRoute("/conexao")({
  head: () => ({
    meta: [
      { title: "Conexão · SMOV" },
      { name: "description", content: "Status de conectividade dos veículos em tempo real." },
    ],
  }),
  component: ConnectionPage,
});

const PAGE_SIZE = 8;

function ConnectionPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pulse, setPulse] = useState(0);

  // Realtime simulation: bump pulse every 5s to drive subtle animations
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const total = VEHICLES.length;
  const connected = VEHICLES.filter((v) => v.connectionStatus === "connected").length;
  const disconnected = VEHICLES.filter((v) => v.connectionStatus === "disconnected").length;
  const unstable = VEHICLES.filter((v) => v.connectionStatus === "unstable").length;
  const gpsActive = VEHICLES.filter((v) => v.gps).length;
  const avgResponse = Math.round(VEHICLES.reduce((s, v) => s + v.responseMs, 0) / total);

  const series = generateTimeSeries(24, 95, 4);
  const disconnections = generateTimeSeries(24, 6, 4).map((d) => ({ ...d, value: Math.round(d.value / 10) }));

  const mostUnstable = [...VEHICLES]
    .filter((v) => v.connectionStatus !== "connected")
    .sort((a, b) => b.responseMs - a.responseMs)
    .slice(0, 8)
    .map((v) => ({ name: v.plate, ms: v.responseMs }));

  const filtered = useMemo(() => {
    return VEHICLES.filter((v) => {
      if (filter !== "all" && v.connectionStatus !== filter) return false;
      if (q && !`${v.id} ${v.plate} ${v.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, filter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Realtime</p>
          <h1 className="text-2xl font-semibold tracking-tight">Conexão dos veículos</h1>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
          <span key={pulse} className="h-2 w-2 rounded-full bg-success glow-success pulse-dot" />
          <span className="text-xs text-muted-foreground">Atualizando a cada 5s</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Conectados" value={connected} icon={<Wifi className="h-5 w-5" />} tone="success" />
        <KpiCard label="Desconectados" value={disconnected} icon={<WifiOff className="h-5 w-5" />} tone="destructive" />
        <KpiCard label="Instáveis" value={unstable} icon={<Signal className="h-5 w-5" />} tone="warning" />
        <KpiCard label="GPS ativo" value={gpsActive} icon={<Navigation className="h-5 w-5" />} tone="info" />
        <KpiCard label="Sem comunicação" value={total - connected - unstable} icon={<AlertTriangle className="h-5 w-5" />} tone="destructive" />
        <KpiCard label="Resposta média" value={`${avgResponse}ms`} icon={<Clock className="h-5 w-5" />} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 p-5">
          <h3 className="mb-2 text-sm font-semibold">Estabilidade de conexão (24h)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="oklch(0.7 0.02 250)" fontSize={11} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="oklch(0.7 0.18 230)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 p-5">
          <h3 className="mb-2 text-sm font-semibold">Histórico de desconexões</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disconnections}>
                <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="oklch(0.65 0.24 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-border/60 p-5">
        <h3 className="mb-2 text-sm font-semibold">Veículos mais instáveis (latência)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mostUnstable} layout="vertical">
              <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
              <XAxis type="number" stroke="oklch(0.7 0.02 250)" fontSize={11} unit="ms" />
              <YAxis dataKey="name" type="category" stroke="oklch(0.7 0.02 250)" fontSize={11} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="ms" fill="oklch(0.82 0.17 85)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="border-border/60 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-sm font-semibold">Conectividade · veículos</h3>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar..."
            className="h-8 w-56"
          />
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="connected">Conectados</SelectItem>
              <SelectItem value="unstable">Instáveis</SelectItem>
              <SelectItem value="disconnected">Desconectados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">Exportar</Button>
        </div>
        <div className="overflow-auto rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última comunicação</TableHead>
                <TableHead>Sinal</TableHead>
                <TableHead>Ignição</TableHead>
                <TableHead>GPS</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Resposta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((v) => (
                <TableRow key={v.id} className="transition-colors">
                  <TableCell className="font-medium">{v.id}</TableCell>
                  <TableCell className="font-mono text-xs">{v.plate}</TableCell>
                  <TableCell><StatusBadge status={v.connectionStatus} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatTimeAgo(v.lastCommunication)}</TableCell>
                  <TableCell className="tabular-nums">{v.signalLevel}%</TableCell>
                  <TableCell>
                    <span className={`text-xs ${v.ignition ? "text-success" : "text-muted-foreground"}`}>
                      {v.ignition ? "Ligada" : "Desligada"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${v.gps ? "text-success" : "text-destructive"}`}>
                      {v.gps ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{v.carrier}</TableCell>
                  <TableCell className="tabular-nums text-xs">{v.responseMs}ms</TableCell>
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
