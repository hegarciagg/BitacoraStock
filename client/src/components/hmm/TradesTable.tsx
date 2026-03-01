import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function TradesTable() {
  const { data, isLoading } = trpc.hmm.getTrades.useQuery({ limit: 30 });

  if (isLoading) return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardContent className="pt-6">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!data || data.length === 0) return (
    <Card className="bg-white shadow-sm border-slate-200 border-dashed">
      <CardContent className="py-12 text-center">
        <Table2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Sin trades. Ejecuta un backtest para ver el historial.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Table2 className="w-5 h-5 text-cyan-400" />
          Historial de Trades
          <span className="text-xs text-slate-500 font-normal ml-auto">{data.length} trades</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 px-3 text-left text-slate-500 font-semibold">Entrada</th>
                <th className="py-2 px-3 text-left text-slate-500 font-semibold">Salida</th>
                <th className="py-2 px-3 text-right text-slate-500 font-semibold">PnL</th>
                <th className="py-2 px-3 text-right text-slate-500 font-semibold">Régimen</th>
                <th className="py-2 px-3 text-right text-slate-500 font-semibold">Votos</th>
                <th className="py-2 px-3 text-right text-slate-500 font-semibold">Capital Final</th>
              </tr>
            </thead>
            <tbody>
              {data.map((trade) => {
                const pnl = parseFloat(trade.pnl?.toString() ?? "0");
                const isWin = pnl > 0;
                const entryP = parseFloat(trade.entryPrice.toString());
                const exitP  = parseFloat(trade.exitPrice?.toString() ?? "0");
                const capAfter = parseFloat(trade.capitalAfter?.toString() ?? "0");

                return (
                  <tr key={trade.id} className="border-b border-slate-200/50 hover:bg-slate-100/20 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-700">
                      ${entryP.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      <div className="text-slate-500 text-[10px]">
                        {trade.entryTime ? new Date(trade.entryTime).toLocaleDateString("es-ES") : "—"}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700">
                      ${exitP.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      <div className="text-slate-500 text-[10px]">
                        {trade.exitTime ? new Date(trade.exitTime).toLocaleDateString("es-ES") : "—"}
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
                      {isWin ? "+" : ""}${pnl.toFixed(0)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                        {trade.regime}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">{trade.confirmations}/8</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      ${capAfter.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
