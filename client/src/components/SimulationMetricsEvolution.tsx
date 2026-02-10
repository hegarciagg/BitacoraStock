import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface SimulationRecord {
  id: number;
  createdAt: Date;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  meanFinalValue: number;
}

interface SimulationMetricsEvolutionProps {
  simulations: SimulationRecord[];
}

export function SimulationMetricsEvolution({ simulations }: SimulationMetricsEvolutionProps) {
  // Preparar datos para gráficos
  const data = simulations
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((sim, index) => ({
      date: new Date(sim.createdAt).toLocaleDateString("es-ES"),
      timestamp: new Date(sim.createdAt).getTime(),
      index: index + 1,
      expectedReturn: parseFloat(sim.expectedReturn.toString()) * 100,
      volatility: parseFloat(sim.volatility.toString()) * 100,
      sharpeRatio: parseFloat(sim.sharpeRatio.toString()),
      valueAtRisk95: parseFloat(sim.valueAtRisk95.toString()),
      valueAtRisk99: parseFloat(sim.valueAtRisk99.toString()),
      meanFinalValue: parseFloat(sim.meanFinalValue.toString()),
    }));

  if (data.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-12 text-center">
          <p className="text-slate-400">No hay simulaciones para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular cambios
  const latestSim = data[data.length - 1];
  const previousSim = data.length > 1 ? data[data.length - 2] : null;

  const returnChange = previousSim
    ? latestSim.expectedReturn - previousSim.expectedReturn
    : 0;
  const volatilityChange = previousSim
    ? latestSim.volatility - previousSim.volatility
    : 0;
  const sharpeChange = previousSim
    ? latestSim.sharpeRatio - previousSim.sharpeRatio
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumen de Cambios */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300">Retorno Esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {latestSim.expectedReturn.toFixed(2)}%
            </div>
            {previousSim && (
              <p className={`text-xs mt-2 ${returnChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {returnChange >= 0 ? "↑" : "↓"} {Math.abs(returnChange).toFixed(2)}% desde última simulación
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300">Volatilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {latestSim.volatility.toFixed(2)}%
            </div>
            {previousSim && (
              <p className={`text-xs mt-2 ${volatilityChange <= 0 ? "text-green-400" : "text-red-400"}`}>
                {volatilityChange <= 0 ? "↓" : "↑"} {Math.abs(volatilityChange).toFixed(2)}% desde última simulación
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {latestSim.sharpeRatio.toFixed(2)}
            </div>
            {previousSim && (
              <p className={`text-xs mt-2 ${sharpeChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {sharpeChange >= 0 ? "↑" : "↓"} {Math.abs(sharpeChange).toFixed(2)} desde última simulación
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300">VaR 95%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ${latestSim.valueAtRisk95.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Pérdida máxima esperada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolución de Retorno y Volatilidad */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Evolución de Retorno y Volatilidad</CardTitle>
          <CardDescription className="text-slate-400">
            Cómo han cambiado el retorno esperado y la volatilidad a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#94a3b8" yAxisId="left" />
              <YAxis stroke="#94a3b8" yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="expectedReturn"
                stroke="#22c55e"
                name="Retorno Esperado (%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volatility"
                stroke="#f97316"
                name="Volatilidad (%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Evolución de Sharpe Ratio */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Evolución del Sharpe Ratio</CardTitle>
          <CardDescription className="text-slate-400">
            Retorno ajustado por riesgo a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSharpe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
              />
              <Area
                type="monotone"
                dataKey="sharpeRatio"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSharpe)"
                name="Sharpe Ratio"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Evolución de VaR */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Evolución del Value at Risk</CardTitle>
          <CardDescription className="text-slate-400">
            Pérdida máxima esperada en diferentes niveles de confianza
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => `$${(value as number).toFixed(2)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="valueAtRisk95"
                stroke="#ef4444"
                name="VaR 95%"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="valueAtRisk99"
                stroke="#dc2626"
                name="VaR 99%"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de Historial */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Historial Detallado de Simulaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-300">#</th>
                  <th className="text-left py-3 px-4 text-slate-300">Fecha</th>
                  <th className="text-right py-3 px-4 text-slate-300">Retorno (%)</th>
                  <th className="text-right py-3 px-4 text-slate-300">Volatilidad (%)</th>
                  <th className="text-right py-3 px-4 text-slate-300">Sharpe Ratio</th>
                  <th className="text-right py-3 px-4 text-slate-300">VaR 95%</th>
                  <th className="text-right py-3 px-4 text-slate-300">Valor Esperado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-300">{row.index}</td>
                    <td className="py-3 px-4 text-slate-300">{row.date}</td>
                    <td className="py-3 px-4 text-right text-green-400 font-semibold">
                      {row.expectedReturn.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-orange-400 font-semibold">
                      {row.volatility.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                      {row.sharpeRatio.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400 font-semibold">
                      ${row.valueAtRisk95.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-semibold">
                      ${row.meanFinalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Tendencias */}
      <Card className="bg-blue-900 bg-opacity-30 border border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-300">Análisis de Tendencias</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-200 space-y-3 text-sm">
          {data.length > 1 && (
            <>
              <div>
                <h4 className="font-semibold mb-2">Evolución del Riesgo:</h4>
                <p>
                  {volatilityChange < 0
                    ? `La volatilidad ha disminuido ${Math.abs(volatilityChange).toFixed(2)}%, lo que indica un portafolio menos riesgoso.`
                    : `La volatilidad ha aumentado ${volatilityChange.toFixed(2)}%, lo que indica mayor riesgo.`}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Evolución del Retorno:</h4>
                <p>
                  {returnChange > 0
                    ? `El retorno esperado ha mejorado ${returnChange.toFixed(2)}%, indicando mejores perspectivas.`
                    : `El retorno esperado ha disminuido ${Math.abs(returnChange).toFixed(2)}%, lo que requiere revisión.`}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Relación Riesgo-Retorno:</h4>
                <p>
                  {sharpeChange > 0
                    ? `El Sharpe Ratio ha mejorado, indicando mejor retorno ajustado por riesgo.`
                    : `El Sharpe Ratio ha empeorado, sugiriendo revisar la composición del portafolio.`}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
