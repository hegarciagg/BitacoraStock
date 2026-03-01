import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

const STEPS = [
  { n: 1, label: "Fetch Historical Data", detail: "BTC-USD 1H · últimos 730 días", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
  { n: 2, label: "Feature Engineering", detail: "Returns · Range · VolVolatility", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { n: 3, label: "Normalize Data", detail: "StandardScaler en features HMM", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { n: 4, label: "Train HMM", detail: "GaussianHMM fit(X) · 7 estados", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { n: 5, label: "Detect Regime", detail: "predict(X) → estado actual", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { n: 6, label: "Compute Indicators", detail: "RSI · EMA · MACD · ADX · Momentum", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
  { n: 7, label: "Apply Voting System", detail: "8 confirmaciones → votingScore", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
  { n: 8, label: "Generate Signal", detail: "LONG si bullState + score ≥ 7 + cooldown OK", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
  { n: 9, label: "Apply Risk Rules", detail: "PnL calc · 1.3x leverage · capital dinámico", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
  { n: 10, label: "Persist Trade + Equity", detail: "INSERT trades + equity_curve → MySQL", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
  { n: 11, label: "Serve via API", detail: "tRPC routes → React Dashboard", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
];

export default function ExecutionPipeline() {
  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Play className="w-5 h-5 text-green-400" />
          Pipeline de Ejecución
        </CardTitle>
        <p className="text-slate-500 text-sm">Flujo completo — 11 pasos desde datos hasta señal</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`relative p-4 rounded-xl border ${step.border} ${step.bg} flex flex-col gap-1`}
            >
              {/* Step number — big background */}
              <span className={`absolute top-3 right-3 text-3xl font-black opacity-10 ${step.color} select-none`}>
                {step.n}
              </span>

              {/* Number badge */}
              <span className={`text-xs font-bold ${step.color} mb-1`}>
                PASO {step.n}
              </span>

              {/* Label */}
              <p className="text-sm font-bold text-slate-900 leading-tight">{step.label}</p>

              {/* Detail */}
              <p className="text-xs text-slate-500 leading-relaxed">{step.detail}</p>

              {/* Connector arrow for all except last */}
              {i < STEPS.length - 1 && i % 4 !== 3 && (
                <div className="hidden xl:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 z-10">
                  <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent border-l-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
