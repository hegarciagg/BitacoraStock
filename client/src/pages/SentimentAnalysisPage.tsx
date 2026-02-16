import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SentimentAnalysisDisplay from "@/components/SentimentAnalysisDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";

export default function SentimentAnalysisPage() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Datos de ejemplo de análisis de sentimiento
  const sentimentData = useMemo(() => ({
    overallSentiment: 0.35,
    marketConfidence: 0.72,
    correlations: [
      {
        asset: 'AAPL',
        sentimentImpact: 0.35,
        historicalCorrelation: 0.75,
        confidence: 0.63,
        expectedMovement: 2.63,
      },
      {
        asset: 'MSFT',
        sentimentImpact: 0.35,
        historicalCorrelation: 0.72,
        confidence: 0.61,
        expectedMovement: 2.52,
      },
      {
        asset: 'SPY',
        sentimentImpact: 0.35,
        historicalCorrelation: 0.65,
        confidence: 0.56,
        expectedMovement: 2.28,
      },
      {
        asset: 'QQQ',
        sentimentImpact: 0.35,
        historicalCorrelation: 0.70,
        confidence: 0.60,
        expectedMovement: 2.45,
      },
      {
        asset: 'BTC',
        sentimentImpact: 0.35,
        historicalCorrelation: 0.85,
        confidence: 0.71,
        expectedMovement: 2.98,
      },
    ],
    riskAdjustment: 1.15,
    recommendedAction: 'comprar' as const,
    explanation:
      'Sentimiento de mercado positivo con confianza moderada-alta. Las noticias recientes muestran optimismo sobre crecimiento económico y resultados corporativos. Impacto esperado en activos: AAPL +2.63%, MSFT +2.52%, SPY +2.28%, QQQ +2.45%, BTC +2.98%. Volatilidad ajustada por factor de 1.15 debido al sentimiento positivo.',
  }), []);

  const handleRefreshAnalysis = async () => {
    setIsLoading(true);
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-400">Por favor inicia sesión para acceder a esta página</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              Análisis de Sentimiento Avanzado
            </h1>
            <p className="text-slate-400 mt-2">Correlación de noticias con movimientos históricos del mercado</p>
          </div>
          <Button
            onClick={handleRefreshAnalysis}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar Análisis
              </>
            )}
          </Button>
        </div>

        {/* Información de Contexto */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cómo Funciona el Análisis de Sentimiento</CardTitle>
            <CardDescription>Metodología de correlación con movimientos históricos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="font-semibold text-white mb-2">1. Análisis de Noticias</div>
                <div className="text-sm text-slate-300">
                  Se analizan noticias financieras en tiempo real usando procesamiento de lenguaje natural para identificar sentimiento positivo, negativo o neutral.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="font-semibold text-white mb-2">2. Correlación Histórica</div>
                <div className="text-sm text-slate-300">
                  Se correlaciona el sentimiento actual con patrones históricos de movimientos de mercado para cada activo específico.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="font-semibold text-white mb-2">3. Predicción Ajustada</div>
                <div className="text-sm text-slate-300">
                  Las simulaciones de Monte Carlo se ajustan con factores de riesgo basados en sentimiento para mejorar precisión de proyecciones.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análisis de Sentimiento Principal */}
        <SentimentAnalysisDisplay data={sentimentData} />

        {/* Recomendaciones */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recomendaciones Basadas en Sentimiento</CardTitle>
            <CardDescription>Acciones sugeridas según análisis actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="font-semibold text-green-500 mb-2">✓ Oportunidad de Compra</div>
              <div className="text-sm text-slate-300">
                El sentimiento positivo del mercado y las correlaciones históricas sugieren una oportunidad de compra en activos tecnológicos y de amplio mercado. Se recomienda aumentar exposición gradualmente.
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="font-semibold text-primary mb-2">ℹ Consideraciones de Riesgo</div>
              <div className="text-sm text-slate-300">
                La volatilidad ajustada es 1.15x, indicando mayor variabilidad esperada. Se recomienda mantener posiciones de cobertura y revisar límites de pérdida.
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="font-semibold text-yellow-500 mb-2">⚠ Monitoreo Continuo</div>
              <div className="text-sm text-slate-300">
                Mantén vigilancia sobre cambios en sentimiento de mercado. Un cambio significativo en noticias podría revertir estas recomendaciones rápidamente.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
