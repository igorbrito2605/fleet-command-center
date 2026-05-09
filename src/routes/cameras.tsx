import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Video, VideoOff, AlertTriangle, Activity, Disc, Truck, Signal, Camera as CameraIcon } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { VEHICLES, formatTimeAgo } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/cameras")({
  head: () => ({
    meta: [
      { title: "Câmeras · SMOV" },
      { name: "description", content: "Status em tempo real das câmeras embarcadas." },
    ],
  }),
  component: Cameras,
});

const PAGE_SIZE = 12;

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

  const criticalAlerts = VEHICLES.filter((v) => v.cameraStatus === "offline" && v.offlineMinutes > 5);

  return (
    <div className="space-y-8">
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

      {/* === SEÇÃO: FROTA E CÂMERAS === */}
      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-border/60 pb-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Seção 02</p>
            <h2 className="text-lg font-semibold tracking-tight">Frota e câmeras</h2>
          </div>
          <span className="text-xs text-muted-foreground">Frame frontal e interno em tempo real</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar veículo, placa..."
            className="h-9 w-64"
          />
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="unstable">Instável</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="fault">Falha</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} veículos</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((v) => (
            <VehicleCameraCard key={v.id} vehicle={v} />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function VehicleCameraCard({ vehicle: v }: { vehicle: typeof VEHICLES[number] }) {
  const isOnline = v.cameraStatus === "online";
  // Deterministic placeholder frames based on vehicle id
  const seed = v.id.replace(/\D/g, "");
  const frontFrame = `https://picsum.photos/seed/front-${seed}/400/240`;
  const innerFrame = `https://picsum.photos/seed/inner-${seed}/400/240`;

  return (
    <Card className="group overflow-hidden border-border/60 transition-colors hover:border-primary/40">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background">
          <Truck className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold tracking-wide">{v.plate}</p>
          <p className="truncate text-[11px] text-muted-foreground">{v.id} · {v.name}</p>
        </div>
        <StatusBadge status={v.cameraStatus} />
      </div>

      {/* Frames */}
      <div className="grid grid-cols-2 gap-px bg-border/60">
        <FrameView label="Frontal" src={frontFrame} online={isOnline} recording={v.recording} />
        <FrameView label="Interna" src={innerFrame} online={isOnline} recording={v.recording} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Signal className="h-3 w-3" />
          <span className="tabular-nums">{v.signalQuality}%</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CameraIcon className="h-3 w-3" />
          <span>{v.cameras} câm.</span>
        </span>
        <span className="text-muted-foreground">{formatTimeAgo(v.lastTransmission)}</span>
      </div>
    </Card>
  );
}

function FrameView({ label, src, online, recording }: { label: string; src: string; online: boolean; recording: boolean }) {
  return (
    <div className="relative aspect-video overflow-hidden bg-black">
      {online ? (
        <img
          src={src}
          alt={`Câmera ${label}`}
          loading="lazy"
          className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[repeating-linear-gradient(45deg,oklch(0.18_0.02_250)_0_8px,oklch(0.21_0.02_250)_8px_16px)] text-muted-foreground">
          <VideoOff className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-wider">Sem sinal</span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white">
        <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">{label}</span>
        {online && recording && (
          <span className="inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-dot" />
            REC
          </span>
        )}
      </div>
    </div>
  );
}
