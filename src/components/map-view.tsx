import { useMemo, useState } from "react";
import type { Vehicle } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";

interface MapViewProps {
  vehicles: Vehicle[];
  height?: number;
}

// Lightweight SVG-based "operational map" — projects lat/lng onto a styled canvas
export function MapView({ vehicles, height = 360 }: MapViewProps) {
  const [hover, setHover] = useState<Vehicle | null>(null);

  const bounds = useMemo(() => {
    const lats = vehicles.map((v) => v.lat);
    const lngs = vehicles.map((v) => v.lng);
    return {
      minLat: Math.min(...lats) - 0.5,
      maxLat: Math.max(...lats) + 0.5,
      minLng: Math.min(...lngs) - 0.5,
      maxLng: Math.max(...lngs) + 0.5,
    };
  }, [vehicles]);

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  const colorFor = (v: Vehicle) =>
    v.cameraStatus === "online"
      ? "var(--success)"
      : v.cameraStatus === "unstable"
      ? "var(--warning)"
      : "var(--destructive)";

  return (
    <Card className="relative overflow-hidden border-border/60 p-0">
      <div className="grid-bg relative" style={{ height }}>
        {/* Concentric rings center */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="oklch(0.7 0.18 230)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#mapGlow)" />
          {[15, 28, 42].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="oklch(0.7 0.18 230)"
              strokeOpacity="0.12"
              strokeWidth="0.15"
            />
          ))}

          {vehicles.map((v) => {
            const p = project(v.lat, v.lng);
            return (
              <g
                key={v.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={p.x} cy={p.y} r="2" fill={colorFor(v)} fillOpacity="0.25" />
                <circle cx={p.x} cy={p.y} r="0.9" fill={colorFor(v)}>
                  {v.cameraStatus !== "online" && (
                    <animate attributeName="r" values="0.9;1.6;0.9" dur="1.5s" repeatCount="indefinite" />
                  )}
                </circle>
              </g>
            );
          })}
        </svg>

        {hover && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
            <div className="font-semibold">{hover.id} · {hover.plate}</div>
            <div className="text-muted-foreground">{hover.name}</div>
            <div className="mt-1">Câmeras: {hover.cameras} · Sinal: {hover.signalQuality}%</div>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-1.5 rounded-md border border-border bg-card/80 px-3 py-2 text-xs backdrop-blur">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success glow-success" /> Online</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning glow-warning" /> Instável</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-destructive glow-destructive" /> Offline</div>
        </div>

        <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Frota · {vehicles.length} veículos
        </div>
      </div>
    </Card>
  );
}
