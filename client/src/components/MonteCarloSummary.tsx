import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Zap, Shield, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MonteCarloSummaryProps {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  meanFinalValue: number;
  medianFinalValue: number;
  percentile5: number;
  percentile95: number;
  initialCapital: number;
}

export function MonteCarloSummary({
  expectedReturn,
  volatility,
  sharpeRatio,
  valueAtRisk95,
  valueAtRisk99,
  meanFinalValue,
  medianFinalValue,
  percentile5,
  percentile95,
  initialCapital,
}: MonteCarloSummaryProps) {
  const expectedGain = meanFinalValue - initialCapital;
  const expectedGainPercent = (expectedGain / initialCapital) * 100;
  const maxLoss = percentile5 - initialCapital;
  const maxGain = percentile95 - initialCapital;
  const riskRewardRatio = Math.abs(maxGain / (maxLoss || 1));

  const getRiskLevel = (sharpe: number) => {
    if (sharpe > 1.5) return { level: "Muy Bueno", color: "bg-green-600", textColor: "text-green-400" };
    if (sharpe > 1) return { level: "Bueno", color: "bg-primary", textColor: "text-primary" };
    if (sharpe > 0.5) return { level: "Moderado", color: "bg-yellow-600", textColor: "text-yellow-400" };
    return { level: "Bajo", color: "bg-red-600", textColor: "text-red-400" };
  };

  const riskLevel = getRiskLevel(sharpeRatio);

  return (
    <div className="space-y-6">
      {/* Resumen Ejecutivo */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-300">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Resumen de Simulación
          </CardTitle>
          <CardDescription className="text-slate-500">
            Proyecciones basadas en análisis de Monte Carlo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valor Esperado */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-sm">Valor Esperado</p>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${meanFinalValue.toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {expectedGainPercent > 0 ? "+" : ""}{expectedGainPercent.toFixed(1)}% ({expectedGainPercent > 0 ? "ganancia" : "pérdida"})
              </p>
            </div>

            {/* Volatilidad */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-sm">Volatilidad</p>
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {(volatility * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500 mt-2">Riesgo anualizado</p>
            </div>

            {/* Sharpe Ratio */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-sm">Sharpe Ratio</p>
                <Target className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">
                {sharpeRatio.toFixed(2)}
              </p>
              <Badge className={`mt-2 ${riskLevel.color} text-slate-900`}>
                {riskLevel.level}
              </Badge>
            </div>

            {/* Relación Riesgo-Recompensa */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-sm">Riesgo/Recompensa</p>
                <TrendingDown className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {riskRewardRatio.toFixed(2)}x
              </p>
              <p className="text-xs text-slate-500 mt-2">Ratio de ganancia a pérdida</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Riesgo */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Análisis de Riesgo
          </CardTitle>
          <CardDescription className="text-slate-500">
            Escenarios de pérdida y ganancia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Peor Caso (5%) */}
            <div className="p-4 bg-red-900 bg-opacity-20 rounded-lg border border-red-700">
              <p className="text-red-400 font-semibold mb-2">Peor Caso (5%)</p>
              <p className="text-2xl font-bold text-red-400">
                ${percentile5.toFixed(0)}
              </p>
              <p className="text-xs text-red-300 mt-2">
                Pérdida máxima: ${Math.abs(maxLoss).toFixed(0)}
              </p>
            </div>

            {/* Caso Mediano (50%) */}
            <div className="p-4 bg-yellow-900 bg-opacity-20 rounded-lg border border-yellow-700">
              <p className="text-yellow-400 font-semibold mb-2">Caso Mediano (50%)</p>
              <p className="text-2xl font-bold text-yellow-400">
                ${medianFinalValue.toFixed(0)}
              </p>
              <p className="text-xs text-yellow-300 mt-2">
                Valor más probable
              </p>
            </div>

            {/* Mejor Caso (95%) */}
            <div className="p-4 bg-green-900 bg-opacity-20 rounded-lg border border-green-700">
              <p className="text-green-400 font-semibold mb-2">Mejor Caso (95%)</p>
              <p className="text-2xl font-bold text-green-400">
                ${percentile95.toFixed(0)}
              </p>
              <p className="text-xs text-green-300 mt-2">
                Ganancia máxima: ${maxGain.toFixed(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value at Risk */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Value at Risk (VaR)</CardTitle>
          <CardDescription className="text-slate-500">
            Pérdida máxima esperada en escenarios adversos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <p className="text-slate-500 text-sm mb-2">VaR 95% (Confianza)</p>
              <p className="text-2xl font-bold text-orange-400">
                ${valueAtRisk95.toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Hay 5% de probabilidad de perder más de ${(initialCapital - valueAtRisk95).toFixed(0)}
              </p>
            </div>

            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <p className="text-slate-500 text-sm mb-2">VaR 99% (Confianza)</p>
              <p className="text-2xl font-bold text-red-400">
                ${valueAtRisk99.toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Hay 1% de probabilidad de perder más de ${(initialCapital - valueAtRisk99).toFixed(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interpretación */}
      <Card className="bg-primary/10 border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Interpretación de Resultados</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-700 space-y-2 text-sm">
          <p>
            • <strong>Retorno Esperado:</strong> Ganancia promedio proyectada del portafolio
          </p>
          <p>
            • <strong>Volatilidad:</strong> Medida de variabilidad del retorno (mayor = más riesgo)
          </p>
          <p>
            • <strong>Sharpe Ratio:</strong> Retorno ajustado por riesgo (mayor = mejor relación riesgo-retorno)
          </p>
          <p>
            • <strong>VaR:</strong> Pérdida máxima esperada con cierto nivel de confianza
          </p>
          <p>
            • <strong>Percentiles:</strong> Rango probable de valores finales del portafolio
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
