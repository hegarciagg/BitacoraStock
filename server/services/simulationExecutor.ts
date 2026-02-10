/**
 * Ejecutor de Simulaciones de Monte Carlo
 * Coordina la ejecución de simulaciones y almacenamiento de resultados
 */

import { runMonteCarloSimulation, type PortfolioData, type SimulationResult } from "./monteCarloService";
import * as db from "../db";
import { type InsertMonteCarloSimulation } from "../../drizzle/schema";

export interface ExecuteSimulationInput {
  portfolioId: number;
  userId: number;
  numSimulations: number;
  timeHorizonDays: number;
  initialCapital: number;
}

/**
 * Obtiene los datos del portafolio para la simulación
 */
async function getPortfolioDataForSimulation(
  portfolioId: number
): Promise<PortfolioData | null> {
  const assets = await db.getPortfolioAssets(portfolioId);

  if (!assets || assets.length === 0) {
    // Portafolio por defecto: 60% acciones, 40% bonos
    return {
      assets: [
        {
          symbol: "STOCKS",
          weight: 0.6,
          expectedReturn: 0.08,
          volatility: 0.18,
        },
        {
          symbol: "BONDS",
          weight: 0.4,
          expectedReturn: 0.03,
          volatility: 0.05,
        },
      ],
      initialCapital: 10000,
      timeHorizonDays: 365,
      numSimulations: 10000,
      riskFreeRate: 0.02,
    };
  }

  // Calcular pesos y retornos esperados basados en el historial
  const totalValue = assets.reduce((sum, asset) => {
    const value = parseFloat(asset.totalValue?.toString() || "0");
    return sum + value;
  }, 0);

  if (totalValue === 0) {
    return null;
  }

  const assetData = assets.map((asset) => {
    const value = parseFloat(asset.totalValue?.toString() || "0");
    const weight = totalValue > 0 ? value / totalValue : 0;

    // Retornos esperados por tipo de activo (valores aproximados)
    const expectedReturnByType: Record<string, number> = {
      stock: 0.08,
      etf: 0.07,
      bond: 0.03,
      crypto: 0.15,
      commodity: 0.04,
      other: 0.05,
    };

    // Volatilidades esperadas por tipo de activo
    const volatilityByType: Record<string, number> = {
      stock: 0.18,
      etf: 0.12,
      bond: 0.05,
      crypto: 0.75,
      commodity: 0.20,
      other: 0.15,
    };

    // Usar tipo de activo genérico basado en símbolo
    let assetType = "stock";
    const expectedReturn = expectedReturnByType[assetType] || 0.05;
    const volatility = volatilityByType[assetType] || 0.15;

    return {
      symbol: asset.symbol || "UNKNOWN",
      weight,
      expectedReturn,
      volatility,
    };
  });

  return {
    assets: assetData,
    initialCapital: totalValue,
    timeHorizonDays: 365, // Default 1 year
    numSimulations: 10000, // Default
    riskFreeRate: 0.02,
  };
}

/**
 * Ejecuta una simulación de Monte Carlo y guarda los resultados
 */
export async function executeAndSaveSimulation(
  input: ExecuteSimulationInput
): Promise<InsertMonteCarloSimulation | null> {
  try {
    // Obtener datos del portafolio
    const portfolioData = await getPortfolioDataForSimulation(input.portfolioId);

    if (!portfolioData) {
      throw new Error("No portfolio data available for simulation");
    }

    // Actualizar parámetros de simulación
    portfolioData.numSimulations = input.numSimulations;
    portfolioData.timeHorizonDays = input.timeHorizonDays;
    portfolioData.initialCapital = input.initialCapital;

    // Ejecutar simulación
    const result = await runMonteCarloSimulation(portfolioData);

    // Preparar datos para guardar
    const simulationData: InsertMonteCarloSimulation = {
      portfolioId: input.portfolioId,
      userId: input.userId,
      numSimulations: input.numSimulations,
      timeHorizonDays: input.timeHorizonDays,
      initialCapital: input.initialCapital.toString(),
      expectedReturn: result.expectedReturn.toString(),
      volatility: result.volatility.toString(),
      sharpeRatio: result.sharpeRatio.toString(),
      valueAtRisk95: result.valueAtRisk95.toString(),
      valueAtRisk99: result.valueAtRisk99.toString(),
      meanFinalValue: result.meanFinalValue.toString(),
      medianFinalValue: result.medianFinalValue.toString(),
      percentile5: result.percentile5.toString(),
      percentile95: result.percentile95.toString(),
      simulationData: JSON.stringify({
        finalValues: result.finalValues.slice(0, 1000), // Guardar solo primeros 1000 para no saturar BD
        paths: result.simulationPaths.slice(0, 100), // Guardar solo primeros 100 paths
      }),
    };

    // Guardar en base de datos
    await db.createMonteCarloSimulation(simulationData);

    return simulationData;
  } catch (error) {
    console.error("[SimulationExecutor] Error executing simulation:", error);
    throw error;
  }
}

/**
 * Obtiene las estadísticas de una simulación guardada
 */
export async function getSimulationStats(portfolioId: number) {
  const simulation = await db.getLatestSimulation(portfolioId);

  if (!simulation) {
    return null;
  }

  return {
    id: simulation.id,
    portfolioId: simulation.portfolioId,
    createdAt: simulation.createdAt,
    expectedReturn: parseFloat(simulation.expectedReturn?.toString() || "0"),
    volatility: parseFloat(simulation.volatility?.toString() || "0"),
    sharpeRatio: parseFloat(simulation.sharpeRatio?.toString() || "0"),
    valueAtRisk95: parseFloat(simulation.valueAtRisk95?.toString() || "0"),
    valueAtRisk99: parseFloat(simulation.valueAtRisk99?.toString() || "0"),
    meanFinalValue: parseFloat(simulation.meanFinalValue?.toString() || "0"),
    medianFinalValue: parseFloat(simulation.medianFinalValue?.toString() || "0"),
    percentile5: parseFloat(simulation.percentile5?.toString() || "0"),
    percentile95: parseFloat(simulation.percentile95?.toString() || "0"),
  };
}
