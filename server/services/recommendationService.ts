/**
 * Servicio de Generación de Recomendaciones Personalizadas
 * Genera recomendaciones basadas en perfil de riesgo y resultados de simulación
 */

import { SimulationResult } from "./monteCarloService";

export interface PortfolioAssetInfo {
  symbol: string;
  weight: number;
  gainLossPercent?: number;
  volatility: number;
}

export interface RecommendationInput {
  portfolioAssets: PortfolioAssetInfo[];
  simulationResult: SimulationResult;
  riskProfile: "conservative" | "moderate" | "aggressive";
  totalPortfolioValue: number;
}

export interface Recommendation {
  type: "rebalance" | "diversify" | "risk_alert" | "opportunity" | "optimization";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  action: string;
  symbol?: string;
  currentWeight?: number;
  targetWeight?: number;
  reason: string;
}

/**
 * Genera recomendaciones basadas en el perfil de riesgo y simulación
 */
export function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  const concentrationRecommendation = analyzeConcentration(input.portfolioAssets, input.riskProfile);
  if (concentrationRecommendation) {
    recommendations.push(concentrationRecommendation);
  }
  
  const riskAlignmentRecommendation = analyzeRiskAlignment(input, input.riskProfile);
  if (riskAlignmentRecommendation) {
    recommendations.push(riskAlignmentRecommendation);
  }
  
  const volatilityRecommendation = analyzeVolatility(input.simulationResult, input.riskProfile);
  if (volatilityRecommendation) {
    recommendations.push(volatilityRecommendation);
  }
  
  const performanceRecommendation = analyzePerformance(input.simulationResult, input.riskProfile);
  if (performanceRecommendation) {
    recommendations.push(performanceRecommendation);
  }
  
  const diversificationRecommendation = analyzeDiversification(input.portfolioAssets);
  if (diversificationRecommendation) {
    recommendations.push(diversificationRecommendation);
  }
  
  return recommendations;
}

/**
 * Analiza la concentración de activos en el portafolio
 */
function analyzeConcentration(assets: PortfolioAssetInfo[], riskProfile: string): Recommendation | null {
  const maxWeight = Math.max(...assets.map((a) => a.weight));
  const maxWeightAsset = assets.find((a) => a.weight === maxWeight);
  
  const concentrationThresholds = {
    conservative: 0.25,
    moderate: 0.35,
    aggressive: 0.45,
  };
  
  const threshold = concentrationThresholds[riskProfile as keyof typeof concentrationThresholds] || 0.35;
  
  if (maxWeight > threshold) {
    return {
      type: "rebalance",
      priority: "high",
      title: "Rebalanceo Recomendado: Concentración Excesiva",
      description: `El activo ${maxWeightAsset?.symbol} representa el ${(maxWeight * 100).toFixed(1)}% de tu portafolio, superando el umbral recomendado del ${(threshold * 100).toFixed(1)}% para un perfil ${riskProfile}.`,
      suggestedActions: [
        {
          action: "Reducir posición",
          symbol: maxWeightAsset?.symbol,
          currentWeight: maxWeight,
          targetWeight: threshold,
          reason: "Disminuir riesgo concentrado en un solo activo",
        },
      ],
    };
  }
  
  return null;
}

/**
 * Analiza la alineación del portafolio con el perfil de riesgo
 */
function analyzeRiskAlignment(input: RecommendationInput, riskProfile: string): Recommendation | null {
  const targetVolatilityRange = {
    conservative: { min: 0.05, max: 0.12 },
    moderate: { min: 0.12, max: 0.20 },
    aggressive: { min: 0.20, max: 0.35 },
  };
  
  const range = targetVolatilityRange[riskProfile as keyof typeof targetVolatilityRange] || { min: 0.12, max: 0.20 };
  const currentVolatility = input.simulationResult.volatility;
  
  if (currentVolatility < range.min) {
    return {
      type: "opportunity",
      priority: "medium",
      title: "Oportunidad: Aumentar Exposición al Riesgo",
      description: `La volatilidad actual (${(currentVolatility * 100).toFixed(1)}%) está por debajo del rango recomendado para tu perfil ${riskProfile} (${(range.min * 100).toFixed(1)}% - ${(range.max * 100).toFixed(1)}%).`,
      suggestedActions: [
        {
          action: "Considerar aumentar exposición a activos de mayor riesgo",
          reason: "Potencialmente mejorar retornos esperados dentro de tu tolerancia al riesgo",
        },
      ],
    };
  }
  
  if (currentVolatility > range.max) {
    return {
      type: "risk_alert",
      priority: "high",
      title: "Alerta de Riesgo: Volatilidad Excesiva",
      description: `La volatilidad actual (${(currentVolatility * 100).toFixed(1)}%) supera el rango recomendado para tu perfil ${riskProfile} (${(range.min * 100).toFixed(1)}% - ${(range.max * 100).toFixed(1)}%).`,
      suggestedActions: [
        {
          action: "Reducir exposición a activos volátiles",
          reason: "Alinear el portafolio con tu tolerancia al riesgo",
        },
      ],
    };
  }
  
  return null;
}

/**
 * Analiza la volatilidad y Value at Risk
 */
function analyzeVolatility(result: SimulationResult, riskProfile: string): Recommendation | null {
  const varThreshold = {
    conservative: 0.10,
    moderate: 0.15,
    aggressive: 0.25,
  };
  
  const threshold = varThreshold[riskProfile as keyof typeof varThreshold] || 0.15;
  const potentialLoss = Math.abs(result.valueAtRisk95);
  
  if (potentialLoss > threshold) {
    return {
      type: "risk_alert",
      priority: "high",
      title: "Alerta: Valor en Riesgo (VaR) Elevado",
      description: `Existe un 5% de probabilidad de que tu portafolio pierda más del ${(potentialLoss * 100).toFixed(1)}% en el horizonte de tiempo simulado.`,
      suggestedActions: [
        {
          action: "Revisar y rebalancear el portafolio",
          reason: "Reducir el riesgo de pérdidas significativas",
        },
      ],
    };
  }
  
  return null;
}

/**
 * Analiza el rendimiento esperado del portafolio
 */
function analyzePerformance(result: SimulationResult, riskProfile: string): Recommendation | null {
  const minExpectedReturn = {
    conservative: 0.03,
    moderate: 0.06,
    aggressive: 0.08,
  };
  
  const threshold = minExpectedReturn[riskProfile as keyof typeof minExpectedReturn] || 0.06;
  
  if (result.expectedReturn < threshold) {
    return {
      type: "optimization",
      priority: "medium",
      title: "Optimización: Rendimiento Esperado Bajo",
      description: `El rendimiento esperado (${(result.expectedReturn * 100).toFixed(1)}%) está por debajo del objetivo para tu perfil ${riskProfile} (${(threshold * 100).toFixed(1)}%).`,
      suggestedActions: [
        {
          action: "Considerar ajustar la asignación de activos",
          reason: "Potencialmente mejorar los retornos esperados",
        },
      ],
    };
  }
  
  return null;
}

/**
 * Analiza la diversificación del portafolio
 */
function analyzeDiversification(assets: PortfolioAssetInfo[]): Recommendation | null {
  if (assets.length < 3) {
    return {
      type: "diversify",
      priority: "high",
      title: "Diversificación Insuficiente",
      description: `Tu portafolio contiene solo ${assets.length} activo(s). Se recomienda tener al menos 5-10 activos para una diversificación adecuada.`,
      suggestedActions: [
        {
          action: "Agregar más activos",
          reason: "Reducir riesgo no sistemático mediante diversificación",
        },
      ],
    };
  }
  
  return null;
}
