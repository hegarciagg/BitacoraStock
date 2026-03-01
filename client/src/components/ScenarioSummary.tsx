import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, TrendingUp, Shield, AlertCircle, CheckCircle } from "lucide-react";

export interface ScenarioSummaryData {
  portfolioValue: number;
  selectedScenariosCount: number;
  bestCaseImpact: number;
  worstCaseImpact: number;
  averageImpact: number;
  volatilityOfImpacts: number;
  resilienceScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  keyMetrics: {
    maxDrawdown: number;
    recoveryTime: string;
    sharpeRatio: number;
    valueAtRisk: number;
  };
}

export default function ScenarioSummary({ data }: { data: ScenarioSummaryData }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-orange-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-slate-500";
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-500/10 border-green-500/30";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "high":
        return "bg-orange-500/10 border-orange-500/30";
      case "critical":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-slate-500/10 border-slate-500/30";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <Shield className="w-5 h-5 text-green-400" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Shield className="w-5 h-5 text-slate-500" />;
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "low":
        return "Bajo";
      case "medium":
        return "Medio";
      case "high":
        return "Alto";
      case "critical":
        return "Crítico";
      default:
        return "Desconocido";
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Portafolio Actual */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-2">Valor del Portafolio</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(data.portfolioValue / 1000).toFixed(1)}K
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Escenarios Analizados */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-2">Escenarios Analizados</p>
              <p className="text-2xl font-bold text-primary">
                {data.selectedScenariosCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Impacto Promedio */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-2">Impacto Promedio</p>
              <p
                className={`text-2xl font-bold ${
                  data.averageImpact >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {data.averageImpact >= 0 ? "+" : ""}{(data.averageImpact * 100).toFixed(2)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Puntuación de Resiliencia */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-2">Resiliencia</p>
              <p className="text-2xl font-bold text-purple-400">
                {(data.resilienceScore * 100).toFixed(0)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nivel de Riesgo */}
        <Card className={`border-2 ${getRiskBgColor(data.riskLevel)}`}>
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              {getRiskIcon(data.riskLevel)}
              Nivel de Riesgo del Portafolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className={`text-3xl font-bold ${getRiskColor(data.riskLevel)}`}>
                {getRiskLabel(data.riskLevel)}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {data.riskLevel === "low" &&
                  "Tu portafolio es resiliente ante la mayoría de escenarios de mercado."}
                {data.riskLevel === "medium" &&
                  "Tu portafolio tiene exposición moderada a riesgos de mercado."}
                {data.riskLevel === "high" &&
                  "Tu portafolio tiene alta exposición a riesgos. Considera rebalancear."}
                {data.riskLevel === "critical" &&
                  "Tu portafolio está muy expuesto a riesgos. Acción inmediata recomendada."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rango de Impacto */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Rango de Impacto Esperado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mejor Caso</span>
                <span className="text-green-400 font-bold">
                  +{(data.bestCaseImpact * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (data.bestCaseImpact * 100) / 2 + 50)}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Peor Caso</span>
                <span className="text-red-400 font-bold">
                  {(data.worstCaseImpact * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${Math.max(0, 50 + (data.worstCaseImpact * 100) / 2)}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Volatilidad de Impactos</span>
                <span className="text-primary font-bold">
                  {(data.volatilityOfImpacts * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (data.volatilityOfImpacts * 100) / 2)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Clave */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Métricas Clave de Riesgo</CardTitle>
          <CardDescription className="text-slate-500">
            Indicadores principales de desempeño bajo estrés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-2">Máxima Pérdida</p>
              <p className="text-xl font-bold text-red-400">
                {(data.keyMetrics.maxDrawdown * 100).toFixed(2)}%
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-2">Tiempo de Recuperación</p>
              <p className="text-xl font-bold text-primary">
                {data.keyMetrics.recoveryTime}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-2">Ratio de Sharpe</p>
              <p className="text-xl font-bold text-green-400">
                {data.keyMetrics.sharpeRatio.toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-2">VaR (95%)</p>
              <p className="text-xl font-bold text-orange-400">
                ${(data.keyMetrics.valueAtRisk / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Recomendaciones Basadas en Análisis
          </CardTitle>
          <CardDescription className="text-slate-500">
            Acciones sugeridas para optimizar tu portafolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.length > 0 ? (
              data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg border border-slate-300"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20">
                      <span className="text-primary text-xs font-bold">{idx + 1}</span>
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm">{rec}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">
                Selecciona escenarios para obtener recomendaciones personalizadas
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fortalezas */}
        <Card className="bg-white shadow-sm border-slate-200 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-slate-900 text-sm">Fortalezas del Portafolio</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {data.resilienceScore > 0.7 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Alta resiliencia ante escenarios adversos</span>
                </li>
              )}
              {data.volatilityOfImpacts < 0.15 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Baja volatilidad de impactos entre escenarios</span>
                </li>
              )}
              {data.averageImpact > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Impacto promedio positivo en escenarios</span>
                </li>
              )}
              {data.keyMetrics.sharpeRatio > 0.5 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Buen ratio riesgo-retorno ajustado</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Áreas de Mejora */}
        <Card className="bg-white shadow-sm border-slate-200 border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-slate-900 text-sm">Áreas de Mejora</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {data.riskLevel === "high" || data.riskLevel === "critical" && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">!</span>
                  <span>Considera reducir exposición a activos volátiles</span>
                </li>
              )}
              {data.volatilityOfImpacts > 0.20 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">!</span>
                  <span>Diversifica más para reducir volatilidad de impactos</span>
                </li>
              )}
              {data.worstCaseImpact < -0.25 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">!</span>
                  <span>Peor caso muy negativo, aumenta coberturas defensivas</span>
                </li>
              )}
              {data.keyMetrics.maxDrawdown > 0.30 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">!</span>
                  <span>Máxima pérdida potencial es muy alta</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
