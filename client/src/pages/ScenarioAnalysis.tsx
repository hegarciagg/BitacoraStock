import { useParams } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertCircle, TrendingDown, TrendingUp, Zap, BarChart3 } from "lucide-react";
import ScenarioSummary from "@/components/ScenarioSummary";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

// Escenarios predefinidos
const PREDEFINED_SCENARIOS = [
  {
    id: "market_crash",
    name: "Caída de Mercado",
    description: "Caída abrupta del 20% en mercados globales",
    color: "#ef4444",
    impacts: { equity: -0.20, bond: 0.05, crypto: -0.35, commodity: -0.10 },
  },
  {
    id: "inflation_spike",
    name: "Pico de Inflación",
    description: "Aumento repentino de inflación al 8%",
    color: "#f97316",
    impacts: { equity: -0.12, bond: -0.15, crypto: 0.10, commodity: 0.25 },
  },
  {
    id: "recession",
    name: "Recesión Económica",
    description: "Contracción económica del 2%",
    color: "#dc2626",
    impacts: { equity: -0.25, bond: 0.15, crypto: -0.40, commodity: -0.20 },
  },
  {
    id: "rate_hike",
    name: "Aumento de Tasas",
    description: "Aumento de 2% en tasas de interés",
    color: "#ea580c",
    impacts: { equity: -0.08, bond: -0.10, crypto: -0.15, commodity: 0.05 },
  },
  {
    id: "tech_boom",
    name: "Boom Tecnológico",
    description: "Auge en sector tecnológico",
    color: "#22c55e",
    impacts: { equity: 0.25, bond: -0.05, crypto: 0.40, commodity: -0.10 },
  },
  {
    id: "bull_market",
    name: "Mercado Alcista",
    description: "Tendencia alcista sostenida",
    color: "#16a34a",
    impacts: { equity: 0.20, bond: 0.05, crypto: 0.30, commodity: 0.10 },
  },
];

export default function ScenarioAnalysis() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [customScenario, setCustomScenario] = useState({
    equity: 0,
    bond: 0,
    crypto: 0,
    commodity: 0,
  });
  const [useCustom, setUseCustom] = useState(false);

  // Datos de ejemplo del portafolio
  const portfolioAssets = {
    "Acciones": 0.60,
    "Bonos": 0.25,
    "Criptomonedas": 0.10,
    "Commodities": 0.05,
  };
  const portfolioValue = 100000;

  // Calcular impacto de escenarios
  const calculateScenarioImpact = (impacts: Record<string, number>) => {
    let totalImpact = 0;
    totalImpact += impacts.equity * portfolioAssets["Acciones"];
    totalImpact += impacts.bond * portfolioAssets["Bonos"];
    totalImpact += impacts.crypto * portfolioAssets["Criptomonedas"];
    totalImpact += impacts.commodity * portfolioAssets["Commodities"];
    return totalImpact;
  };

  // Preparar datos para gráficos
  const scenarioResults = selectedScenarios
    .map((scenarioId) => {
      const scenario = PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) return null;
      const impact = calculateScenarioImpact(scenario.impacts);
      return {
        name: scenario.name,
        impact: impact * 100,
        newValue: portfolioValue * (1 + impact),
        color: scenario.color,
      };
    })
    .filter((r) => r !== null) as Array<{
    name: string;
    impact: number;
    newValue: number;
    color: string;
  }>;

  const customImpact = useCustom ? calculateScenarioImpact(customScenario) : 0;

  // Calcular métricas de resumen
  const allScenarioImpacts = [
    ...scenarioResults.map((r) => r.impact / 100),
    ...(useCustom ? [customImpact] : []),
  ];

  const bestCaseImpact = allScenarioImpacts.length > 0 ? Math.max(...allScenarioImpacts) : 0;
  const worstCaseImpact = allScenarioImpacts.length > 0 ? Math.min(...allScenarioImpacts) : 0;
  const averageImpact =
    allScenarioImpacts.length > 0
      ? allScenarioImpacts.reduce((a, b) => a + b, 0) / allScenarioImpacts.length
      : 0;
  const volatilityOfImpacts =
    allScenarioImpacts.length > 0
      ? Math.sqrt(
          allScenarioImpacts.reduce(
            (sum, impact) => sum + Math.pow(impact - averageImpact, 2),
            0
          ) / allScenarioImpacts.length
        )
      : 0;

  // Calcular puntuación de resiliencia (0-1)
  const resilienceScore = Math.max(
    0,
    Math.min(
      1,
      (1 - Math.abs(worstCaseImpact) / 0.5) * (1 - volatilityOfImpacts / 0.3)
    )
  );

  // Determinar nivel de riesgo
  const getRiskLevel = (): "low" | "medium" | "high" | "critical" => {
    if (Math.abs(worstCaseImpact) > 0.35 || volatilityOfImpacts > 0.25) return "critical";
    if (Math.abs(worstCaseImpact) > 0.25 || volatilityOfImpacts > 0.18) return "high";
    if (Math.abs(worstCaseImpact) > 0.15 || volatilityOfImpacts > 0.12) return "medium";
    return "low";
  };

  // Generar recomendaciones
  const generateRecommendations = (): string[] => {
    const recs: string[] = [];

    if (Math.abs(worstCaseImpact) > 0.25) {
      recs.push("El peor caso es muy negativo. Considera aumentar posiciones defensivas como bonos.");
    }

    if (volatilityOfImpacts > 0.20) {
      recs.push("La volatilidad de impactos es alta. Diversifica más entre clases de activos.");
    }

    if (averageImpact < 0) {
      recs.push("El impacto promedio es negativo. Revisa tu asignación de activos.");
    }

    if (resilienceScore < 0.5) {
      recs.push("Tu portafolio tiene baja resiliencia. Implementa estrategias de cobertura.");
    }

    if (recs.length === 0) {
      recs.push("Tu portafolio muestra buena resiliencia ante escenarios de estrés.");
      recs.push("Mantén la disciplina en tu estrategia de inversión.");
    }

    return recs;
  };

  const summaryData = {
    portfolioValue,
    selectedScenariosCount: selectedScenarios.length + (useCustom ? 1 : 0),
    bestCaseImpact,
    worstCaseImpact,
    averageImpact,
    volatilityOfImpacts,
    resilienceScore,
    riskLevel: getRiskLevel(),
    recommendations: generateRecommendations(),
    keyMetrics: {
      maxDrawdown: Math.abs(worstCaseImpact),
      recoveryTime: Math.abs(worstCaseImpact) > 0.20 ? "6-12 meses" : "3-6 meses",
      sharpeRatio: averageImpact / Math.max(volatilityOfImpacts, 0.01),
      valueAtRisk: portfolioValue * Math.abs(worstCaseImpact),
    },
  };

  // Datos para gráfico de comparación
  const comparisonData = [
    {
      name: "Portafolio Actual",
      value: portfolioValue,
      type: "actual",
    },
    ...scenarioResults.map((r) => ({
      name: r.name,
      value: r.newValue,
      type: "scenario",
    })),
  ];

  // Datos para gráfico de sensibilidad
  const sensitivityData = [
    { factor: "Acciones", impact: customScenario.equity * 100 },
    { factor: "Bonos", impact: customScenario.bond * 100 },
    { factor: "Criptos", impact: customScenario.crypto * 100 },
    { factor: "Commodities", impact: customScenario.commodity * 100 },
  ];

  // Datos para scatter plot de riesgo-retorno
  const riskReturnData = PREDEFINED_SCENARIOS.map((scenario) => ({
    name: scenario.name,
    return: calculateScenarioImpact(scenario.impacts) * 100,
    risk: Math.abs(calculateScenarioImpact(scenario.impacts)) * 50,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Análisis de Escenarios</h1>
          <p className="text-slate-500 mt-2">
            Modela el impacto de eventos de mercado específicos en tu portafolio
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Selector de Escenarios Predefinidos */}
          <Card className="lg:col-span-1 bg-white shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Escenarios Predefinidos
              </CardTitle>
              <CardDescription className="text-slate-500">
                Selecciona eventos de mercado para analizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PREDEFINED_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setSelectedScenarios((prev) =>
                      prev.includes(scenario.id)
                        ? prev.filter((s) => s !== scenario.id)
                        : [...prev, scenario.id]
                    );
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedScenarios.includes(scenario.id)
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-300 bg-slate-50 border border-slate-200 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{scenario.name}</p>
                      <p className="text-xs text-slate-500">{scenario.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Constructor de Escenario Personalizado */}
          <Card className="lg:col-span-2 bg-white shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Constructor de Escenario Personalizado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label className="text-slate-900 cursor-pointer flex-1">
                  Crear escenario personalizado
                </label>
              </div>

              {useCustom && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-slate-900">Impacto en Acciones</Label>
                      <span className="text-primary font-semibold">
                        {(customScenario.equity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Slider
                      value={[customScenario.equity]}
                      onValueChange={(value) =>
                        setCustomScenario({ ...customScenario, equity: value[0] })
                      }
                      min={-0.5}
                      max={0.5}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-slate-900">Impacto en Bonos</Label>
                      <span className="text-green-400 font-semibold">
                        {(customScenario.bond * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Slider
                      value={[customScenario.bond]}
                      onValueChange={(value) =>
                        setCustomScenario({ ...customScenario, bond: value[0] })
                      }
                      min={-0.5}
                      max={0.5}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-slate-900">Impacto en Criptomonedas</Label>
                      <span className="text-orange-400 font-semibold">
                        {(customScenario.crypto * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Slider
                      value={[customScenario.crypto]}
                      onValueChange={(value) =>
                        setCustomScenario({ ...customScenario, crypto: value[0] })
                      }
                      min={-0.5}
                      max={0.5}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-slate-900">Impacto en Commodities</Label>
                      <span className="text-yellow-400 font-semibold">
                        {(customScenario.commodity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Slider
                      value={[customScenario.commodity]}
                      onValueChange={(value) =>
                        setCustomScenario({ ...customScenario, commodity: value[0] })
                      }
                      min={-0.5}
                      max={0.5}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resultados de Análisis */}
        {(selectedScenarios.length > 0 || useCustom) && (
          <>
            {/* Gráfico de Comparación de Valores */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Comparación de Valores del Portafolio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => `$${(value as number).toFixed(0)}`}
                    />
                      <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Sensibilidad */}
            {useCustom && (
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">Análisis de Sensibilidad por Activo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sensitivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="factor" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `${(value as number).toFixed(2)}%`}
                      />
                      <Bar dataKey="impact" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Riesgo-Retorno */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Análisis Riesgo-Retorno de Escenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis
                      dataKey="return"
                      name="Retorno Esperado (%)"
                      stroke="#64748b"
                    />
                    <YAxis dataKey="risk" name="Riesgo" stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      cursor={{ strokeDasharray: "3 3" }}
                    />
                    <Scatter
                      name="Escenarios"
                      data={riskReturnData}
                      fill="#8b5cf6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumen de Resultados */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Resumen de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scenarioResults.map((result) => (
                    <div
                      key={result.name}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-lg border border-slate-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{result.name}</h4>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: result.color }}
                        />
                      </div>
                      <p className="text-sm text-slate-500 mb-3">
                        Impacto en portafolio
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-2xl font-bold ${
                            result.impact >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {result.impact >= 0 ? "+" : ""}{result.impact.toFixed(2)}%
                        </span>
                        <span className="text-slate-500">
                          Nuevo valor: ${result.newValue.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {useCustom && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg border border-slate-300">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">Escenario Personalizado</h4>
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      </div>
                      <p className="text-sm text-slate-500 mb-3">
                        Impacto en portafolio
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-2xl font-bold ${
                            customImpact >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {customImpact >= 0 ? "+" : ""}{(customImpact * 100).toFixed(2)}%
                        </span>
                        <span className="text-slate-500">
                          Nuevo valor: ${(portfolioValue * (1 + customImpact)).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Resumen Ejecutivo */}
        {(selectedScenarios.length > 0 || useCustom) && (
          <ScenarioSummary data={summaryData} />
        )}

        {selectedScenarios.length === 0 && !useCustom && (
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Selecciona un escenario para comenzar
              </h3>
              <p className="text-slate-500">
                Elige uno o más escenarios predefinidos o crea uno personalizado para analizar
                el impacto en tu portafolio.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
