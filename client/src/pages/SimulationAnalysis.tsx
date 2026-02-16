import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Zap, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PortfolioCustomizer, type CustomAsset } from "@/components/PortfolioCustomizer";
import {
  DistributionHistogram,
  CumulativeDistribution,
  PercentileAnalysis,
  ScenarioComparison,
} from "@/components/MonteCarloCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonteCarloSummary } from "@/components/MonteCarloSummary";
import { SimulationPathsChart } from "@/components/SimulationPathsChart";
import { SensitivityAnalysis } from "@/components/SensitivityAnalysis";
import { PDFCustomizationDialog } from "@/components/PDFCustomizationDialog";

export default function SimulationAnalysis() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([
    { symbol: "STOCKS", weight: 0.6, expectedReturn: 0.08, volatility: 0.18 },
    { symbol: "BONDS", weight: 0.4, expectedReturn: 0.03, volatility: 0.05 },
  ]);
  const [simParams, setSimParams] = useState({
    numSimulations: "10000",
    timeHorizonDays: "365",
  });

  const portfolioId_num = parseInt(portfolioId || "0", 10);
  const portfolio = trpc.portfolio.get.useQuery({ portfolioId: portfolioId_num });
  const latestSim = trpc.simulation.getLatest.useQuery({ portfolioId: portfolioId_num });
  const assets = trpc.portfolioAsset.list.useQuery({ portfolioId: portfolioId_num });
  const executeSimulation = trpc.simulation.execute.useMutation();

  const handleRunSimulation = async () => {
    try {
      // Calcular valor total desde los activos del portafolio
      const totalValue = assets.data?.reduce((sum, asset) => {
        return sum + parseFloat(asset.totalValue?.toString() || "0");
      }, 0) || 10000;

      // Validar que los pesos sumen 100%
      const totalWeight = customAssets.reduce((sum, asset) => sum + asset.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.001) {
        toast.error(`Los pesos deben sumar 100%. Actual: ${(totalWeight * 100).toFixed(1)}%`);
        return;
      }

      await executeSimulation.mutateAsync({
        portfolioId: portfolioId_num,
        numSimulations: parseInt(simParams.numSimulations, 10),
        timeHorizonDays: parseInt(simParams.timeHorizonDays, 10),
        initialCapital: totalValue,
      });

      toast.success("Simulación ejecutada correctamente");
      setIsOpen(false);
      await latestSim.refetch();
    } catch (error) {
      console.error("Error executing simulation:", error);
      toast.error("Error al ejecutar la simulación");
    }
  };

  const simulationData = latestSim.data && latestSim.data !== null
    ? {
        expectedReturn: latestSim.data.expectedReturn ? parseFloat(latestSim.data.expectedReturn.toString()) : 0,
        volatility: latestSim.data.volatility ? parseFloat(latestSim.data.volatility.toString()) : 0,
        sharpeRatio: latestSim.data.sharpeRatio ? parseFloat(latestSim.data.sharpeRatio.toString()) : 0,
        valueAtRisk95: latestSim.data.valueAtRisk95 ? parseFloat(latestSim.data.valueAtRisk95.toString()) : 0,
        valueAtRisk99: latestSim.data.valueAtRisk99 ? parseFloat(latestSim.data.valueAtRisk99.toString()) : 0,
        meanFinalValue: latestSim.data.meanFinalValue ? parseFloat(latestSim.data.meanFinalValue.toString()) : 0,
        medianFinalValue: latestSim.data.medianFinalValue ? parseFloat(latestSim.data.medianFinalValue.toString()) : 0,
        percentile5: latestSim.data.percentile5 ? parseFloat(latestSim.data.percentile5.toString()) : 0,
        percentile95: latestSim.data.percentile95 ? parseFloat(latestSim.data.percentile95.toString()) : 0,
      }
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/portfolio/${portfolioId}`)}
              className="border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Análisis de Simulación</h1>
              <p className="text-slate-400 mt-2">{portfolio.data?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {latestSim.data && (
              <PDFCustomizationDialog
                simulationId={latestSim.data.id}
                portfolioName={portfolio.data?.name}
              />
            )}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Zap className="w-4 h-4 mr-2" />
                  Ejecutar Simulación
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Configurar y Ejecutar Simulación</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Personaliza el portafolio y los parámetros de simulación.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="portfolio" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700 border-slate-600">
                  <TabsTrigger value="portfolio" className="text-slate-300 data-[state=active]:text-white">
                    Portafolio
                  </TabsTrigger>
                  <TabsTrigger value="parameters" className="text-slate-300 data-[state=active]:text-white">
                    Parámetros
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="space-y-4">
                  <PortfolioCustomizer
                    initialAssets={customAssets}
                    onAssetChange={setCustomAssets}
                  />
                </TabsContent>

                <TabsContent value="parameters" className="space-y-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Parámetros de Simulación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white">Número de Simulaciones</Label>
                        <Input
                          type="number"
                          value={simParams.numSimulations}
                          onChange={(e) => setSimParams({ ...simParams, numSimulations: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          Más simulaciones = resultados más precisos pero más lento. Recomendado: 10,000
                        </p>
                      </div>
                      <div>
                        <Label className="text-white">Horizonte Temporal (días)</Label>
                        <Input
                          type="number"
                          value={simParams.timeHorizonDays}
                          onChange={(e) => setSimParams({ ...simParams, timeHorizonDays: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          Período de proyección. Recomendado: 365 días (1 año)
                        </p>
                      </div>
                      <div className="p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                        <h4 className="text-primary font-semibold mb-2">Información</h4>
                        <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                          <li>Más simulaciones aumentan precisión pero tiempo de cálculo</li>
                          <li>Horizonte temporal afecta la volatilidad proyectada</li>
                          <li>Típicamente se usa 1 año (365 días) para análisis anual</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1 border-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRunSimulation}
                  disabled={executeSimulation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {executeSimulation.isPending ? "Ejecutando..." : "Ejecutar Simulación"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {latestSim.data && latestSim.data !== null ? (
          <>
            {simulationData && (
              <MonteCarloSummary
                expectedReturn={simulationData.expectedReturn}
                volatility={simulationData.volatility}
                sharpeRatio={simulationData.sharpeRatio}
                valueAtRisk95={simulationData.valueAtRisk95}
                valueAtRisk99={simulationData.valueAtRisk99}
                meanFinalValue={simulationData.meanFinalValue}
                medianFinalValue={simulationData.medianFinalValue}
                percentile5={simulationData.percentile5}
                percentile95={simulationData.percentile95}
                initialCapital={latestSim.data?.initialCapital ? parseFloat(latestSim.data.initialCapital.toString()) : 10000}
              />
            )}

            {simulationData && (
              <SimulationPathsChart
                simulationPaths={[]}
                meanFinalValue={simulationData.meanFinalValue}
                percentile5={simulationData.percentile5}
                percentile95={simulationData.percentile95}
                initialCapital={latestSim.data?.initialCapital ? parseFloat(latestSim.data.initialCapital.toString()) : 10000}
              />
            )}

            {simulationData && (
              <SensitivityAnalysis
                baseReturn={simulationData.expectedReturn}
                baseVolatility={simulationData.volatility}
                baseSharpeRatio={simulationData.sharpeRatio}
              />
            )}

            {simulationData && (
              <div className="space-y-6">
                <ScenarioComparison simData={simulationData} />
                <DistributionHistogram simData={simulationData} />
                <CumulativeDistribution simData={simulationData} />
                <PercentileAnalysis simData={simulationData} />
              </div>
            )}
          </>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sin simulaciones</h3>
              <p className="text-slate-400 mb-6">Ejecuta una simulación de Monte Carlo para ver los resultados.</p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Zap className="w-4 h-4 mr-2" />
                    Ejecutar Simulación
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Configurar y Ejecutar Simulación</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Personaliza el portafolio y los parámetros de simulación.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="portfolio" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-700 border-slate-600">
                      <TabsTrigger value="portfolio" className="text-slate-300 data-[state=active]:text-white">
                        Portafolio
                      </TabsTrigger>
                      <TabsTrigger value="parameters" className="text-slate-300 data-[state=active]:text-white">
                        Parámetros
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="portfolio" className="space-y-4">
                      <PortfolioCustomizer
                        initialAssets={customAssets}
                        onAssetChange={setCustomAssets}
                      />
                    </TabsContent>

                    <TabsContent value="parameters" className="space-y-4">
                      <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-white">Parámetros de Simulación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-white">Número de Simulaciones</Label>
                            <Input
                              type="number"
                              value={simParams.numSimulations}
                              onChange={(e) => setSimParams({ ...simParams, numSimulations: e.target.value })}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                            <p className="text-xs text-slate-400 mt-2">
                              Más simulaciones = resultados más precisos pero más lento. Recomendado: 10,000
                            </p>
                          </div>
                          <div>
                            <Label className="text-white">Horizonte Temporal (días)</Label>
                            <Input
                              type="number"
                              value={simParams.timeHorizonDays}
                              onChange={(e) => setSimParams({ ...simParams, timeHorizonDays: e.target.value })}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                            <p className="text-xs text-slate-400 mt-2">
                              Período de proyección. Recomendado: 365 días (1 año)
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="outline"
                      className="flex-1 border-slate-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRunSimulation}
                      disabled={executeSimulation.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {executeSimulation.isPending ? "Ejecutando..." : "Ejecutar Simulación"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Información de la Simulación
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">¿Qué es la Simulación de Monte Carlo?</h4>
              <p>
                La simulación de Monte Carlo es una técnica estadística que utiliza números aleatorios para modelar la incertidumbre en los mercados financieros. Ejecuta miles de simulaciones para proyectar posibles resultados futuros de tu portafolio.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Métricas Clave</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Retorno Esperado:</strong> Ganancia promedio proyectada</li>
                <li><strong>Volatilidad:</strong> Medida de riesgo o variabilidad</li>
                <li><strong>Sharpe Ratio:</strong> Retorno ajustado por riesgo</li>
                <li><strong>VaR:</strong> Pérdida máxima esperada en el 95% de los casos</li>
                <li><strong>Percentiles:</strong> Valores en diferentes escenarios de probabilidad</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
