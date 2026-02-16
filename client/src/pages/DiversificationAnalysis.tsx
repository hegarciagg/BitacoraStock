import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, AlertCircle, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { CorrelationMatrix } from "@/components/CorrelationMatrix";
import { ConcentrationAnalysis } from "@/components/ConcentrationAnalysis";

/**
 * Calcula la matriz de correlación entre activos
 * Para esta versión, usamos correlaciones predefinidas basadas en tipos de activos
 */
function calculateCorrelationMatrix(assets: Array<{ symbol: string }>): number[][] {
  const n = assets.length;
  const matrix: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  // Correlaciones predefinidas por tipo de activo
  const correlationMap: Record<string, Record<string, number>> = {
    STOCKS: { STOCKS: 1.0, BONDS: 0.15, GOLD: -0.1, CRYPTO: 0.6, REAL_ESTATE: 0.5 },
    BONDS: { STOCKS: 0.15, BONDS: 1.0, GOLD: 0.05, CRYPTO: -0.2, REAL_ESTATE: 0.2 },
    GOLD: { STOCKS: -0.1, BONDS: 0.05, GOLD: 1.0, CRYPTO: -0.3, REAL_ESTATE: 0.1 },
    CRYPTO: { STOCKS: 0.6, BONDS: -0.2, GOLD: -0.3, CRYPTO: 1.0, REAL_ESTATE: 0.4 },
    REAL_ESTATE: { STOCKS: 0.5, BONDS: 0.2, GOLD: 0.1, CRYPTO: 0.4, REAL_ESTATE: 1.0 },
  };

  // Llenar la matriz
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const assetI = assets[i].symbol.toUpperCase();
      const assetJ = assets[j].symbol.toUpperCase();

      if (i === j) {
        matrix[i][j] = 1.0;
      } else if (correlationMap[assetI] && correlationMap[assetI][assetJ] !== undefined) {
        matrix[i][j] = correlationMap[assetI][assetJ];
      } else {
        // Correlación por defecto moderada
        matrix[i][j] = 0.3;
      }
    }
  }

  return matrix;
}

export default function DiversificationAnalysis() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [, navigate] = useLocation();

  const portfolioId_num = parseInt(portfolioId || "0", 10);
  const portfolio = trpc.portfolio.get.useQuery({ portfolioId: portfolioId_num });
  const assets = trpc.portfolioAsset.list.useQuery({ portfolioId: portfolioId_num });

  // Si no hay activos en el portafolio, usar activos por defecto para demostración
  const displayAssets = (assets.data && assets.data.length > 0)
    ? assets.data.map((asset) => ({
        symbol: asset.symbol || `Asset-${asset.id}`,
        weight: parseFloat(asset.percentage?.toString() || "0.1") / 100,
      }))
    : [
        { symbol: "STOCKS", weight: 0.6 },
        { symbol: "BONDS", weight: 0.3 },
        { symbol: "GOLD", weight: 0.1 },
      ];

  const assetSymbols = displayAssets.map((a) => a.symbol);
  const correlationMatrix = calculateCorrelationMatrix(
    assetSymbols.map((symbol) => ({ symbol }))
  );

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
              <h1 className="text-3xl font-bold text-white">Análisis de Diversificación</h1>
              <p className="text-slate-400 mt-2">{portfolio.data?.name}</p>
            </div>
          </div>
        </div>

        {assets.isLoading ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 text-center">
              <div className="text-slate-400">Cargando datos del portafolio...</div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Información General */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Análisis de Diversificación
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Evaluación de la composición y riesgo de concentración de tu portafolio
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">¿Por qué es importante la diversificación?</h4>
                  <p>
                    La diversificación es una estrategia fundamental para reducir el riesgo no sistemático. Al distribuir tu inversión entre múltiples activos con diferentes características, reduces la dependencia de un solo activo y proteges tu portafolio contra volatilidades específicas.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Matriz de Correlación</h4>
                  <p>
                    La matriz muestra cómo se mueven los activos entre sí. Correlaciones negativas (azul) indican que los activos se mueven en direcciones opuestas, lo que es beneficioso para la diversificación. Correlaciones positivas (rojo) significan que se mueven juntos, aumentando el riesgo.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Análisis de Concentración */}
            <ConcentrationAnalysis assets={displayAssets} />

            {/* Matriz de Correlación */}
            <CorrelationMatrix
              assets={assetSymbols}
              correlationMatrix={correlationMatrix}
            />

            {/* Recomendaciones de Rebalanceo */}
            <Card className="bg-green-900 bg-opacity-30 border border-green-700">
              <CardHeader>
                <CardTitle className="text-green-300">Sugerencias de Rebalanceo</CardTitle>
              </CardHeader>
              <CardContent className="text-green-200 space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Basado en tu análisis actual:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {displayAssets.some((a) => a.weight > 0.4) && (
                      <li>
                        Tienes activos muy concentrados. Considera reducir la posición del activo más grande y redistribuir a otros.
                      </li>
                    )}
                    {displayAssets.filter((a) => a.weight < 0.05).length > 0 && (
                      <li>
                        Algunos activos representan menos del 5%. Considera consolidarlos o aumentar su peso si tienen baja correlación.
                      </li>
                    )}
                    {displayAssets.length < 5 && (
                      <li>
                        Con menos de 5 activos, considera agregar más para mejorar la diversificación.
                      </li>
                    )}
                    <li>
                      Revisa la matriz de correlación para identificar activos con baja o negativa correlación.
                    </li>
                    <li>
                      Realiza rebalanceos periódicos (trimestral o anual) para mantener tu asignación objetivo.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Métricas de Riesgo */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Métricas de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <p className="text-slate-400 text-sm mb-2">Número de Activos</p>
                    <p className="text-2xl font-bold text-white">{displayAssets.length}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {displayAssets.length < 5
                        ? "Considera agregar más activos"
                        : "Buen número de activos"}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <p className="text-slate-400 text-sm mb-2">Activo Más Grande</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.max(...displayAssets.map((a) => a.weight * 100)).toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {Math.max(...displayAssets.map((a) => a.weight)) > 0.4
                        ? "Muy concentrado"
                        : "Adecuado"}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <p className="text-slate-400 text-sm mb-2">Promedio de Pesos</p>
                    <p className="text-2xl font-bold text-white">
                      {(100 / displayAssets.length).toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Peso equitativo ideal
                    </p>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <p className="text-slate-400 text-sm mb-2">Desviación Estándar</p>
                    <p className="text-2xl font-bold text-white">
                      {(
                        Math.sqrt(
                          displayAssets.reduce(
                            (sum, a) => sum + Math.pow(a.weight - 1 / displayAssets.length, 2),
                            0
                          ) / displayAssets.length
                        ) * 100
                      ).toFixed(2)}
                      %
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Variabilidad en pesos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
