import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/DashboardLayout";
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
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp, Calendar, Zap } from "lucide-react";

// Eventos históricos predefinidos
const HISTORICAL_EVENTS = [
  {
    id: "crisis-2008",
    name: "Crisis Financiera (2008)",
    description: "Colapso del mercado inmobiliario",
    date: "Sep 2008 - Mar 2009",
    severity: "critical",
    impacts: { stocks: -0.57, bonds: 0.15, commodities: -0.55, cash: 0 },
  },
  {
    id: "covid-2020",
    name: "Pandemia COVID-19 (2020)",
    description: "Caída rápida y recuperación acelerada",
    date: "Feb 2020 - Mar 2020",
    severity: "high",
    impacts: { stocks: -0.34, bonds: 0.08, commodities: -0.25, cash: 0 },
  },
  {
    id: "black-monday-1987",
    name: "Lunes Negro (1987)",
    description: "Caída del 22% en un solo día",
    date: "Oct 1987",
    severity: "high",
    impacts: { stocks: -0.22, bonds: 0.05, commodities: -0.1, cash: 0 },
  },
  {
    id: "dot-com-2000",
    name: "Burbuja Tecnológica (2000-2002)",
    description: "Colapso de empresas de internet",
    date: "Mar 2000 - Oct 2002",
    severity: "critical",
    impacts: { stocks: -0.78, bonds: 0.1, commodities: -0.15, cash: 0 },
  },
  {
    id: "inflation-1970s",
    name: "Crisis de Inflación (1970s)",
    description: "Alta inflación y estancamiento",
    date: "Oct 1973 - Dec 1974",
    severity: "high",
    impacts: { stocks: -0.48, bonds: -0.25, commodities: 1.2, cash: -0.15 },
  },
  {
    id: "bull-market-2010s",
    name: "Mercado Alcista (2010-2019)",
    description: "Período de crecimiento prolongado",
    date: "Jan 2010 - Dec 2019",
    severity: "low",
    impacts: { stocks: 3.8, bonds: 0.4, commodities: -0.1, cash: 0.02 },
  },
];

interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  commodities: number;
  cash: number;
}

interface BacktestResult {
  eventName: string;
  startValue: number;
  endValue: number;
  return: number;
  maxDrawdown: number;
  recoveryDays: number;
}

export default function Backtesting() {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [allocation, setAllocation] = useState<PortfolioAllocation>({
    stocks: 60,
    bonds: 30,
    commodities: 5,
    cash: 5,
  });
  const [initialValue] = useState(100000);

  // Calcular resultados de backtesting
  const backtestResults = useMemo(() => {
    if (selectedEvents.length === 0) return [];

    return selectedEvents.map((eventId) => {
      const event = HISTORICAL_EVENTS.find((e) => e.id === eventId);
      if (!event) return null;

      // Calcular retorno ponderado
      let portfolioReturn = 0;
      for (const [asset, weight] of Object.entries(allocation)) {
        const impact = event.impacts[asset as keyof typeof event.impacts] || 0;
        portfolioReturn += (weight / 100) * impact;
      }

      const endValue = initialValue * (1 + portfolioReturn);
      const maxDrawdown = Math.abs(
        Math.min(
          0,
          ...Object.entries(allocation).map(
            ([asset, weight]) =>
              (event.impacts[asset as keyof typeof event.impacts] || 0) * (weight / 100)
          )
        )
      );

      return {
        eventName: event.name,
        startValue: initialValue,
        endValue,
        return: portfolioReturn,
        maxDrawdown,
        recoveryDays: Math.round(180 * (1 + maxDrawdown)),
      } as BacktestResult;
    });
  }, [selectedEvents, allocation, initialValue]);

  // Datos para gráfico de comparación
  const comparisonData = useMemo(() => {
    return backtestResults
      .filter((r) => r !== null)
      .map((result) => ({
        event: result!.eventName.split(" ")[0],
        return: (result!.return * 100).toFixed(2),
        endValue: result!.endValue,
        drawdown: (result!.maxDrawdown * 100).toFixed(2),
      }));
  }, [backtestResults]);

  // Estadísticas generales
  const stats = useMemo(() => {
    if (backtestResults.length === 0) {
      return { avgReturn: 0, bestReturn: 0, worstReturn: 0, avgDrawdown: 0 };
    }

    const returns = backtestResults.map((r) => r!.return);
    const drawdowns = backtestResults.map((r) => r!.maxDrawdown);

    return {
      avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
      bestReturn: Math.max(...returns),
      worstReturn: Math.min(...returns),
      avgDrawdown: drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length,
    };
  }, [backtestResults]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const updateAllocation = (asset: keyof PortfolioAllocation, value: number) => {
    const newAllocation = { ...allocation, [asset]: value };
    const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
    if (total <= 100) {
      setAllocation(newAllocation);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold text-white">Backtesting Histórico</h1>
          <p className="text-slate-400 mt-2">
            Simula cómo hubiera funcionado tu portafolio durante eventos históricos del mercado
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1 space-y-6">
            {/* Asignación de Activos */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Asignación de Portafolio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(allocation).map(([asset, value]) => (
                  <div key={asset}>
                    <div className="flex justify-between mb-2">
                      <label className="text-slate-300 capitalize text-sm">{asset}</label>
                      <span className="text-primary font-bold">{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) =>
                        updateAllocation(asset as keyof PortfolioAllocation, parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-slate-400 text-xs">
                    Total:{" "}
                    <span className="text-primary">
                      {Object.values(allocation).reduce((a, b) => a + b, 0)}%
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Selección de Eventos */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Eventos Históricos</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Selecciona eventos para backtesting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {HISTORICAL_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={event.id}
                      className="flex-1 cursor-pointer text-slate-300 text-sm"
                    >
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-slate-500">{event.date}</p>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEvents.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Selecciona eventos históricos para comenzar</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Estadísticas Generales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-slate-400 text-xs mb-2">Retorno Promedio</p>
                      <p
                        className={`text-2xl font-bold ${
                          stats.avgReturn >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {(stats.avgReturn * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-slate-400 text-xs mb-2">Mejor Evento</p>
                      <p className="text-2xl font-bold text-green-400">
                        +{(stats.bestReturn * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-slate-400 text-xs mb-2">Peor Evento</p>
                      <p className="text-2xl font-bold text-red-400">
                        {(stats.worstReturn * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-slate-400 text-xs mb-2">Drawdown Promedio</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {(stats.avgDrawdown * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de Comparación */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Retornos por Evento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="event" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                          formatter={(value) => `${value}%`}
                        />
                        <Bar dataKey="return" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tabla de Resultados Detallados */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Resultados Detallados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {backtestResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">{result?.eventName}</h4>
                            <span
                              className={`text-lg font-bold ${
                                result!.return >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {result!.return >= 0 ? "+" : ""}
                              {(result!.return * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Valor Final</p>
                              <p className="text-slate-200 font-semibold">
                                ${(result!.endValue / 1000).toFixed(1)}K
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Máxima Pérdida</p>
                              <p className="text-orange-400 font-semibold">
                                {(result!.maxDrawdown * 100).toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Recuperación</p>
                              <p className="text-primary font-semibold">
                                ~{result!.recoveryDays} días
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Insights */}
        {selectedEvents.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Insights del Backtesting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-300 text-sm">
              {stats.avgReturn < 0 && (
                <p>
                  ⚠️ Tu portafolio tiene retorno promedio negativo en eventos históricos. Considera
                  aumentar exposición a activos defensivos como bonos.
                </p>
              )}
              {stats.avgDrawdown > 0.2 && (
                <p>
                  ⚠️ El drawdown promedio es alto ({(stats.avgDrawdown * 100).toFixed(1)}%). Implementa
                  estrategias de cobertura para reducir riesgo.
                </p>
              )}
              {stats.bestReturn > 0.5 && (
                <p>
                  ✓ Tu portafolio tiene potencial de retorno positivo en algunos escenarios. Mantén
                  disciplina en tu estrategia.
                </p>
              )}
              {stats.avgReturn >= 0 && stats.avgDrawdown < 0.15 && (
                <p>
                  ✓ Excelente desempeño histórico. Tu asignación muestra buena resiliencia ante
                  eventos de estrés.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
