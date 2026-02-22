import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SignalPanel from "./SignalPanel";
import MetricsPanel from "./MetricsPanel";
import RegimeChart from "./RegimeChart";
import TradesTable from "./TradesTable";
import AssetSelector from "./AssetSelector";

export default function LiveDashboard() {
  const [symbol, setSymbol]     = useState("BTC-USD");
  const [isRunning, setIsRunning] = useState(false);
  const utils = trpc.useUtils();

  const healthQuery = trpc.hmm.hmmServiceHealth.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const backtestMutation = trpc.hmm.runBacktest.useMutation({
    onMutate: () => setIsRunning(true),
    onSettled: async () => {
      setIsRunning(false);
      await utils.hmm.getPerformanceMetrics.invalidate();
      await utils.hmm.getEquityCurve.invalidate();
      await utils.hmm.getTrades.invalidate();
    },
  });

  const isOnline = healthQuery.data?.online ?? false;

  const handleRunBacktest = () => {
    backtestMutation.mutate({ symbol });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Live Dashboard</h2>
            <p className="text-slate-400 text-sm">Backtest sobre datos históricos 1H (730 días) — Yahoo Finance</p>
          </div>
          <div className="sm:ml-auto flex items-center gap-3">
            {/* Python service status */}
            <Badge
              className={`text-xs flex items-center gap-1 ${
                isOnline
                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              }`}
            >
              {isOnline
                ? <Wifi className="w-3 h-3" />
                : <WifiOff className="w-3 h-3" />}
              Python HMM: {isOnline ? "Online" : "Offline"}
            </Badge>

            <Button
              onClick={handleRunBacktest}
              disabled={isRunning || !isOnline}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              {isRunning
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Ejecutando…</>
                : <><Zap className="w-4 h-4 mr-2" />Run Backtest</>}
            </Button>
          </div>
        </div>

        {/* Asset selector row */}
        <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <AssetSelector
            value={symbol}
            onChange={setSymbol}
            disabled={isRunning}
          />
          <span className="text-xs text-slate-500 hidden sm:block">
            Selecciona el activo y presiona <span className="text-purple-400 font-medium">Run Backtest</span>
          </span>
        </div>
      </div>

      {/* Python offline warning */}
      {!isOnline && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-amber-400 text-sm font-medium">⚠️ Python HMM Microservice no disponible</p>
            <p className="text-slate-400 text-xs mt-1">
              Inicia el servicio: <code className="bg-slate-800 px-1 rounded">cd hmm-service &amp;&amp; python main.py</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Backtest error */}
      {backtestMutation.error && (
        <Card className="bg-red-500/5 border-red-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-red-400 text-sm">{backtestMutation.error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Backtest success */}
      {backtestMutation.data && (
        <Card className="bg-green-500/5 border-green-500/30">
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <p className="text-green-400 text-sm">
              ✓ Backtest completado para <strong>{backtestMutation.data.symbol}</strong>
              {" — "}{backtestMutation.data.tradeCount} trades · Return: {backtestMutation.data.metrics.totalReturn.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signal — always shows the current selected symbol */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Señal Actual — <span className="text-purple-400">{symbol}</span>
        </h3>
        <SignalPanel symbol={symbol} />
      </section>

      {/* KPIs */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Métricas de Performance</h3>
        <MetricsPanel />
      </section>

      {/* Charts */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Curva de Equity</h3>
        <RegimeChart />
      </section>

      {/* Trades */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Historial de Trades</h3>
        <TradesTable />
      </section>
    </div>
  );
}
