// Mock data for vehicle monitoring system
export type CameraStatus = "online" | "offline" | "unstable" | "fault";
export type ConnectionStatus = "connected" | "disconnected" | "unstable";

export interface Vehicle {
  id: string;
  plate: string;
  name: string;
  cameras: number;
  cameraStatus: CameraStatus;
  lastTransmission: string;
  signalQuality: number; // 0-100
  recording: boolean;
  offlineMinutes: number;
  connectionStatus: ConnectionStatus;
  lastCommunication: string;
  signalLevel: number;
  ignition: boolean;
  gps: boolean;
  carrier: string;
  responseMs: number;
  lastEvent: string;
  lastEventType: string;
  minutesSinceEvent: number;
  criticality: "low" | "medium" | "high" | "critical";
  cause: string;
  operationalStatus: "operational" | "degraded" | "down";
  lat: number;
  lng: number;
}

const carriers = ["Vivo", "Claro", "TIM", "Oi"];
const eventTypes = ["Aceleração", "Frenagem", "Curva", "Ignição", "Parada", "Velocidade"];
const causes = [
  "Equipamento desligado",
  "Falha de comunicação",
  "Bateria baixa",
  "Sem cobertura",
  "Hardware com defeito",
  "Operação normal",
];
const driverNames = [
  "Carlos Silva", "Marcos Souza", "João Pereira", "Ana Costa", "Roberto Lima",
  "Felipe Almeida", "Pedro Ramos", "Lucas Martins", "Rafael Dias", "Bruno Gomes",
  "Diego Ferreira", "Tiago Nunes", "André Castro", "Paulo Vieira", "Rodrigo Mendes",
  "Marcelo Rocha", "Henrique Borges", "Gabriel Lopes", "Eduardo Pinto", "Vinícius Cardoso",
  "Sérgio Moreira", "Daniel Cunha", "Ricardo Teixeira", "Fábio Barros", "Júlio Araújo",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function plate() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const l = () => letters[randInt(0, 25)];
  return `${l()}${l()}${l()}-${randInt(0, 9)}${l()}${randInt(10, 99)}`;
}

// Deterministic seed based on index
function seedRand(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateVehicles(count = 48): Vehicle[] {
  const result: Vehicle[] = [];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => seedRand(i * 17 + n);
    const camStatusRoll = r(1);
    const cameraStatus: CameraStatus =
      camStatusRoll < 0.65 ? "online" : camStatusRoll < 0.8 ? "unstable" : camStatusRoll < 0.92 ? "offline" : "fault";

    const connRoll = r(2);
    const connectionStatus: ConnectionStatus =
      connRoll < 0.7 ? "connected" : connRoll < 0.88 ? "unstable" : "disconnected";

    const offlineMin = cameraStatus === "online" ? 0 : Math.floor(r(3) * 240) + 1;
    const minSinceEvent = Math.floor(r(4) * 720);
    const crit: Vehicle["criticality"] =
      minSinceEvent > 480 ? "critical" : minSinceEvent > 240 ? "high" : minSinceEvent > 90 ? "medium" : "low";

    const opStatus: Vehicle["operationalStatus"] =
      cameraStatus === "online" && connectionStatus === "connected" ? "operational"
        : cameraStatus === "fault" || connectionStatus === "disconnected" ? "down"
        : "degraded";

    // Spread vehicles around Brazil center (São Paulo area)
    const lat = -23.55 + (r(5) - 0.5) * 8;
    const lng = -46.63 + (r(6) - 0.5) * 10;

    const lastTxMin = cameraStatus === "online" ? Math.floor(r(7) * 2) : offlineMin;
    const now = Date.now();
    const lastTx = new Date(now - lastTxMin * 60000).toISOString();
    const lastComm = new Date(now - Math.floor(r(8) * 60) * 60000).toISOString();
    const lastEv = new Date(now - minSinceEvent * 60000).toISOString();

    result.push({
      id: `VHC-${String(i + 1).padStart(4, "0")}`,
      plate: plate(),
      name: driverNames[i % driverNames.length],
      cameras: randInt(2, 6),
      cameraStatus,
      lastTransmission: lastTx,
      signalQuality: cameraStatus === "online" ? randInt(70, 99) : randInt(10, 60),
      recording: cameraStatus === "online" && r(9) > 0.1,
      offlineMinutes: offlineMin,
      connectionStatus,
      lastCommunication: lastComm,
      signalLevel: connectionStatus === "connected" ? randInt(70, 100) : randInt(5, 60),
      ignition: r(10) > 0.3,
      gps: r(11) > 0.1,
      carrier: carriers[i % carriers.length],
      responseMs: connectionStatus === "connected" ? randInt(40, 180) : randInt(400, 2000),
      lastEvent: lastEv,
      lastEventType: eventTypes[i % eventTypes.length],
      minutesSinceEvent: minSinceEvent,
      criticality: crit,
      cause: causes[i % causes.length],
      operationalStatus: opStatus,
      lat,
      lng,
    });
  }
  return result;
}

export const VEHICLES = generateVehicles(48);

// Time series helpers
export function generateTimeSeries(points = 24, base = 90, variance = 8) {
  const arr = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60 * 60 * 1000);
    const value = Math.max(0, Math.min(100, base + (Math.sin(i / 2) + Math.random() - 0.5) * variance));
    arr.push({
      time: `${String(t.getHours()).padStart(2, "0")}:00`,
      value: Number(value.toFixed(1)),
    });
  }
  return arr;
}

export function formatTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}m atrás`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}
