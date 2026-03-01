import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { AnimatedMetricCard } from "./AnimatedMetricCard";

interface PortfolioMetrics {
  portfolioId: number;
  portfolioName: string;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  meanFinalValue: number;
  diversificationScore: number;
  concentrationIndex: number;
}

interface PortfolioComparisonProps {
  portfolios: PortfolioMetrics[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function PortfolioComparison({ portfolios }: PortfolioComparisonProps) {
  if (portfolios.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="pt-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500">Selecciona portafolios para ver la comparación</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para gráficos
  const comparisonData = portfolios.map((p) => ({
    name: p.portfolioName.substring(0, 10),
    fullName: p.portfolioName,
    expectedReturn: parseFloat(p.expectedReturn.toString()) * 100,
    volatility: parseFloat(p.volatility.toString()) * 100,
    sharpeRatio: parseFloat(p.sharpeRatio.toString()),
    valueAtRisk95: parseFloat(p.valueAtRisk95.toString()),
    valueAtRisk99: parseFloat(p.valueAtRisk99.toString()),
    diversificationScore: parseFloat(p.diversificationScore.toString()),
  }));

  // Datos para gráfico de riesgo-retorno
  const riskReturnData = portfolios.map((p, idx) => ({
    name: p.portfolioName,
    volatility: parseFloat(p.volatility.toString()) * 100,
    expectedReturn: parseFloat(p.expectedReturn.toString()) * 100,
    sharpeRatio: parseFloat(p.sharpeRatio.toString()),
    color: COLORS[idx % COLORS.length],
  }));

  // Encontrar mejor portafolio en cada métrica
  const bestReturn = Math.max(...portfolios.map((p) => parseFloat(p.expectedReturn.toString())));
  const lowestVolatility = Math.min(...portfolios.map((p) => parseFloat(p.volatility.toString())));
  const bestSharpe = Math.max(...portfolios.map((p) => parseFloat(p.sharpeRatio.toString())));
  const lowestVaR = Math.min(...portfolios.map((p) => parseFloat(p.valueAtRisk95.toString())));

  return (
    <div className="space-y-6">
      {/* Resumen Comparativo con Animaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700">Mejor Retorno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {(bestReturn * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {portfolios.find((p) => parseFloat(p.expectedReturn.toString()) === bestReturn)
                ?.portfolioName}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700">Menor Volatilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(lowestVolatility * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {portfolios.find((p) => parseFloat(p.volatility.toString()) === lowestVolatility)
                ?.portfolioName}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700">Mejor Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {bestSharpe.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {portfolios.find((p) => parseFloat(p.sharpeRatio.toString()) === bestSharpe)
                ?.portfolioName}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700">Menor VaR 95%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ${lowestVaR.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {portfolios.find((p) => parseFloat(p.valueAtRisk95.toString()) === lowestVaR)
                ?.portfolioName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparación de Retorno Esperado */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparación de Retorno Esperado</CardTitle>
          <CardDescription className="text-slate-500">
            Retorno anual esperado de cada portafolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => `${(value as number).toFixed(2)}%`}
              />
              <Bar dataKey="expectedReturn" fill="#22c55e" name="Retorno (%)" radius={[8, 8, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparación de Volatilidad */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparación de Volatilidad</CardTitle>
          <CardDescription className="text-slate-500">
            Desviación estándar de retornos (menor es mejor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => `${(value as number).toFixed(2)}%`}
              />
              <Bar dataKey="volatility" fill="#f97316" name="Volatilidad (%)" radius={[8, 8, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico Riesgo-Retorno (Scatter) */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Análisis Riesgo-Retorno</CardTitle>
          <CardDescription className="text-slate-500">
            Relación entre volatilidad (eje X) y retorno esperado (eje Y)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="volatility"
                name="Volatilidad (%)"
                stroke="#64748b"
                label={{ value: "Volatilidad (%)", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="expectedReturn"
                name="Retorno (%)"
                stroke="#64748b"
                label={{ value: "Retorno (%)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              {riskReturnData.map((entry, index) => (
                <Scatter
                  key={`scatter-${index}`}
                  name={entry.name}
                  data={[entry]}
                  fill={entry.color}
                  shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparación de Sharpe Ratio */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparación de Sharpe Ratio</CardTitle>
          <CardDescription className="text-slate-500">
            Retorno ajustado por riesgo (mayor es mejor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => (value as number).toFixed(2)}
              />
              <Bar dataKey="sharpeRatio" fill="#3b82f6" name="Sharpe Ratio" radius={[8, 8, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparación de VaR */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparación de Value at Risk</CardTitle>
          <CardDescription className="text-slate-500">
            Pérdida máxima esperada en diferentes niveles de confianza
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => `$${(value as number).toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="valueAtRisk95" fill="#ef4444" name="VaR 95%" radius={[8, 8, 0, 0]} />
              <Bar dataKey="valueAtRisk99" fill="#dc2626" name="VaR 99%" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla Detallada de Comparación */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparación Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-3 px-4 text-slate-700">Portafolio</th>
                  <th className="text-right py-3 px-4 text-slate-700">Retorno (%)</th>
                  <th className="text-right py-3 px-4 text-slate-700">Volatilidad (%)</th>
                  <th className="text-right py-3 px-4 text-slate-700">Sharpe</th>
                  <th className="text-right py-3 px-4 text-slate-700">VaR 95%</th>
                  <th className="text-right py-3 px-4 text-slate-700">Diversificación</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map((portfolio, idx) => (
                  <tr
                    key={portfolio.portfolioId}
                    className="border-b border-slate-200 hover:bg-slate-50 border border-slate-200 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-900 font-medium">{portfolio.portfolioName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 font-semibold">
                      {(parseFloat(portfolio.expectedReturn.toString()) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-orange-400 font-semibold">
                      {(parseFloat(portfolio.volatility.toString()) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-primary font-semibold">
                      {parseFloat(portfolio.sharpeRatio.toString()).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400 font-semibold">
                      ${parseFloat(portfolio.valueAtRisk95.toString()).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-400 font-semibold">
                      {parseFloat(portfolio.diversificationScore.toString()).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones Comparativas */}
      <Card className="bg-blue-900 bg-opacity-30 border border-blue-700">
        <CardHeader>
          <CardTitle className="text-primary">Análisis Comparativo</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-700 space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Portafolio Más Agresivo:</h4>
            <p>
              {portfolios.reduce((max, p) => 
                parseFloat(p.expectedReturn.toString()) > parseFloat(max.expectedReturn.toString()) ? p : max
              ).portfolioName} con {(parseFloat(portfolios.reduce((max, p) => 
                parseFloat(p.expectedReturn.toString()) > parseFloat(max.expectedReturn.toString()) ? p : max
              ).expectedReturn.toString()) * 100).toFixed(2)}% de retorno esperado.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Portafolio Más Conservador:</h4>
            <p>
              {portfolios.reduce((min, p) => 
                parseFloat(p.volatility.toString()) < parseFloat(min.volatility.toString()) ? p : min
              ).portfolioName} con {(parseFloat(portfolios.reduce((min, p) => 
                parseFloat(p.volatility.toString()) < parseFloat(min.volatility.toString()) ? p : min
              ).volatility.toString()) * 100).toFixed(2)}% de volatilidad.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Mejor Relación Riesgo-Retorno:</h4>
            <p>
              {portfolios.reduce((max, p) => 
                parseFloat(p.sharpeRatio.toString()) > parseFloat(max.sharpeRatio.toString()) ? p : max
              ).portfolioName} con Sharpe Ratio de {parseFloat(portfolios.reduce((max, p) => 
                parseFloat(p.sharpeRatio.toString()) > parseFloat(max.sharpeRatio.toString()) ? p : max
              ).sharpeRatio.toString()).toFixed(2)}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
