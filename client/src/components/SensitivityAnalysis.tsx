import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo } from "react";

interface SensitivityAnalysisProps {
  baseReturn: number;
  baseVolatility: number;
  baseSharpeRatio: number;
}

export function SensitivityAnalysis({
  baseReturn,
  baseVolatility,
  baseSharpeRatio,
}: SensitivityAnalysisProps) {
  // Análisis de sensibilidad para volatilidad
  const volatilityData = useMemo(() => {
    const scenarios = [];
    for (let vol = baseVolatility * 0.5; vol <= baseVolatility * 1.5; vol += baseVolatility * 0.1) {
      const sharpe = (baseReturn - 0.02) / (vol || 1);
      scenarios.push({
        volatility: (vol * 100).toFixed(1),
        sharpeRatio: parseFloat(sharpe.toFixed(2)),
        return: (baseReturn * 100).toFixed(1),
      });
    }
    return scenarios;
  }, [baseReturn, baseVolatility]);

  // Análisis de sensibilidad para retorno
  const returnData = useMemo(() => {
    const scenarios = [];
    for (let ret = baseReturn * 0.5; ret <= baseReturn * 1.5; ret += baseReturn * 0.1) {
      const sharpe = (ret - 0.02) / (baseVolatility || 1);
      scenarios.push({
        return: (ret * 100).toFixed(1),
        sharpeRatio: parseFloat(sharpe.toFixed(2)),
        volatility: (baseVolatility * 100).toFixed(1),
      });
    }
    return scenarios;
  }, [baseReturn, baseVolatility]);

  return (
    <div className="space-y-6">
      {/* Sensibilidad a Volatilidad */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Sensibilidad a Volatilidad</CardTitle>
          <CardDescription className="text-slate-400">
            Impacto de cambios en la volatilidad del portafolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volatilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="volatility" 
                  stroke="#94a3b8"
                  label={{ value: "Volatilidad (%)", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ value: "Sharpe Ratio", angle: -90, position: "insideLeft" }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sharpeRatio"
                  stroke="#3b82f6"
                  dot={{ fill: "#3b82f6" }}
                  name="Sharpe Ratio"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              A mayor volatilidad, menor es el Sharpe Ratio (peor relación riesgo-retorno).
              Esto muestra la importancia de controlar el riesgo del portafolio.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sensibilidad a Retorno */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Sensibilidad a Retorno Esperado</CardTitle>
          <CardDescription className="text-slate-400">
            Impacto de cambios en el retorno esperado del portafolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={returnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="return" 
                  stroke="#94a3b8"
                  label={{ value: "Retorno Esperado (%)", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ value: "Sharpe Ratio", angle: -90, position: "insideLeft" }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sharpeRatio"
                  stroke="#10b981"
                  dot={{ fill: "#10b981" }}
                  name="Sharpe Ratio"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              A mayor retorno esperado, mayor es el Sharpe Ratio (mejor relación riesgo-retorno).
              Esto demuestra el beneficio de buscar mayores rendimientos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Sensibilidad */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Matriz de Sensibilidad</CardTitle>
          <CardDescription className="text-slate-400">
            Sharpe Ratio bajo diferentes combinaciones de retorno y volatilidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2 text-slate-400">Volatilidad ↓ / Retorno →</th>
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((factor) => (
                    <th key={factor} className="text-right p-2 text-slate-400">
                      {(baseReturn * factor * 100).toFixed(1)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((volFactor) => (
                  <tr key={volFactor} className="border-b border-slate-700">
                    <td className="p-2 text-slate-400">
                      {(baseVolatility * volFactor * 100).toFixed(1)}%
                    </td>
                    {[0.5, 0.75, 1.0, 1.25, 1.5].map((retFactor) => {
                      const ret = baseReturn * retFactor;
                      const vol = baseVolatility * volFactor;
                      const sharpe = (ret - 0.02) / (vol || 1);
                      const bgColor = 
                        sharpe > 1.5 ? "bg-green-900" :
                        sharpe > 1 ? "bg-blue-900" :
                        sharpe > 0.5 ? "bg-yellow-900" :
                        "bg-red-900";
                      return (
                        <td key={`${volFactor}-${retFactor}`} className={`text-right p-2 ${bgColor} text-white`}>
                          {sharpe.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              Verde (Sharpe &gt; 1.5) = Excelente | Azul (Sharpe &gt; 1) = Bueno | 
              Amarillo (Sharpe &gt; 0.5) = Moderado | Rojo (Sharpe ≤ 0.5) = Bajo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
