import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useMemo } from "react";

interface SimulationPathsChartProps {
  simulationPaths: number[][];
  meanFinalValue: number;
  percentile5: number;
  percentile95: number;
  initialCapital: number;
}

export function SimulationPathsChart({
  simulationPaths,
  meanFinalValue,
  percentile5,
  percentile95,
  initialCapital,
}: SimulationPathsChartProps) {
  const chartData = useMemo(() => {
    if (!simulationPaths || simulationPaths.length === 0) return [];

    // Tomar una muestra de caminos para visualizar (máximo 100 para no sobrecargar)
    const sampleSize = Math.min(100, simulationPaths.length);
    const step = Math.max(1, Math.floor(simulationPaths.length / sampleSize));
    const sampledPaths = simulationPaths.filter((_, i) => i % step === 0);

    // Encontrar la longitud máxima de los caminos
    const maxLength = Math.max(...sampledPaths.map(p => p.length));

    // Crear datos para el gráfico
    const data = [];
    for (let i = 0; i < maxLength; i++) {
      const dataPoint: any = { time: i };
      
      // Agregar cada camino muestreado
      sampledPaths.forEach((path, pathIndex) => {
        if (i < path.length) {
          dataPoint[`path_${pathIndex}`] = path[i];
        }
      });

      data.push(dataPoint);
    }

    return data;
  }, [simulationPaths]);

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
  ];

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Caminos de Simulación</CardTitle>
        <CardDescription className="text-slate-500">
          Proyecciones de valor del portafolio a lo largo del tiempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                label={{ value: "Días", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis 
                stroke="#64748b"
                label={{ value: "Valor ($)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              
              {/* Líneas de referencia */}
              <ReferenceLine 
                y={initialCapital} 
                stroke="#64748b" 
                strokeDasharray="5 5" 
                label={{ value: "Capital Inicial", position: "right", fill: "#94a3b8", fontSize: 12 }}
              />
              <ReferenceLine 
                y={meanFinalValue} 
                stroke="#10b981" 
                strokeDasharray="5 5" 
                label={{ value: "Valor Esperado", position: "right", fill: "#10b981", fontSize: 12 }}
              />
              <ReferenceLine 
                y={percentile95} 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                label={{ value: "Percentil 95%", position: "right", fill: "#f59e0b", fontSize: 12 }}
              />
              <ReferenceLine 
                y={percentile5} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                label={{ value: "Percentil 5%", position: "right", fill: "#ef4444", fontSize: 12 }}
              />

              {/* Líneas de caminos */}
              {chartData.length > 0 && Object.keys(chartData[0])
                .filter(key => key.startsWith("path_"))
                .slice(0, 10)
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={1}
                    opacity={0.6}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-300">
          <p className="text-sm text-slate-500">
            Se muestran hasta 10 caminos de simulación de las {simulationPaths.length} simulaciones ejecutadas.
            Las líneas de referencia indican el capital inicial, valor esperado y percentiles de riesgo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
