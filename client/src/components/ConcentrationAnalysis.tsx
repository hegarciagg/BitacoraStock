import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

interface ConcentrationAnalysisProps {
  assets: Array<{
    symbol: string;
    weight: number;
  }>;
}

export function ConcentrationAnalysis({ assets }: ConcentrationAnalysisProps) {
  // Calcular índice de Herfindahl
  const herfindahlIndex = assets.reduce((sum, asset) => sum + Math.pow(asset.weight, 2), 0);
  const diversificationScore = (1 - herfindahlIndex) * 100;

  // Determinar nivel de diversificación
  let diversificationLevel: "low" | "moderate" | "high";
  let diversificationColor: string;
  let diversificationIcon: React.ReactNode;

  if (diversificationScore < 30) {
    diversificationLevel = "low";
    diversificationColor = "text-red-400";
    diversificationIcon = <AlertCircle className="w-5 h-5" />;
  } else if (diversificationScore < 70) {
    diversificationLevel = "moderate";
    diversificationColor = "text-yellow-400";
    diversificationIcon = <TrendingUp className="w-5 h-5" />;
  } else {
    diversificationLevel = "high";
    diversificationColor = "text-green-400";
    diversificationIcon = <CheckCircle className="w-5 h-5" />;
  }

  // Preparar datos para gráficos
  const concentrationData = assets
    .map((asset) => ({
      name: asset.symbol,
      value: asset.weight * 100,
      weight: asset.weight,
    }))
    .sort((a, b) => b.value - a.value);

  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  // Análisis de concentración
  const topAsset = concentrationData[0];
  const top3Concentration = concentrationData
    .slice(0, 3)
    .reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="space-y-6">
      {/* Resumen de Diversificación */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {diversificationIcon}
            Análisis de Diversificación
          </CardTitle>
          <CardDescription className="text-slate-400">
            Evaluación de concentración y riesgo de concentración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Puntuación de Diversificación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">Puntuación de Diversificación</p>
              <div className={`text-3xl font-bold ${diversificationColor}`}>
                {diversificationScore.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-2 capitalize">
                Nivel: {diversificationLevel}
              </p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">Índice de Herfindahl</p>
              <div className="text-3xl font-bold text-primary">
                {herfindahlIndex.toFixed(4)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Rango: 0 (perfecta) a 1 (concentrada)
              </p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">Top 3 Activos</p>
              <div className="text-3xl font-bold text-purple-400">
                {top3Concentration.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Concentración en 3 mayores
              </p>
            </div>
          </div>

          {/* Alertas */}
          <div className="space-y-2">
            {topAsset && topAsset.value > 40 && (
              <div className="p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-semibold">Concentración Alta</p>
                  <p className="text-xs text-red-200">
                    {topAsset.name} representa {topAsset.value.toFixed(1)}% del portafolio. Considera rebalancear.
                  </p>
                </div>
              </div>
            )}

            {diversificationScore < 50 && (
              <div className="p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-300 font-semibold">Diversificación Baja</p>
                  <p className="text-xs text-yellow-200">
                    Considera agregar más activos o reducir la concentración en los principales.
                  </p>
                </div>
              </div>
            )}

            {diversificationScore >= 70 && (
              <div className="p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-300 font-semibold">Diversificación Adecuada</p>
                  <p className="text-xs text-green-200">
                    Tu portafolio tiene una buena diversificación. Mantén este equilibrio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Distribución de Pesos</CardTitle>
            <CardDescription className="text-slate-400">
              Porcentaje de cada activo en el portafolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={concentrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value) => `${(value as number).toFixed(2)}%`}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {concentrationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pastel */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Composición del Portafolio</CardTitle>
            <CardDescription className="text-slate-400">
              Proporción de cada activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={concentrationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {concentrationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value) => `${(value as number).toFixed(2)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Detalles */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Detalles de Activos</CardTitle>
          <CardDescription className="text-slate-400">
            Análisis detallado de cada posición
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Activo</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Peso</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Porcentaje</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Evaluación</th>
                </tr>
              </thead>
              <tbody>
                {concentrationData.map((asset, index) => {
                  let evaluation = "Adecuado";
                  let evaluationColor = "text-green-400";

                  if (asset.value > 40) {
                    evaluation = "Muy Concentrado";
                    evaluationColor = "text-red-400";
                  } else if (asset.value > 25) {
                    evaluation = "Concentrado";
                    evaluationColor = "text-yellow-400";
                  } else if (asset.value < 5) {
                    evaluation = "Muy Pequeño";
                    evaluationColor = "text-slate-400";
                  }

                  return (
                    <tr
                      key={`row-${index}`}
                      className="border-b border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-300">{asset.name}</td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {asset.weight.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {asset.value.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${evaluationColor}`}>
                        {evaluation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card className="bg-blue-900 bg-opacity-30 border border-blue-700">
        <CardHeader>
          <CardTitle className="text-primary">Recomendaciones de Diversificación</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-2 text-sm">
          <ul className="list-disc list-inside space-y-2">
            <li>
              Idealmente, ningún activo debe representar más del 30% del portafolio
            </li>
            <li>
              Una buena diversificación reduce el riesgo no sistemático
            </li>
            <li>
              Considera agregar activos con correlaciones negativas o bajas
            </li>
            <li>
              Revisa y rebalancea tu portafolio periódicamente (trimestral o anual)
            </li>
            <li>
              Usa la matriz de correlación para identificar oportunidades de diversificación
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
