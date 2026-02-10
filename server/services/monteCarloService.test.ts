import { describe, it, expect } from "vitest";
import {
  runMonteCarloSimulation,
  runMonteCarloSimulationWithSentiment,
  compareSimulationsWithSentiment,
  calculateFinancialMetrics,
  analyzeDiversification,
} from "./monteCarloService";

describe("Monte Carlo Service", () => {
  const testPortfolioData = {
    assets: [
      { symbol: "AAPL", weight: 0.3, expectedReturn: 0.12, volatility: 0.25 },
      { symbol: "MSFT", weight: 0.3, expectedReturn: 0.11, volatility: 0.23 },
      { symbol: "SPY", weight: 0.4, expectedReturn: 0.08, volatility: 0.15 },
    ],
    initialCapital: 100000,
    timeHorizonDays: 365,
    numSimulations: 1000,
    riskFreeRate: 0.02,
  };

  describe("runMonteCarloSimulation", () => {
    it("debe ejecutar simulación correctamente", () => {
      const result = runMonteCarloSimulation(testPortfolioData);

      expect(result.expectedReturn).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThan(0);
      expect(result.sharpeRatio).toBeTruthy();
      expect(result.meanFinalValue).toBeGreaterThan(testPortfolioData.initialCapital * 0.5);
      expect(result.finalValues).toHaveLength(testPortfolioData.numSimulations);
    });

    it("debe calcular Value at Risk correctamente", () => {
      const result = runMonteCarloSimulation(testPortfolioData);

      expect(result.valueAtRisk95).toBeLessThan(result.meanFinalValue);
      expect(result.valueAtRisk99).toBeLessThan(result.valueAtRisk95);
      expect(result.percentile5).toBeLessThan(result.percentile95);
    });

    it("debe generar paths de simulación", () => {
      const result = runMonteCarloSimulation(testPortfolioData);

      expect(result.simulationPaths).toHaveLength(testPortfolioData.numSimulations);
      result.simulationPaths.forEach(path => {
        expect(path[0]).toBe(testPortfolioData.initialCapital);
        expect(path.length).toBeGreaterThan(1);
      });
    });
  });

  describe("runMonteCarloSimulationWithSentiment", () => {
    it("debe aplicar ajuste positivo de sentimiento", () => {
      const sentimentAdjustment = {
        volatilityFactor: 0.9,
        returnAdjustment: 0.02,
      };

      const result = runMonteCarloSimulationWithSentiment(
        testPortfolioData,
        sentimentAdjustment
      );

      expect(result.expectedReturn).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThan(0);
      expect(result.meanFinalValue).toBeGreaterThan(testPortfolioData.initialCapital * 0.5);
    });

    it("debe aplicar ajuste negativo de sentimiento", () => {
      const sentimentAdjustment = {
        volatilityFactor: 1.2,
        returnAdjustment: -0.03,
      };

      const result = runMonteCarloSimulationWithSentiment(
        testPortfolioData,
        sentimentAdjustment
      );

      expect(result.volatility).toBeGreaterThan(0);
      expect(result.finalValues).toHaveLength(testPortfolioData.numSimulations);
    });
  });

  describe("compareSimulationsWithSentiment", () => {
    it("debe comparar simulaciones correctamente", () => {
      const sentimentAdjustment = {
        volatilityFactor: 0.95,
        returnAdjustment: 0.01,
      };

      const comparison = compareSimulationsWithSentiment(
        testPortfolioData,
        sentimentAdjustment
      );

      expect(comparison.normal).toBeTruthy();
      expect(comparison.sentimentAdjusted).toBeTruthy();
      expect(comparison.comparison).toBeTruthy();
      expect(comparison.comparison.returnDifference).toBeTruthy();
      expect(comparison.comparison.volatilityDifference).toBeTruthy();
    });

    it("debe mostrar impacto de sentimiento positivo", () => {
      const sentimentAdjustment = {
        volatilityFactor: 0.85,
        returnAdjustment: 0.03,
      };

      const comparison = compareSimulationsWithSentiment(
        testPortfolioData,
        sentimentAdjustment
      );

      expect(comparison.comparison.returnDifference).toBeGreaterThan(0);
      expect(comparison.comparison.volatilityDifference).toBeLessThan(0);
    });
  });

  describe("calculateFinancialMetrics", () => {
    it("debe calcular métricas financieras", () => {
      const metrics = calculateFinancialMetrics(testPortfolioData);

      expect(metrics.expectedReturn).toBeGreaterThan(0);
      expect(metrics.volatility).toBeGreaterThan(0);
      expect(metrics.sharpeRatio).toBeTruthy();
    });

    it("debe calcular Sharpe Ratio correctamente", () => {
      const metrics = calculateFinancialMetrics(testPortfolioData);
      const riskFreeRate = testPortfolioData.riskFreeRate || 0.02;
      const expectedSharpe = (metrics.expectedReturn - riskFreeRate) / (metrics.volatility || 1);

      expect(metrics.sharpeRatio).toBeCloseTo(expectedSharpe, 5);
    });
  });

  describe("analyzeDiversification", () => {
    it("debe analizar diversificación correctamente", () => {
      const analysis = analyzeDiversification(testPortfolioData.assets);

      expect(analysis.herfindahlIndex).toBeGreaterThan(0);
      expect(analysis.herfindahlIndex).toBeLessThanOrEqual(1);
      expect(analysis.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(analysis.diversificationScore).toBeLessThanOrEqual(100);
    });

    it("debe clasificar nivel de diversificación", () => {
      const analysis = analyzeDiversification(testPortfolioData.assets);

      const validLevels = ["low", "moderate", "high"];
      expect(validLevels).toContain(analysis.diversificationLevel);
    });

    it("debe incluir concentración por activo", () => {
      const analysis = analyzeDiversification(testPortfolioData.assets);

      expect(analysis.assetConcentration).toHaveLength(testPortfolioData.assets.length);
      analysis.assetConcentration.forEach(item => {
        expect(item.symbol).toBeTruthy();
        expect(item.weight).toBeTruthy();
        expect(item.concentration).toBeGreaterThanOrEqual(0);
        expect(item.concentration).toBeLessThanOrEqual(100);
      });
    });
  });
});
