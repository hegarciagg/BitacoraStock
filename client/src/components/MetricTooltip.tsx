import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface MetricTooltipProps {
  metric: string;
  value: number | string;
  unit?: string;
  description: string;
  interpretation?: string;
  className?: string;
}

export function MetricTooltip({
  metric,
  value,
  unit,
  description,
  interpretation,
  className = "",
}: MetricTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 cursor-help ${className}`}>
            <div className="flex-1">
              <p className="text-sm text-slate-400">{metric}</p>
              <p className="text-lg font-semibold text-white">
                {value}
                {unit && <span className="text-sm ml-1">{unit}</span>}
              </p>
            </div>
            <HelpCircle className="w-4 h-4 text-primary hover:text-primary transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 border-slate-700 max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-white">{metric}</p>
            <p className="text-sm text-slate-300">{description}</p>
            {interpretation && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs font-semibold text-primary mb-1">Interpretación:</p>
                <p className="text-xs text-slate-300">{interpretation}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Definiciones de métricas
export const METRIC_DEFINITIONS = {
  expectedReturn: {
    description:
      "Retorno promedio esperado del portafolio basado en las simulaciones de Monte Carlo. Representa la ganancia o pérdida media proyectada.",
    interpretation:
      "Un retorno esperado más alto indica mayor potencial de ganancias, pero generalmente viene acompañado de mayor riesgo.",
  },
  volatility: {
    description:
      "Medida de la variabilidad o fluctuación de los rendimientos del portafolio. Indica qué tan volátil es el portafolio.",
    interpretation:
      "Una volatilidad baja indica un portafolio más estable, mientras que una alta indica mayor riesgo y fluctuaciones más amplias.",
  },
  sharpeRatio: {
    description:
      "Índice que mide el retorno ajustado por riesgo. Compara el exceso de retorno con la volatilidad del portafolio.",
    interpretation:
      "Un Sharpe ratio más alto indica mejor compensación entre riesgo y retorno. Valores > 1 son considerados buenos.",
  },
  valueAtRisk95: {
    description:
      "Pérdida máxima esperada en el 5% de los peores casos (con 95% de confianza). Indica el riesgo de cola del portafolio.",
    interpretation:
      "Un VaR más bajo es preferible. Indica que hay solo 5% de probabilidad de perder más que este valor.",
  },
  valueAtRisk99: {
    description:
      "Pérdida máxima esperada en el 1% de los peores casos (con 99% de confianza). Medida más conservadora del riesgo extremo.",
    interpretation:
      "Más conservador que VaR 95%. Útil para inversores muy aversos al riesgo o instituciones reguladas.",
  },
  meanFinalValue: {
    description:
      "Valor promedio del portafolio al final del período de simulación. Representa la riqueza esperada.",
    interpretation:
      "Un valor final promedio más alto indica mejor desempeño esperado. Compara con el capital inicial para ver la ganancia.",
  },
  diversificationScore: {
    description:
      "Puntuación que mide qué tan bien diversificado está el portafolio entre diferentes activos.",
    interpretation:
      "Una puntuación más alta (cercana a 100) indica mejor diversificación. Reduce el riesgo no sistemático.",
  },
  concentrationIndex: {
    description:
      "Índice de Herfindahl que mide la concentración del portafolio. Valores altos indican portafolios muy concentrados.",
    interpretation:
      "Un índice más bajo es mejor. Valores altos indican dependencia excesiva de pocos activos.",
  },
};
