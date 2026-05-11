import { createFileRoute } from "@tanstack/react-router";
import { VEHICLES, generateTimeSeries } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

export const Route = createFileRoute("/indicadores")({
  head: () => ({
    meta: [
      { title: "Indicadores · SafeFleet" },
      { name: "description", content: "Indicadores e tendências das câmeras embarcadas." },
    ],
  }),
  component: Indicadores,
});

const tooltipStyle = {
  background: "oklch(0.21 0.025 250)",
  border: "1px solid oklch(0.3 0.025 250)",
  borderRadius: 8,
  fontSize: 12,
};

function Indicadores() {
  const online = VEHICLES.filter((v) => v.cameraStatus === "online").length;
  const offline = VEHICLES.filter((v) => v.cameraStatus === "offline").length;
  const fault = VEHICLES.filter((v) => v.cameraStatus === "fault").length;
  const unstable = VEHICLES.filter((v) => v.cameraStatus === "unstable").length;

  const pieData = [
    { name: "Online", value: online, color: "oklch(0.72 0.18 150)" },
    { name: "Instável", value: unstable, color: "oklch(0.82 0.17 85)" },
    { name: "Offline", value: offline, color: "oklch(0.65 0.24 25)" },
    { name: "Falha", value: fault, color: "oklch(0.65 0.2 290)" },
  ];

  const series = generateTimeSeries(24, 92, 5);

  const faultRanking = [...VEHICLES]
    .filter((v) => v.cameraStatus !== "online")
    .sort((a, b) => b.offlineMinutes - a.offlineMinutes)
    .slice(0, 8)
    .map((v) => ({ name: v.plate, minutos: v.offlineMinutes }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Painel de indicadores</p>
        <h1 className="text-2xl font-semibold tracking-tight">Indicadores e tendências</h1>
        <p className="mt-1 text-sm text-muted-foreground">Status · Disponibilidade · Top falhas</p>
      </div>

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

      <Card className="border-border/60 p-5">
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
    </div>
  );
}
