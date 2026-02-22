import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

type ModuleStatus = "Pendiente" | "En desarrollo" | "Completo";

interface Module {
  emoji: string;
  name: string;
  stack: string;
  description: string;
  status: ModuleStatus;
}

const MODULES: Module[] = [
  {
    emoji: "🐍",
    name: "Python HMM Microservice",
    stack: "FastAPI · hmmlearn · numpy · pandas",
    description: "POST /detect-regimes — GaussianHMM 7 estados, identifica bullState y bearState.",
    status: "Pendiente",
  },
  {
    emoji: "⚙️",
    name: "Feature Engineering",
    stack: "TypeScript · Math",
    description: "Returns, Range, VolVolatility, RSI(14), Momentum(12), Volatility, ADX, EMA50/200, MACD, VolSMA20.",
    status: "Pendiente",
  },
  {
    emoji: "🗳️",
    name: "Voting System",
    stack: "TypeScript · Strategy Logic",
    description: "8 confirmaciones institucionales. Entrada LONG solo con score ≥ 7 + regime + cooldown.",
    status: "Pendiente",
  },
  {
    emoji: "⚡",
    name: "Strategy Engine",
    stack: "TypeScript · Custom",
    description: "Entry/Exit rules basadas en régimen HMM + votación. Cooldown de 48h post-salida.",
    status: "Pendiente",
  },
  {
    emoji: "💰",
    name: "Risk Engine",
    stack: "TypeScript · Math",
    description: "Capital $10K · Leverage 1.3x · PnL = ((exit-entry)/entry) × capital × 1.3.",
    status: "Pendiente",
  },
  {
    emoji: "🗄️",
    name: "MySQL Schema",
    stack: "MySQL · Drizzle ORM",
    description: "Tablas: trades (entry, exit, pnl, regime, confirmations) + equity_curve (timestamp, equity).",
    status: "Pendiente",
  },
  {
    emoji: "📡",
    name: "tRPC Routes",
    stack: "tRPC · Zod · TypeScript",
    description: "getCurrentSignal · getPerformanceMetrics · getEquityCurve · getTrades.",
    status: "Pendiente",
  },
  {
    emoji: "📊",
    name: "React Dashboard",
    stack: "React · TypeScript · Recharts",
    description: "Signal display, candlestick chart BTC con colores de régimen, metrics panel.",
    status: "Pendiente",
  },
];

const STATUS_STYLES: Record<ModuleStatus, string> = {
  Pendiente: "bg-slate-600/50 text-slate-300 border-slate-500/40",
  "En desarrollo": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Completo: "bg-green-500/15 text-green-400 border-green-500/30",
};

const STATUS_DOT: Record<ModuleStatus, string> = {
  Pendiente: "bg-slate-400",
  "En desarrollo": "bg-yellow-400 animate-pulse",
  Completo: "bg-green-400",
};

export default function ModulesGrid() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          Módulos del Sistema
        </CardTitle>
        <p className="text-slate-400 text-sm">8 módulos independientes — arquitectura desacoplada</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {MODULES.map((mod) => (
            <div
              key={mod.name}
              className="p-4 rounded-xl bg-slate-700/40 border border-slate-600 hover:border-slate-500 transition-colors flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{mod.emoji}</span>
                  <span className="text-sm font-bold text-white leading-tight">{mod.name}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed flex-1">{mod.description}</p>

              {/* Stack + Status */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 font-mono">{mod.stack}</p>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold w-fit ${STATUS_STYLES[mod.status]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[mod.status]}`} />
                  {mod.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
