import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function RegimeChart() {
  const { data, isLoading } = trpc.hmm.getEquityCurve.useQuery({ limit: 1000 });

  if (isLoading) return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="h-64 bg-slate-700/30 rounded-xl animate-pulse" />
      </CardContent>
    </Card>
  );

  if (!data || data.length === 0) return (
    <Card className="bg-slate-800 border-slate-700 border-dashed">
      <CardContent className="py-16 text-center">
        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Sin datos de equity. Ejecuta un backtest.</p>
      </CardContent>
    </Card>
  );

  const initial = 10_000;
  const chartData = data.map((pt) => ({
    date:     new Date(pt.timestamp).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    equity:   parseFloat(pt.equity.toString()),
    drawdown: parseFloat(pt.drawdown?.toString() ?? "0") * 100,
  }));

  const finalEquity   = chartData[chartData.length - 1]?.equity ?? initial;
  const isProfit      = finalEquity >= initial;

  return (
    <div className="space-y-4">
      {/* Equity Curve */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Curva de Equity
            </span>
            <span className={`text-lg font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
              ${finalEquity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={isProfit ? "#2ea043" : "#f85149"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isProfit ? "#2ea043" : "#f85149"} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="#6e7681"
                tick={{ fontSize: 10 }}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis
                stroke="#6e7681"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.08)" }}
                labelStyle={{ color: "#8b949e", fontSize: 11 }}
                formatter={(value: number) => [`$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, "Equity"]}
              />
              <ReferenceLine y={initial} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: "Capital Inicial", fill: "#6e7681", fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={isProfit ? "#2ea043" : "#f85149"}
                strokeWidth={2}
                fill="url(#equityGradient)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Drawdown (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f85149" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f85149" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#6e7681" tick={{ fontSize: 9 }} interval={Math.floor(chartData.length / 8)} />
              <YAxis stroke="#6e7681" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.08)" }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, "Drawdown"]}
              />
              <Area type="monotone" dataKey="drawdown" stroke="#f85149" strokeWidth={1.5} fill="url(#ddGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
