/**
 * Servicio de Simulación de Monte Carlo para análisis de portafolios
 * Implementa algoritmos de simulación estocástica para proyecciones de inversión
 */

export interface AssetData {
  symbol: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
}

export interface PortfolioData {
  assets: AssetData[];
  initialCapital: number;
  timeHorizonDays: number;
  numSimulations: number;
  riskFreeRate?: number;
}

export interface SimulationResult {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  meanFinalValue: number;
  medianFinalValue: number;
  percentile5: number;
  percentile95: number;
  simulationPaths: number[][];
  finalValues: number[];
}

/**
 * Calcula la media de un array de números
 */
function calculateMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calcula la desviación estándar de un array de números
 */
function calculateStdDev(values: number[]): number {
  const mean = calculateMean(values);
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = calculateMean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calcula el percentil de un array ordenado
 */
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Genera un número aleatorio con distribución normal (Box-Muller)
 */
function randomNormal(): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0;
}

/**
 * Calcula el retorno esperado del portafolio
 */
function calculatePortfolioReturn(assets: AssetData[]): number {
  return assets.reduce((sum, asset) => sum + asset.weight * asset.expectedReturn, 0);
}

/**
 * Calcula la volatilidad del portafolio (asumiendo correlación cero para simplificar)
 */
function calculatePortfolioVolatility(assets: AssetData[]): number {
  const variance = assets.reduce((sum, asset) => sum + Math.pow(asset.weight * asset.volatility, 2), 0);
  return Math.sqrt(variance);
}

/**
 * Ejecuta una simulación de Monte Carlo para un portafolio
 */
export function runMonteCarloSimulation(data: PortfolioData): SimulationResult {
  const riskFreeRate = data.riskFreeRate || 0.02;
  const timeInYears = data.timeHorizonDays / 365;
  
  // Calcular retorno y volatilidad del portafolio
  const portfolioReturn = calculatePortfolioReturn(data.assets);
  const portfolioVolatility = calculatePortfolioVolatility(data.assets);
  
  // Almacenar valores finales de todas las simulaciones
  const finalValues: number[] = [];
  const simulationPaths: number[][] = [];
  
  // Ejecutar simulaciones
  for (let sim = 0; sim < data.numSimulations; sim++) {
    const path: number[] = [data.initialCapital];
    let currentValue = data.initialCapital;
    
    // Generar pasos de tiempo diarios
    const daysPerYear = 252;
    const totalSteps = Math.ceil((data.timeHorizonDays / 365) * daysPerYear);
    const dt = 1 / daysPerYear;
    
    for (let step = 0; step < totalSteps; step++) {
      const randomReturn = randomNormal();
      const dailyReturn = (portfolioReturn * dt) + (portfolioVolatility * Math.sqrt(dt) * randomReturn);
      currentValue = currentValue * (1 + dailyReturn);
      path.push(currentValue);
    }
    
    finalValues.push(currentValue);
    simulationPaths.push(path);
  }
  
  // Calcular estadísticas
  const meanFinalValue = calculateMean(finalValues);
  const medianFinalValue = calculatePercentile(finalValues, 50);
  const stdDevFinalValue = calculateStdDev(finalValues);
  
  // Calcular Sharpe Ratio
  const excessReturn = meanFinalValue - data.initialCapital * Math.exp(riskFreeRate * timeInYears);
  const sharpeRatio = excessReturn / (stdDevFinalValue || 1);
  
  // Calcular Value at Risk (VaR)
  const valueAtRisk95 = calculatePercentile(finalValues, 5);
  const valueAtRisk99 = calculatePercentile(finalValues, 1);
  
  return {
    expectedReturn: portfolioReturn,
    volatility: portfolioVolatility,
    sharpeRatio,
    valueAtRisk95,
    valueAtRisk99,
    meanFinalValue,
    medianFinalValue,
    percentile5: calculatePercentile(finalValues, 5),
    percentile95: calculatePercentile(finalValues, 95),
    simulationPaths,
    finalValues,
  };
}

/**
 * Calcula métricas financieras clave
 */
export function calculateFinancialMetrics(data: PortfolioData) {
  const portfolioReturn = calculatePortfolioReturn(data.assets);
  const portfolioVolatility = calculatePortfolioVolatility(data.assets);
  const riskFreeRate = data.riskFreeRate || 0.02;
  const sharpeRatio = (portfolioReturn - riskFreeRate) / (portfolioVolatility || 1);
  
  return {
    expectedReturn: portfolioReturn,
    volatility: portfolioVolatility,
    sharpeRatio,
  };
}

/**
 * Analiza la diversificación del portafolio
 */
export function analyzeDiversification(assets: AssetData[]) {
  const herfindahlIndex = assets.reduce((sum, asset) => sum + Math.pow(asset.weight, 2), 0);
  const diversificationScore = (1 - herfindahlIndex) * 100;
  
  let diversificationLevel: "low" | "moderate" | "high";
  if (diversificationScore < 30) {
    diversificationLevel = "low";
  } else if (diversificationScore < 70) {
    diversificationLevel = "moderate";
  } else {
    diversificationLevel = "high";
  }
  
  return {
    herfindahlIndex,
    diversificationScore,
    diversificationLevel,
    assetConcentration: assets.map((asset) => ({
      symbol: asset.symbol,
      weight: asset.weight,
      concentration: asset.weight * 100,
    })),
  };
}


/**
 * Ejecuta una simulación de Monte Carlo ajustada por análisis de sentimiento
 */
export function runMonteCarloSimulationWithSentiment(
  data: PortfolioData,
  sentimentAdjustment: { volatilityFactor: number; returnAdjustment: number }
): SimulationResult {
  const riskFreeRate = data.riskFreeRate || 0.02;
  const timeInYears = data.timeHorizonDays / 365;
  
  // Calcular retorno y volatilidad del portafolio
  let portfolioReturn = calculatePortfolioReturn(data.assets);
  let portfolioVolatility = calculatePortfolioVolatility(data.assets);
  
  // Aplicar ajustes de sentimiento
  portfolioReturn = portfolioReturn + sentimentAdjustment.returnAdjustment;
  portfolioVolatility = portfolioVolatility * sentimentAdjustment.volatilityFactor;
  
  // Almacenar valores finales de todas las simulaciones
  const finalValues: number[] = [];
  const simulationPaths: number[][] = [];
  
  // Ejecutar simulaciones
  for (let sim = 0; sim < data.numSimulations; sim++) {
    const path: number[] = [data.initialCapital];
    let currentValue = data.initialCapital;
    
    // Generar pasos de tiempo diarios
    const daysPerYear = 252;
    const totalSteps = Math.ceil((data.timeHorizonDays / 365) * daysPerYear);
    const dt = 1 / daysPerYear;
    
    for (let step = 0; step < totalSteps; step++) {
      const randomReturn = randomNormal();
      const dailyReturn = (portfolioReturn * dt) + (portfolioVolatility * Math.sqrt(dt) * randomReturn);
      currentValue = currentValue * (1 + dailyReturn);
      path.push(currentValue);
    }
    
    finalValues.push(currentValue);
    simulationPaths.push(path);
  }
  
  // Calcular estadísticas
  const meanFinalValue = calculateMean(finalValues);
  const medianFinalValue = calculatePercentile(finalValues, 50);
  const stdDevFinalValue = calculateStdDev(finalValues);
  
  // Calcular Sharpe Ratio
  const excessReturn = meanFinalValue - data.initialCapital * Math.exp(riskFreeRate * timeInYears);
  const sharpeRatio = excessReturn / (stdDevFinalValue || 1);
  
  // Calcular Value at Risk (VaR)
  const valueAtRisk95 = calculatePercentile(finalValues, 5);
  const valueAtRisk99 = calculatePercentile(finalValues, 1);
  
  return {
    expectedReturn: portfolioReturn,
    volatility: portfolioVolatility,
    sharpeRatio,
    valueAtRisk95,
    valueAtRisk99,
    meanFinalValue,
    medianFinalValue,
    percentile5: calculatePercentile(finalValues, 5),
    percentile95: calculatePercentile(finalValues, 95),
    simulationPaths,
    finalValues,
  };
}

/**
 * Compara simulación normal vs ajustada por sentimiento
 */
export function compareSimulationsWithSentiment(
  data: PortfolioData,
  sentimentAdjustment: { volatilityFactor: number; returnAdjustment: number }
) {
  const normalSimulation = runMonteCarloSimulation(data);
  const sentimentAdjustedSimulation = runMonteCarloSimulationWithSentiment(data, sentimentAdjustment);
  
  return {
    normal: normalSimulation,
    sentimentAdjusted: sentimentAdjustedSimulation,
    comparison: {
      returnDifference: sentimentAdjustedSimulation.expectedReturn - normalSimulation.expectedReturn,
      volatilityDifference: sentimentAdjustedSimulation.volatility - normalSimulation.volatility,
      sharpeDifference: sentimentAdjustedSimulation.sharpeRatio - normalSimulation.sharpeRatio,
      meanValueDifference: sentimentAdjustedSimulation.meanFinalValue - normalSimulation.meanFinalValue,
      varDifference95: sentimentAdjustedSimulation.valueAtRisk95 - normalSimulation.valueAtRisk95,
    },
  };
}
