import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SignalPanelProps { symbol?: string; }

export default function SignalPanel({ symbol = "BTC-USD" }: SignalPanelProps) {
  const { data, isLoading, error } = trpc.hmm.getCurrentSignal.useQuery(
    { symbol },
    { refetchInterval: 60_000 },
  );

  if (isLoading) return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-8 pb-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Ejecutando HMM... esto puede tardar ~30s</p>
        </div>
      </CardContent>
    </Card>
  );

  if (error) return (
    <Card className="bg-slate-800 border-red-500/30">
      <CardContent className="pt-6">
        <p className="text-red-400 text-sm font-mono">{error.message}</p>
      </CardContent>
    </Card>
  );

  if (!data) return null;

  const isLong = data.signal === "LONG";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Main Signal */}
      <Card className={`md:col-span-1 bg-slate-800 border-2 ${isLong ? "border-green-500/50" : "border-slate-700"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            {isLong ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-slate-400" />}
            Señal Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-5xl font-black mb-3 ${isLong ? "text-green-400" : "text-slate-400"}`}>
            {data.signal}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{data.reason}</p>
          {data.lastPrice && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400">Precio {data.symbol ?? symbol}</p>
              <p className="text-white font-bold">${data.lastPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regime Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Regímenes HMM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Régimen Actual</span>
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">Estado {data.regime}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-400">🟢 Bull State</span>
            <span className="text-sm font-bold text-white">Estado {data.bullState}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400">🔴 Bear State</span>
            <span className="text-sm font-bold text-white">Estado {data.bearState}</span>
          </div>
        </CardContent>
      </Card>

      {/* Voting + Cooldown */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            Votación Institucional
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Score bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">Score</span>
              <span className={`text-sm font-bold ${data.votingScore >= 7 ? "text-green-400" : "text-slate-400"}`}>
                {data.votingScore}/8
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${data.votingScore >= 7 ? "bg-green-400" : data.votingScore >= 5 ? "bg-yellow-400" : "bg-slate-500"}`}
                style={{ width: `${(data.votingScore / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Checks grid */}
          {data.checks && (
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(data.checks).map(([key, val]) => (
                <div key={key} className={`text-xs px-2 py-1 rounded ${val ? "bg-green-500/10 text-green-400" : "bg-slate-700/50 text-slate-500"}`}>
                  {val ? "✓" : "✗"} {key.replace(/Ok$/, "").toUpperCase()}
                </div>
              ))}
            </div>
          )}

          {/* Cooldown */}
          {data.cooldownUntil && (
            <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-yellow-400">
              ⏳ Cooldown hasta {new Date(data.cooldownUntil).toLocaleString("es-ES")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
