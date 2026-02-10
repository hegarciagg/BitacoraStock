/**
 * Servicio de Análisis de Escenarios de Mercado
 * Permite modelar el impacto de eventos de mercado específicos en portafolios
 */

export interface MarketScenario {
  name: string;
  description: string;
  equityImpact: number; // Cambio porcentual en acciones
  bondImpact: number; // Cambio porcentual en bonos
  cryptoImpact: number; // Cambio porcentual en criptomonedas
  commodityImpact: number; // Cambio porcentual en commodities
  volatilityMultiplier: number; // Multiplicador de volatilidad (1 = normal, 2 = doble)
  correlationShift: number; // Cambio en correlaciones entre activos
}

export interface ScenarioResult {
  scenarioName: string;
  portfolioImpact: number; // Cambio porcentual total del portafolio
  newPortfolioValue: number;
  assetImpacts: Record<string, number>; // Impacto por activo
  riskMetrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    valueAtRisk95: number;
    valueAtRisk99: number;
  };
  recommendations: string[];
}

// Escenarios predefinidos
export const PREDEFINED_SCENARIOS: Record<string, MarketScenario> = {
  "market_crash": {
    name: "Caída de Mercado",
    description: "Caída abrupta del 20% en mercados globales",
    equityImpact: -0.20,
    bondImpact: 0.05,
    cryptoImpact: -0.35,
    commodityImpact: -0.10,
    volatilityMultiplier: 2.5,
    correlationShift: 0.3,
  },
  "inflation_spike": {
    name: "Pico de Inflación",
    description: "Aumento repentino de inflación al 8%",
    equityImpact: -0.12,
    bondImpact: -0.15,
    cryptoImpact: 0.10,
    commodityImpact: 0.25,
    volatilityMultiplier: 1.8,
    correlationShift: 0.2,
  },
  "recession": {
    name: "Recesión Económica",
    description: "Contracción económica del 2% con desempleo al 6%",
    equityImpact: -0.25,
    bondImpact: 0.15,
    cryptoImpact: -0.40,
    commodityImpact: -0.20,
    volatilityMultiplier: 2.2,
    correlationShift: 0.4,
  },
  "rate_hike": {
    name: "Aumento de Tasas",
    description: "Aumento de 2% en tasas de interés",
    equityImpact: -0.08,
    bondImpact: -0.10,
    cryptoImpact: -0.15,
    commodityImpact: 0.05,
    volatilityMultiplier: 1.5,
    correlationShift: 0.15,
  },
  "geopolitical_crisis": {
    name: "Crisis Geopolítica",
    description: "Tensiones geopolíticas y conflictos regionales",
    equityImpact: -0.15,
    bondImpact: 0.08,
    cryptoImpact: -0.20,
    commodityImpact: 0.30,
    volatilityMultiplier: 2.8,
    correlationShift: 0.35,
  },
  "tech_boom": {
    name: "Boom Tecnológico",
    description: "Auge en sector tecnológico e innovación",
    equityImpact: 0.25,
    bondImpact: -0.05,
    cryptoImpact: 0.40,
    commodityImpact: -0.10,
    volatilityMultiplier: 1.3,
    correlationShift: -0.1,
  },
  "bull_market": {
    name: "Mercado Alcista",
    description: "Tendencia alcista sostenida en mercados",
    equityImpact: 0.20,
    bondImpact: 0.05,
    cryptoImpact: 0.30,
    commodityImpact: 0.10,
    volatilityMultiplier: 0.8,
    correlationShift: -0.15,
  },
  "currency_crisis": {
    name: "Crisis de Divisas",
    description: "Devaluación significativa de monedas locales",
    equityImpact: -0.18,
    bondImpact: 0.10,
    cryptoImpact: 0.25,
    commodityImpact: 0.15,
    volatilityMultiplier: 2.0,
    correlationShift: 0.25,
  },
};

/**
 * Calcula el impacto de un escenario en un portafolio
 */
export function analyzeScenarioImpact(
  portfolioAssets: Record<string, number>, // { assetName: percentage }
  currentPrices: Record<string, number>, // { assetName: price }
  scenario: MarketScenario,
  portfolioValue: number
): ScenarioResult {
  const assetImpacts: Record<string, number> = {};
  let totalImpact = 0;

  // Calcular impacto por tipo de activo
  const assetTypeMap: Record<string, number> = {
    "stock": scenario.equityImpact,
    "etf": scenario.equityImpact * 0.8, // ETFs son menos volátiles
    "bond": scenario.bondImpact,
    "crypto": scenario.cryptoImpact,
    "commodity": scenario.commodityImpact,
    "cash": 0,
  };

  // Calcular impacto ponderado
  for (const [assetName, percentage] of Object.entries(portfolioAssets)) {
    // Inferir tipo de activo del nombre (simplificado)
    let assetType = "stock";
    if (assetName.toLowerCase().includes("bond")) assetType = "bond";
    else if (assetName.toLowerCase().includes("btc") || assetName.toLowerCase().includes("eth")) assetType = "crypto";
    else if (assetName.toLowerCase().includes("gold") || assetName.toLowerCase().includes("oil")) assetType = "commodity";
    else if (assetName.toLowerCase().includes("cash")) assetType = "cash";

    const impact = assetTypeMap[assetType] || 0;
    assetImpacts[assetName] = impact;
    totalImpact += impact * (percentage / 100);
  }

  const newPortfolioValue = portfolioValue * (1 + totalImpact);
  const portfolioImpact = totalImpact;

  // Calcular nuevas métricas de riesgo bajo el escenario
  const baseVolatility = 0.15; // Volatilidad base
  const newVolatility = baseVolatility * scenario.volatilityMultiplier;
  const expectedReturn = totalImpact; // Retorno esperado es el impacto del escenario
  const sharpeRatio = expectedReturn / newVolatility;

  // Calcular VaR bajo el escenario
  const valueAtRisk95 = portfolioValue * (1.645 * newVolatility);
  const valueAtRisk99 = portfolioValue * (2.326 * newVolatility);

  // Generar recomendaciones
  const recommendations = generateScenarioRecommendations(
    scenario,
    portfolioImpact,
    newVolatility,
    assetImpacts
  );

  return {
    scenarioName: scenario.name,
    portfolioImpact,
    newPortfolioValue,
    assetImpacts,
    riskMetrics: {
      expectedReturn,
      volatility: newVolatility,
      sharpeRatio,
      valueAtRisk95,
      valueAtRisk99,
    },
    recommendations,
  };
}

/**
 * Genera recomendaciones basadas en el análisis de escenario
 */
function generateScenarioRecommendations(
  scenario: MarketScenario,
  portfolioImpact: number,
  volatility: number,
  assetImpacts: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  // Recomendaciones basadas en impacto del portafolio
  if (portfolioImpact < -0.15) {
    recommendations.push("Considera aumentar tu exposición a bonos para reducir riesgo");
    recommendations.push("Revisa tu perfil de riesgo y ajusta la asignación de activos");
  }

  if (portfolioImpact > 0.15) {
    recommendations.push("Este escenario es favorable para tu portafolio");
    recommendations.push("Considera mantener tu posición actual");
  }

  // Recomendaciones basadas en volatilidad
  if (volatility > 0.30) {
    recommendations.push("La volatilidad esperada es muy alta, considera diversificar más");
    recommendations.push("Aumenta tu horizonte de inversión para absorber la volatilidad");
  }

  // Recomendaciones basadas en activos específicos
  const worstAsset = Object.entries(assetImpacts).reduce((prev, current) =>
    current[1] < prev[1] ? current : prev
  );

  if (worstAsset[1] < -0.20) {
    recommendations.push(
      `${worstAsset[0]} sería muy afectado en este escenario. Considera reducir exposición.`
    );
  }

  // Recomendaciones generales
  if (scenario.name.includes("Caída") || scenario.name.includes("Recesión")) {
    recommendations.push("Mantén un fondo de emergencia en efectivo");
    recommendations.push("Considera coberturas defensivas como opciones put");
  }

  return recommendations.slice(0, 3); // Retornar máximo 3 recomendaciones
}

/**
 * Compara múltiples escenarios
 */
export function compareScenarios(
  scenarios: ScenarioResult[]
): {
  bestCase: ScenarioResult;
  worstCase: ScenarioResult;
  averageImpact: number;
  volatilityOfImpacts: number;
} {
  const impacts = scenarios.map((s) => s.portfolioImpact);
  const bestCase = scenarios.reduce((prev, current) =>
    current.portfolioImpact > prev.portfolioImpact ? current : prev
  );
  const worstCase = scenarios.reduce((prev, current) =>
    current.portfolioImpact < prev.portfolioImpact ? current : prev
  );

  const averageImpact = impacts.reduce((a, b) => a + b, 0) / impacts.length;
  const variance =
    impacts.reduce((sum, impact) => sum + Math.pow(impact - averageImpact, 2), 0) /
    impacts.length;
  const volatilityOfImpacts = Math.sqrt(variance);

  return {
    bestCase,
    worstCase,
    averageImpact,
    volatilityOfImpacts,
  };
}

/**
 * Calcula análisis de sensibilidad
 */
export function calculateSensitivityAnalysis(
  baseScenario: MarketScenario,
  portfolioAssets: Record<string, number>,
  portfolioValue: number,
  variationRange: number = 0.05 // 5% de variación
): Record<string, number[]> {
  const sensitivityResults: Record<string, number[]> = {};

  // Analizar sensibilidad a cambios en cada factor
  const factors = [
    "equityImpact",
    "bondImpact",
    "cryptoImpact",
    "commodityImpact",
    "volatilityMultiplier",
  ] as const;

  for (const factor of factors) {
    const results: number[] = [];

    // Crear variaciones del escenario
    for (let i = -2; i <= 2; i++) {
      const variation = i * variationRange;
      const modifiedScenario = { ...baseScenario };

      if (factor === "volatilityMultiplier") {
        modifiedScenario[factor] = Math.max(0.5, baseScenario[factor] + variation);
      } else {
        modifiedScenario[factor] = (baseScenario[factor] as number) + variation;
      }

      const result = analyzeScenarioImpact(
        portfolioAssets,
        {},
        modifiedScenario,
        portfolioValue
      );
      results.push(result.portfolioImpact);
    }

    sensitivityResults[factor] = results;
  }

  return sensitivityResults;
}
