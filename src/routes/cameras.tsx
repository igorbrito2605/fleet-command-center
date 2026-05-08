import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Video, VideoOff, AlertTriangle, Activity, Disc, Truck } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { MapView } from "@/components/map-view";
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
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

export const Route = createFileRoute("/cameras")({
  head: () => ({
    meta: [
      { title: "Câmeras · SMOV" },
      { name: "description", content: "Status em tempo real das câmeras embarcadas." },
    ],
  }),
  component: Cameras,
});

const PAGE_SIZE = 8;

function Cameras() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const total = VEHICLES.length;
  const online = VEHICLES.filter((v) => v.cameraStatus === "online").length;
  const offline = VEHICLES.filter((v) => v.cameraStatus === "offline").length;
  const fault = VEHICLES.filter((v) => v.cameraStatus === "fault").length;
  const noVideo = VEHICLES.filter((v) => !v.recording).length;
  const availability = ((online / total) * 100).toFixed(1);

  const filtered = useMemo(() => {
    return VEHICLES.filter((v) => {
      if (filter !== "all" && v.cameraStatus !== filter) return false;
      if (q && !`${v.id} ${v.plate} ${v.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, filter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pieData = [
    { name: "Online", value: online, color: "oklch(0.72 0.18 150)" },
    { name: "Instável", value: VEHICLES.filter((v) => v.cameraStatus === "unstable").length, color: "oklch(0.82 0.17 85)" },
    { name: "Offline", value: offline, color: "oklch(0.65 0.24 25)" },
    { name: "Falha", value: fault, color: "oklch(0.65 0.2 290)" },
  ];

  const series = generateTimeSeries(24, 92, 5);

  const faultRanking = [...VEHICLES]
    .filter((v) => v.cameraStatus !== "online")
    .sort((a, b) => b.offlineMinutes - a.offlineMinutes)
    .slice(0, 8)
    .map((v) => ({ name: v.plate, minutos: v.offlineMinutes }));

  const criticalAlerts = VEHICLES.filter((v) => v.cameraStatus === "offline" && v.offlineMinutes > 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Painel de câmeras</p>
        <h1 className="text-2xl font-semibold tracking-tight">Situação das câmeras embarcadas</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Total" value={total} icon={<Truck className="h-5 w-5" />} tone="info" />
        <KpiCard label="Online" value={online} icon={<Video className="h-5 w-5" />} tone="success" />
        <KpiCard label="Offline" value={offline} icon={<VideoOff className="h-5 w-5" />} tone="destructive" />
        <KpiCard label="Com falha" value={fault} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Disponibilidade" value={`${availability}%`} icon={<Activity className="h-5 w-5" />} tone="success" />
        <KpiCard label="Sem vídeo" value={noVideo} icon={<Disc className="h-5 w-5" />} tone="warning" />
      </div>

      {criticalAlerts.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive pulse-dot" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                {criticalAlerts.length} câmera(s) offline há mais de 5 minutos
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Verifique os veículos: {criticalAlerts.slice(0, 5).map((v) => v.plate).join(", ")}
                {criticalAlerts.length > 5 && ` e +${criticalAlerts.length - 5}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 p-5">
          <h3 className="mb-2 text-sm font-semibold">Distribuição de status</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="border-border/60 p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Disponibilidade nas últimas 24h</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 150)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 150)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <YAxis domain={[60, 100]} stroke="oklch(0.7 0.02 250)" fontSize={11} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.18 150)" strokeWidth={2} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Top falhas por veículo (minutos offline)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faultRanking}>
                <CartesianGrid stroke="oklch(0.3 0.025 250)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="minutos" fill="oklch(0.65 0.24 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <MapView vehicles={VEHICLES} height={264} />
      </div>

      <Card className="border-border/60 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-sm font-semibold">Veículos · câmeras</h3>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar veículo, placa..."
            className="h-8 w-56"
          />
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="unstable">Instável</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="fault">Falha</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">Exportar CSV</Button>
        </div>
        <div className="overflow-auto rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Câmeras</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última transmissão</TableHead>
                <TableHead>Sinal</TableHead>
                <TableHead>Gravando</TableHead>
                <TableHead>Tempo offline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.id}</TableCell>
                  <TableCell className="font-mono text-xs">{v.plate}</TableCell>
                  <TableCell>{v.cameras}</TableCell>
                  <TableCell><StatusBadge status={v.cameraStatus} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatTimeAgo(v.lastTransmission)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${v.signalQuality > 70 ? "bg-success" : v.signalQuality > 40 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${v.signalQuality}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">{v.signalQuality}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {v.recording ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" /> REC
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.offlineMinutes > 0 ? `${v.offlineMinutes}m` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} resultados</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span>{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
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
