import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { SimulationMetricsEvolution } from "@/components/SimulationMetricsEvolution";

export default function SimulationHistory() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [, navigate] = useLocation();

  const portfolioId_num = parseInt(portfolioId || "0", 10);
  const portfolio = trpc.portfolio.get.useQuery({ portfolioId: portfolioId_num });
  const simulations = trpc.simulation.list.useQuery({ portfolioId: portfolioId_num });

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
              <h1 className="text-3xl font-bold text-white">Historial de Simulaciones</h1>
              <p className="text-slate-400 mt-2">{portfolio.data?.name}</p>
            </div>
          </div>
        </div>

        {simulations.isLoading ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <div className="text-slate-400">Cargando historial de simulaciones...</div>
            </CardContent>
          </Card>
        ) : simulations.data && simulations.data.length > 0 ? (
          <>
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Total de Simulaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {simulations.data.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Primera Simulación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-300">
                    {new Date(simulations.data[0].createdAt).toLocaleDateString("es-ES")}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Hace{" "}
                    {Math.floor(
                      (Date.now() - new Date(simulations.data[0].createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    días
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Última Simulación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-300">
                    {new Date(
                      simulations.data[simulations.data.length - 1].createdAt
                    ).toLocaleDateString("es-ES")}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Hace{" "}
                    {Math.floor(
                      (Date.now() -
                        new Date(
                          simulations.data[simulations.data.length - 1].createdAt
                        ).getTime()) /
                        (1000 * 60)
                    )}{" "}
                    minutos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Promedio Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">
                    {(
                      simulations.data.reduce(
                        (sum: number, sim: any) => sum + parseFloat(sim.sharpeRatio?.toString() || "0"),
                        0
                      ) / simulations.data.length
                    ).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Componente de Evolución de Métricas */}
            <SimulationMetricsEvolution
              simulations={simulations.data.map((sim) => ({
                id: sim.id,
                createdAt: sim.createdAt,
                expectedReturn: parseFloat(sim.expectedReturn?.toString() || "0"),
                volatility: parseFloat(sim.volatility?.toString() || "0"),
                sharpeRatio: parseFloat(sim.sharpeRatio?.toString() || "0"),
                valueAtRisk95: parseFloat(sim.valueAtRisk95?.toString() || "0"),
                valueAtRisk99: parseFloat(sim.valueAtRisk99?.toString() || "0"),
                meanFinalValue: parseFloat(sim.meanFinalValue?.toString() || "0"),
              }))}
            />

            {/* Información Educativa */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Cómo Interpretar el Historial
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Tendencias Positivas</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Retorno esperado en aumento: mejor perspectiva de ganancias</li>
                    <li>Volatilidad en disminución: portafolio más estable</li>
                    <li>Sharpe Ratio en aumento: mejor retorno ajustado por riesgo</li>
                    <li>VaR en disminución: menor riesgo de pérdidas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Tendencias Negativas</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Retorno esperado en disminución: requiere revisión</li>
                    <li>Volatilidad en aumento: portafolio más riesgoso</li>
                    <li>Sharpe Ratio en disminución: peor relación riesgo-retorno</li>
                    <li>VaR en aumento: mayor riesgo de pérdidas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Acciones Recomendadas</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Revisa regularmente el historial para identificar tendencias</li>
                    <li>Compara simulaciones después de cambios en el portafolio</li>
                    <li>Usa las métricas para validar decisiones de rebalanceo</li>
                    <li>Monitorea el VaR para mantener el riesgo dentro de tolerancia</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sin historial de simulaciones</h3>
              <p className="text-slate-400 mb-6">
                Ejecuta simulaciones de Monte Carlo para comenzar a rastrear la evolución del riesgo de tu portafolio.
              </p>
              <Button
                onClick={() => navigate(`/portfolio/${portfolioId}/simulation`)}
                className="bg-primary hover:bg-primary/90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Ejecutar Simulación
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
