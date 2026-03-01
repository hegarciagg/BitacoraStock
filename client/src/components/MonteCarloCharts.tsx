import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SimulationData {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  meanFinalValue: number;
  medianFinalValue: number;
  percentile5: number;
  percentile95: number;
  percentile25?: number;
  percentile75?: number;
}

/**
 * Genera datos de histograma a partir de estadísticas de simulación
 */
function generateHistogramData(simData: SimulationData, initialValue: number = 10000) {
  const mean = simData.meanFinalValue;
  const std = simData.volatility * mean;

  // Crear 20 bins para el histograma
  const bins = 20;
  const min = simData.percentile5;
  const max = simData.percentile95;
  const binWidth = (max - min) / bins;

  const histogramData = [];
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;

    // Aproximación de frecuencia usando distribución normal
    const zScore = (binCenter - mean) / std;
    const frequency = Math.exp(-0.5 * zScore * zScore) / (std * Math.sqrt(2 * Math.PI));

    histogramData.push({
      range: `$${(binStart / 1000).toFixed(1)}k`,
      frequency: frequency * binWidth * 1000, // Normalizar
      binStart,
      binEnd,
    });
  }

  return histogramData;
}

/**
 * Genera datos de distribución acumulativa
 */
function generateCumulativeData(simData: SimulationData) {
  const min = simData.percentile5;
  const max = simData.percentile95;
  const mean = simData.meanFinalValue;
  const std = simData.volatility * mean;

  const cumulativeData = [];
  for (let i = 0; i <= 100; i += 5) {
    const value = min + ((max - min) * i) / 100;
    // Aproximación de CDF usando función de error
    const zScore = (value - mean) / std;
    const cdf = 0.5 * (1 + Math.tanh(0.7978845608 * (zScore + 0.044715 * Math.pow(zScore, 3))));

    cumulativeData.push({
      percentile: i,
      value: value,
      probability: cdf * 100,
    });
  }

  return cumulativeData;
}

/**
 * Genera datos de análisis de percentiles
 */
function generatePercentileData(simData: SimulationData) {
  return [
    { percentile: "5%", value: simData.percentile5, label: "Peor caso (5%)" },
    { percentile: "25%", value: simData.percentile25 || simData.percentile5 + (simData.meanFinalValue - simData.percentile5) * 0.25, label: "Q1" },
    { percentile: "50%", value: simData.medianFinalValue, label: "Mediana" },
    { percentile: "75%", value: simData.percentile75 || simData.percentile5 + (simData.percentile95 - simData.percentile5) * 0.75, label: "Q3" },
    { percentile: "95%", value: simData.percentile95, label: "Mejor caso (95%)" },
  ];
}

/**
 * Componente de histograma de distribuciones
 */
export function DistributionHistogram({ simData }: { simData: SimulationData }) {
  const data = generateHistogramData(simData);

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Distribución de Probabilidades</CardTitle>
        <CardDescription className="text-slate-500">
          Histograma de valores finales proyectados del portafolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="range" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="frequency" fill="#3b82f6" name="Frecuencia" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de distribución acumulativa
 */
export function CumulativeDistribution({ simData }: { simData: SimulationData }) {
  const data = generateCumulativeData(simData);

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Función de Distribución Acumulativa</CardTitle>
        <CardDescription className="text-slate-500">
          Probabilidad acumulada de alcanzar cada valor de portafolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="percentile"
              stroke="#64748b"
              label={{ value: "Percentil", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis stroke="#64748b" label={{ value: "Probabilidad (%)", angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value) => `${(value as number).toFixed(2)}%`}
            />
            <Line
              type="monotone"
              dataKey="probability"
              stroke="#10b981"
              dot={false}
              strokeWidth={2}
              name="Probabilidad Acumulada"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de análisis de percentiles
 */
export function PercentileAnalysis({ simData }: { simData: SimulationData }) {
  const data = generatePercentileData(simData);

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Análisis de Percentiles</CardTitle>
        <CardDescription className="text-slate-500">
          Valores proyectados en diferentes escenarios de probabilidad
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="percentile" stroke="#64748b" />
            <YAxis stroke="#64748b" label={{ value: "Valor ($)", angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value) => `$${(value as number).toFixed(2)}`}
            />
            <Legend wrapperStyle={{ color: "#e2e8f0" }} />
            <Bar dataKey="value" fill="#8b5cf6" name="Valor Proyectado" />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="bg-slate-100 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-lg font-bold text-primary">${(item.value / 1000).toFixed(1)}k</p>
              <p className="text-xs text-slate-500">{item.percentile}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de comparación de escenarios
 */
export function ScenarioComparison({ simData }: { simData: SimulationData }) {
  const scenarios = [
    {
      name: "Peor Caso",
      value: simData.percentile5,
      color: "#ef4444",
      description: "5% de probabilidad de caer por debajo",
    },
    {
      name: "Caso Base",
      value: simData.meanFinalValue,
      color: "#3b82f6",
      description: "Valor esperado (promedio)",
    },
    {
      name: "Mejor Caso",
      value: simData.percentile95,
      color: "#10b981",
      description: "5% de probabilidad de superar",
    },
  ];

  const maxValue = Math.max(...scenarios.map((s) => s.value));

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Comparación de Escenarios</CardTitle>
        <CardDescription className="text-slate-500">
          Análisis de tres escenarios principales de proyección
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {scenarios.map((scenario, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-900">{scenario.name}</p>
                <p className="text-sm text-slate-500">{scenario.description}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: scenario.color }}>
                ${(scenario.value / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${(scenario.value / maxValue) * 100}%`,
                  backgroundColor: scenario.color,
                }}
              />
            </div>
          </div>
        ))}

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Rango de Valores</p>
              <p className="text-sm font-semibold text-slate-900">
                ${((simData.percentile95 - simData.percentile5) / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Volatilidad</p>
              <p className="text-sm font-semibold text-slate-900">
                {(simData.volatility * 100).toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Sharpe Ratio</p>
              <p className="text-sm font-semibold text-slate-900">
                {simData.sharpeRatio.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
