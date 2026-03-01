import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, AlertCircle, CheckCircle, Lightbulb, TrendingUp } from "lucide-react";

export default function Recommendations() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [, navigate] = useLocation();

  const portfolioId_num = parseInt(portfolioId || "0", 10);
  const portfolio = trpc.portfolio.get.useQuery({ portfolioId: portfolioId_num });
  const recommendations = trpc.recommendation.list.useQuery({ portfolioId: portfolioId_num });

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      case "low":
        return "border-blue-500 bg-blue-500/10";
      default:
        return "border-slate-500 bg-slate-500/10";
    }
  };

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "medium":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      default:
        return <TrendingUp className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      rebalance: "Rebalanceo",
      diversify: "Diversificación",
      risk_alert: "Alerta de Riesgo",
      opportunity: "Oportunidad",
      optimization: "Optimización",
    };
    return labels[type || ""] || type || "Recomendación";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/portfolio/${portfolioId}`)}
            className="border-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Recomendaciones Personalizadas</h1>
            <p className="text-slate-500 mt-2">{portfolio.data?.name}</p>
          </div>
        </div>

        {recommendations.isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Cargando recomendaciones...</p>
          </div>
        ) : recommendations.data && recommendations.data.length > 0 ? (
          <div className="space-y-4">
            {recommendations.data.map((rec) => (
              <Card key={rec.id} className={`border-2 ${getPriorityColor(rec.priority || "medium")} bg-white shadow-sm`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(rec.priority || "medium")}
                      <div>
                        <CardTitle className="text-slate-900">{rec.title}</CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                          {getTypeLabel(rec.recommendationType)} • Prioridad: {rec.priority === "high" ? "Alta" : rec.priority === "medium" ? "Media" : "Baja"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-700">{rec.description}</p>
                  
                  {rec.suggestedActions && rec.suggestedActions !== null && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Acciones Sugeridas:</h4>
                      <p className="text-slate-700">Recomendaciones disponibles para optimizar tu portafolio.</p>
                    </div>
                  ) as any}

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Aplicar Recomendación
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-300">
                      Descartar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="pt-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">¡Portafolio Optimizado!</h3>
              <p className="text-slate-500">
                Tu portafolio está bien balanceado según tu perfil de riesgo. No hay recomendaciones en este momento.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Cómo Usar las Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Prioridades</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-red-400">Alta:</strong> Requiere atención inmediata</li>
                <li><strong className="text-yellow-400">Media:</strong> Considera implementar pronto</li>
                <li><strong className="text-primary">Baja:</strong> Mejora opcional</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Tipos de Recomendaciones</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Rebalanceo:</strong> Ajusta pesos de activos</li>
                <li><strong>Diversificación:</strong> Agrega nuevos activos</li>
                <li><strong>Alerta de Riesgo:</strong> Reduce exposición al riesgo</li>
                <li><strong>Oportunidad:</strong> Aprovecha oportunidades de mercado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
