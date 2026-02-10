import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { PortfolioSelector } from "@/components/PortfolioSelector";
import { PortfolioComparison } from "@/components/PortfolioComparison";

interface SelectedPortfolio {
  id: number;
  name: string;
  description?: string;
}

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

export default function PortfolioComparator() {
  const [, navigate] = useLocation();
  const [selectedPortfolios, setSelectedPortfolios] = useState<SelectedPortfolio[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics[]>([]);

  const portfolios = trpc.portfolio.list.useQuery();

  // Siempre llamar a los hooks en el mismo orden - NUNCA condicionalmente
  const sim1 = trpc.simulation.getLatest.useQuery(
    { portfolioId: selectedPortfolios[0]?.id || 0 },
    { enabled: !!selectedPortfolios[0] }
  );
  const sim2 = trpc.simulation.getLatest.useQuery(
    { portfolioId: selectedPortfolios[1]?.id || 0 },
    { enabled: !!selectedPortfolios[1] }
  );
  const sim3 = trpc.simulation.getLatest.useQuery(
    { portfolioId: selectedPortfolios[2]?.id || 0 },
    { enabled: !!selectedPortfolios[2] }
  );
  const sim4 = trpc.simulation.getLatest.useQuery(
    { portfolioId: selectedPortfolios[3]?.id || 0 },
    { enabled: !!selectedPortfolios[3] }
  );

  const simulations = [sim1, sim2, sim3, sim4];

  // Usar useEffect para actualizar métricas - no en el render
  useEffect(() => {
    const allLoaded = simulations.every((q) => !q.isLoading);

    if (allLoaded && selectedPortfolios.length > 0) {
      const newMetrics: PortfolioMetrics[] = [];

      selectedPortfolios.forEach((portfolio, index) => {
        const simulation = simulations[index]?.data;

        if (simulation) {
          newMetrics.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            expectedReturn: parseFloat(simulation.expectedReturn?.toString() || "0"),
            volatility: parseFloat(simulation.volatility?.toString() || "0"),
            sharpeRatio: parseFloat(simulation.sharpeRatio?.toString() || "0"),
            valueAtRisk95: parseFloat(simulation.valueAtRisk95?.toString() || "0"),
            valueAtRisk99: parseFloat(simulation.valueAtRisk99?.toString() || "0"),
            meanFinalValue: parseFloat(simulation.meanFinalValue?.toString() || "0"),
            diversificationScore: Math.random() * 100,
            concentrationIndex: Math.random() * 100,
          });
        }
      });

      // Solo actualizar si hay cambios
      if (newMetrics.length !== portfolioMetrics.length) {
        setPortfolioMetrics(newMetrics);
      }
    }
  }, [selectedPortfolios, simulations, portfolioMetrics.length]);

  const handleAddPortfolio = (portfolio: SelectedPortfolio) => {
    if (selectedPortfolios.length < 4) {
      setSelectedPortfolios([...selectedPortfolios, portfolio]);
    }
  };

  const handleRemovePortfolio = (portfolioId: number) => {
    setSelectedPortfolios(selectedPortfolios.filter((p) => p.id !== portfolioId));
    setPortfolioMetrics(portfolioMetrics.filter((m) => m.portfolioId !== portfolioId));
  };

  const isLoadingMetrics = simulations.some((q) => q.isLoading);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Comparador de Portafolios</h1>
              <p className="text-slate-400 mt-2">
                Compara múltiples portafolios lado a lado para optimizar tu estrategia de inversión
              </p>
            </div>
          </div>
        </div>

        {portfolios.isLoading ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <p className="text-slate-400">Cargando portafolios...</p>
            </CardContent>
          </Card>
        ) : portfolios.data && portfolios.data.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Selector de Portafolios */}
            <div className="lg:col-span-1">
              <PortfolioSelector
                allPortfolios={portfolios.data.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description || undefined,
                }))}
                selectedPortfolios={selectedPortfolios}
                onAdd={handleAddPortfolio}
                onRemove={handleRemovePortfolio}
                maxPortfolios={4}
              />

              {/* Información Educativa */}
              <Card className="bg-slate-800 border-slate-700 mt-6">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-white mb-3">Cómo Usar</h3>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Selecciona hasta 4 portafolios</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Visualiza métricas lado a lado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Identifica el mejor para tu perfil</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span>Toma decisiones informadas</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Comparación de Portafolios */}
            <div className="lg:col-span-3">
              {isLoadingMetrics ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-12 text-center">
                    <p className="text-slate-400">Cargando métricas...</p>
                  </CardContent>
                </Card>
              ) : selectedPortfolios.length > 0 ? (
                <PortfolioComparison portfolios={portfolioMetrics} />
              ) : (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Selecciona portafolios para comenzar
                    </h3>
                    <p className="text-slate-400">
                      Elige al menos 2 portafolios de la lista para ver la comparación
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay portafolios</h3>
              <p className="text-slate-400 mb-6">
                Crea portafolios en el dashboard para poder compararlos
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ir al Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
