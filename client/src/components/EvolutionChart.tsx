import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface HistoryEntry {
  id: number;
  portfolioId: number;
  userId: number;
  changeType: string;
  description: string | null;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: Date;
}

interface EvolutionChartProps {
  history: HistoryEntry[];
  isLoading?: boolean;
}

export function EvolutionChart({ history, isLoading }: EvolutionChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-12 text-center">
          <p className="text-slate-400">Cargando gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  // Procesar datos para el gráfico
  const chartData = history
    .filter((entry) => entry.newValue !== null)
    .reverse()
    .map((entry) => ({
      date: new Date(entry.createdAt).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      value: parseFloat(entry.newValue || "0"),
      type: entry.changeType,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-12 text-center">
          <p className="text-slate-400">Sin datos para mostrar gráfico de evolución</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular estadísticas
  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
  const currentValue = values[values.length - 1];
  const change = values.length > 1 ? currentValue - values[0] : 0;
  const changePercent = values.length > 1 ? (change / values[0]) * 100 : 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Evolución del Portafolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Valor Actual</p>
              <p className="text-white text-lg font-semibold">
                ${currentValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Valor Mínimo</p>
              <p className="text-white text-lg font-semibold">
                ${minValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Valor Máximo</p>
              <p className="text-white text-lg font-semibold">
                ${maxValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Cambio Total</p>
              <p className={`text-lg font-semibold ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {change >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Gráfico */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f1f5f9" }}
                formatter={(value) => [
                  `$${(value as number).toLocaleString("es-ES", { maximumFractionDigits: 2 })}`,
                  "Valor",
                ]}
              />
              <Legend wrapperStyle={{ color: "#cbd5e1" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Valor del Portafolio"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
