import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface MetricCardProps {
  label:   string;
  value:   string;
  icon:    React.ReactNode;
  color:   string;
  sub?:    string;
}

function MetricCard({ label, value, icon, color, sub }: MetricCardProps) {
  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetricsPanel() {
  const { data, isLoading } = trpc.hmm.getPerformanceMetrics.useQuery();

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="h-12 bg-slate-50 border border-slate-200 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!data) return (
    <Card className="bg-white shadow-sm border-slate-200 border-dashed">
      <CardContent className="py-8 text-center">
        <BarChart2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Sin datos. Ejecuta un backtest primero.</p>
      </CardContent>
    </Card>
  );

  const fmt = (v: number, dec = 1) => `${v >= 0 ? "+" : ""}${v.toFixed(dec)}%`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Return"
        value={fmt(data.totalReturn)}
        color={data.totalReturn >= 0 ? "text-green-400" : "text-red-400"}
        icon={data.totalReturn >= 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
        sub={`Capital: $${data.finalCapital.toFixed(0)}`}
      />
      <MetricCard
        label="Win Rate"
        value={`${data.winRate.toFixed(1)}%`}
        color="text-blue-400"
        icon={<BarChart2 className="w-5 h-5 text-blue-400" />}
        sub={`${data.totalTrades} trades`}
      />
      <MetricCard
        label="Max Drawdown"
        value={`${data.maxDrawdown.toFixed(1)}%`}
        color="text-orange-400"
        icon={<TrendingDown className="w-5 h-5 text-orange-400" />}
        sub="Caída máxima"
      />
      <MetricCard
        label="Capital Final"
        value={`$${(data.finalCapital / 1000).toFixed(1)}K`}
        color="text-purple-400"
        icon={<Minus className="w-5 h-5 text-purple-400" />}
        sub="Inicio: $10,000"
      />
    </div>
  );
}
