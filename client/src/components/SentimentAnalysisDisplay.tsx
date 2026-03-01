import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

export interface SentimentAnalysisData {
  overallSentiment: number; // -1 a 1
  marketConfidence: number; // 0 a 1
  correlations: Array<{
    asset: string;
    sentimentImpact: number;
    historicalCorrelation: number;
    confidence: number;
    expectedMovement: number;
  }>;
  riskAdjustment: number;
  recommendedAction: 'comprar' | 'vender' | 'mantener';
  explanation: string;
}

interface SentimentAnalysisDisplayProps {
  data: SentimentAnalysisData;
}

export default function SentimentAnalysisDisplay({ data }: SentimentAnalysisDisplayProps) {
  const sentimentLabel = data.overallSentiment > 0.2 ? 'Positivo' : data.overallSentiment < -0.2 ? 'Negativo' : 'Neutral';
  const sentimentColor = data.overallSentiment > 0.2 ? 'text-green-500' : data.overallSentiment < -0.2 ? 'text-red-500' : 'text-yellow-500';
  const sentimentBg = data.overallSentiment > 0.2 ? 'bg-green-500/10' : data.overallSentiment < -0.2 ? 'bg-red-500/10' : 'bg-yellow-500/10';

  const actionIcon = data.recommendedAction === 'comprar' ? <TrendingUp className="w-4 h-4" /> : data.recommendedAction === 'vender' ? <TrendingDown className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  const actionColor = data.recommendedAction === 'comprar' ? 'bg-green-500/10 text-green-500' : data.recommendedAction === 'vender' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-primary';

  return (
    <div className="space-y-6">
      {/* Resumen de Sentimiento */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Análisis de Sentimiento de Mercado
          </CardTitle>
          <CardDescription>Correlación de noticias con movimientos históricos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Sentimiento General */}
            <div className={`p-4 rounded-lg ${sentimentBg} border border-slate-200`}>
              <div className="text-sm text-slate-500 mb-2">Sentimiento General</div>
              <div className={`text-2xl font-bold ${sentimentColor}`}>{sentimentLabel}</div>
              <div className="text-xs text-slate-500 mt-2">Puntuación: {(data.overallSentiment * 100).toFixed(0)}</div>
            </div>

            {/* Confianza del Mercado */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-slate-200">
              <div className="text-sm text-slate-500 mb-2">Confianza del Mercado</div>
              <div className="text-2xl font-bold text-primary">{(data.marketConfidence * 100).toFixed(0)}%</div>
              <div className="text-xs text-slate-500 mt-2">
                {data.marketConfidence > 0.7 ? 'Alta' : data.marketConfidence > 0.4 ? 'Moderada' : 'Baja'}
              </div>
            </div>

            {/* Acción Recomendada */}
            <div className={`p-4 rounded-lg ${actionColor} border border-slate-200`}>
              <div className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                {actionIcon}
                Acción Recomendada
              </div>
              <div className="text-2xl font-bold capitalize">{data.recommendedAction}</div>
              <div className="text-xs text-slate-500 mt-2">Basado en análisis actual</div>
            </div>
          </div>

          {/* Explicación */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 border border-slate-300">
            <div className="text-sm text-slate-700">{data.explanation}</div>
          </div>
        </CardContent>
      </Card>

      {/* Impacto por Activo */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Impacto Esperado por Activo</CardTitle>
          <CardDescription>Movimiento esperado basado en sentimiento y correlación histórica</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.correlations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="asset" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
              <Legend />
              <Bar dataKey="expectedMovement" fill="#3b82f6" name="Movimiento Esperado (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Matriz de Correlación */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Matriz de Correlación Sentimiento-Histórica</CardTitle>
          <CardDescription>Relación entre sentimiento actual y movimientos históricos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis type="number" dataKey="sentimentImpact" name="Impacto de Sentimiento" stroke="#64748b" />
              <YAxis type="number" dataKey="historicalCorrelation" name="Correlación Histórica" stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name="Activos" data={data.correlations} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla Detallada */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Análisis Detallado por Activo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-4 text-slate-500">Activo</th>
                  <th className="text-right py-2 px-4 text-slate-500">Impacto Sentimiento</th>
                  <th className="text-right py-2 px-4 text-slate-500">Correlación Histórica</th>
                  <th className="text-right py-2 px-4 text-slate-500">Confianza</th>
                  <th className="text-right py-2 px-4 text-slate-500">Movimiento Esperado</th>
                </tr>
              </thead>
              <tbody>
                {data.correlations.map((corr, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 border border-slate-200">
                    <td className="py-2 px-4 text-slate-900 font-medium">{corr.asset}</td>
                    <td className="text-right py-2 px-4">
                      <span className={corr.sentimentImpact > 0 ? 'text-green-500' : 'text-red-500'}>
                        {(corr.sentimentImpact * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-4 text-slate-700">{(corr.historicalCorrelation * 100).toFixed(0)}%</td>
                    <td className="text-right py-2 px-4">
                      <Badge variant="outline" className="bg-slate-100">
                        {(corr.confidence * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="text-right py-2 px-4">
                      <span className={corr.expectedMovement > 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                        {corr.expectedMovement > 0 ? '+' : ''}{corr.expectedMovement.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ajuste de Riesgo */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Ajuste de Volatilidad</CardTitle>
          <CardDescription>Factor de ajuste aplicado a simulaciones de Monte Carlo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 border border-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 mb-2">Factor de Riesgo</div>
                <div className="text-3xl font-bold text-slate-900">{data.riskAdjustment.toFixed(2)}x</div>
                <div className="text-xs text-slate-500 mt-2">
                  {data.riskAdjustment > 1.1 ? 'Mayor volatilidad esperada' : data.riskAdjustment < 0.9 ? 'Menor volatilidad esperada' : 'Volatilidad estable'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500 mb-2">Impacto</div>
                <div className="text-lg font-semibold text-primary">
                  {((data.riskAdjustment - 1) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-2">Cambio en volatilidad</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
