import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface CorrelationMatrixProps {
  assets: string[];
  correlationMatrix: number[][];
  onAssetHover?: (index: number) => void;
}

/**
 * Obtiene el color basado en el valor de correlación
 * Rojo para correlación positiva fuerte, azul para negativa, blanco para neutral
 */
function getCorrelationColor(value: number): string {
  // Normalizar valor entre -1 y 1
  const normalized = Math.max(-1, Math.min(1, value));

  if (normalized > 0) {
    // Correlación positiva: blanco a rojo
    const intensity = normalized;
    const r = 255;
    const g = Math.round(255 * (1 - intensity * 0.7));
    const b = Math.round(255 * (1 - intensity * 0.7));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized < 0) {
    // Correlación negativa: blanco a azul
    const intensity = Math.abs(normalized);
    const r = Math.round(255 * (1 - intensity * 0.7));
    const g = Math.round(255 * (1 - intensity * 0.7));
    const b = 255;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Neutral
    return "rgb(255, 255, 255)";
  }
}

/**
 * Obtiene el color del texto basado en el fondo
 */
function getTextColor(bgValue: number): string {
  const intensity = Math.abs(bgValue);
  return intensity > 0.5 ? "text-slate-900" : "text-slate-900";
}

export function CorrelationMatrix({
  assets,
  correlationMatrix,
  onAssetHover,
}: CorrelationMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Matriz de Correlación</CardTitle>
        <CardDescription className="text-slate-500">
          Relaciones entre activos del portafolio. Rojo = correlación positiva, Azul = correlación negativa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Encabezado de columnas */}
            <div className="flex">
              <div className="w-24 h-24 flex items-end justify-center pb-2">
                <div className="text-xs text-slate-500 font-semibold">Activos</div>
              </div>
              {assets.map((asset, i) => (
                <div
                  key={`header-${i}`}
                  className="w-24 h-24 flex items-end justify-center pb-2 border-b border-slate-200"
                >
                  <div className="text-xs text-slate-700 font-semibold transform -rotate-45 origin-center whitespace-nowrap">
                    {asset}
                  </div>
                </div>
              ))}
            </div>

            {/* Filas de la matriz */}
            {assets.map((rowAsset, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex">
                {/* Encabezado de fila */}
                <div className="w-24 h-24 flex items-center justify-center border-r border-slate-200 bg-slate-100">
                  <div className="text-xs text-slate-700 font-semibold text-center px-2">
                    {rowAsset}
                  </div>
                </div>

                {/* Celdas de correlación */}
                {correlationMatrix[rowIdx]?.map((value, colIdx) => {
                  const bgColor = getCorrelationColor(value);
                  const textColorClass = getTextColor(value);
                  const isHovered =
                    hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx;

                  return (
                    <TooltipProvider key={`cell-${rowIdx}-${colIdx}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-24 h-24 flex items-center justify-center border border-slate-300 cursor-pointer transition-all ${
                              isHovered ? "ring-2 ring-yellow-400" : ""
                            }`}
                            style={{ backgroundColor: bgColor }}
                            onMouseEnter={() => {
                              setHoveredCell({ row: rowIdx, col: colIdx });
                              onAssetHover?.(rowIdx);
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <span className={`text-sm font-bold ${textColorClass}`}>
                              {value.toFixed(2)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-50 border-slate-200 text-slate-900">
                          <div className="text-sm">
                            <p className="font-semibold">
                              {rowAsset} ↔ {assets[colIdx]}
                            </p>
                            <p className="text-xs text-slate-700 mt-1">
                              Correlación: {value.toFixed(4)}
                            </p>
                            {value > 0.7 && (
                              <p className="text-xs text-red-400 mt-1">
                                ⚠️ Correlación fuerte positiva
                              </p>
                            )}
                            {value < -0.7 && (
                              <p className="text-xs text-primary mt-1">
                                ✓ Correlación fuerte negativa (buena diversificación)
                              </p>
                            )}
                            {Math.abs(value) >= 0.3 && Math.abs(value) <= 0.7 && (
                              <p className="text-xs text-slate-700 mt-1">
                                Correlación moderada
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-300 space-y-3">
          <h4 className="text-slate-900 font-semibold">Interpretación</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: "rgb(255, 100, 100)" }}></div>
                <span className="text-sm text-slate-700">Correlación Positiva Fuerte (0.7 a 1.0)</span>
              </div>
              <p className="text-xs text-slate-500">
                Los activos se mueven juntos. Reduce diversificación.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: "rgb(255, 255, 255)" }}></div>
                <span className="text-sm text-slate-700">Correlación Neutral (cercana a 0)</span>
              </div>
              <p className="text-xs text-slate-500">
                Los activos se mueven independientemente.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: "rgb(100, 100, 255)" }}></div>
                <span className="text-sm text-slate-700">Correlación Negativa Fuerte (-1.0 a -0.7)</span>
              </div>
              <p className="text-xs text-slate-500">
                Los activos se mueven en direcciones opuestas. Excelente diversificación.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
