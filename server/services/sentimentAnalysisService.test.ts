import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateSentimentScore,
  correlateWithHistoricalMovements,
  analyzeMarketSentiment,
  adjustMonteCarloParameters,
  calculateSentimentImpactMatrix,
} from "./sentimentAnalysisService";

describe("Sentiment Analysis Service", () => {
  describe("calculateSentimentScore", () => {
    it("debe detectar sentimiento positivo", () => {
      const text = "Mercado en récord máximo con boom de acciones tecnológicas";
      const score = calculateSentimentScore(text);
      expect(score.overall).toBeGreaterThan(0);
      expect(score.category).toBe("positivo");
    });

    it("debe detectar sentimiento negativo", () => {
      const text = "Crash en mercado y colapso de precios por pánico";
      const score = calculateSentimentScore(text);
      expect(score.overall).toBeLessThan(0);
      expect(score.category).toBe("negativo");
    });

    it("debe detectar sentimiento neutral o positivo", () => {
      const text = "El mercado se mantiene estable sin cambios significativos";
      const score = calculateSentimentScore(text);
      expect(score.overall).toBeGreaterThanOrEqual(-0.5);
      expect(score.overall).toBeLessThanOrEqual(0.5);
      const validCategories = ["neutral", "positivo", "negativo"];
      expect(validCategories).toContain(score.category);
    });

    it("debe calcular confianza basada en palabras clave", () => {
      const text1 = "Mercado sube";
      const text2 = "Mercado sube mucho con récord máximo y boom explosivo";
      const score1 = calculateSentimentScore(text1);
      const score2 = calculateSentimentScore(text2);
      expect(score2.confidence).toBeGreaterThan(score1.confidence);
    });

    it("debe normalizar puntuación entre -1 y 1", () => {
      const text = "Crash colapso desplome pánico crisis caída libre bear market";
      const score = calculateSentimentScore(text);
      expect(score.overall).toBeGreaterThanOrEqual(-1);
      expect(score.overall).toBeLessThanOrEqual(1);
    });
  });

  describe("correlateWithHistoricalMovements", () => {
    it("debe retornar correlación para activos tecnológicos", () => {
      const sentiment = {
        overall: 0.5,
        confidence: 0.8,
        keywords: [],
        category: "positivo" as const,
      };
      const correlation = correlateWithHistoricalMovements(sentiment, "AAPL");
      expect(correlation.asset).toBe("AAPL");
      expect(correlation.historicalCorrelation).toBe(0.75);
      expect(correlation.expectedMovement).toBeGreaterThan(0);
    });

    it("debe retornar correlación para índices", () => {
      const sentiment = {
        overall: -0.3,
        confidence: 0.7,
        keywords: [],
        category: "negativo" as const,
      };
      const correlation = correlateWithHistoricalMovements(sentiment, "SPY");
      expect(correlation.asset).toBe("SPY");
      expect(correlation.historicalCorrelation).toBe(0.65);
      expect(correlation.expectedMovement).toBeLessThan(0);
    });

    it("debe usar correlación por defecto para activos desconocidos", () => {
      const sentiment = {
        overall: 0.2,
        confidence: 0.5,
        keywords: [],
        category: "positivo" as const,
      };
      const correlation = correlateWithHistoricalMovements(sentiment, "UNKNOWN");
      expect(correlation.asset).toBe("UNKNOWN");
      expect(correlation.historicalCorrelation).toBeGreaterThanOrEqual(0.4);
      expect(correlation.historicalCorrelation).toBeLessThanOrEqual(0.8);
    });
  });

  describe("analyzeMarketSentiment", () => {
    it("debe analizar múltiples noticias correctamente", () => {
      const newsTexts = [
        "Mercado sube con récord máximo",
        "Acciones tecnológicas en rally alcista",
        "Economía crece más de lo esperado",
      ];
      const assets = ["AAPL", "MSFT", "SPY"];
      const analysis = analyzeMarketSentiment(newsTexts, assets);

      expect(analysis.overallSentiment).toBeGreaterThan(0);
      expect(analysis.marketConfidence).toBeGreaterThan(0);
      expect(analysis.correlations).toHaveLength(3);
      expect(["comprar", "mantener"]).toContain(analysis.recommendedAction);
    });

    it("debe calcular factor de riesgo correctamente", () => {
      const newsTexts = ["Mercado crash y pánico"];
      const assets = ["SPY"];
      const analysis = analyzeMarketSentiment(newsTexts, assets);

      expect(analysis.riskAdjustment).toBeGreaterThan(1);
      expect(["vender", "mantener"]).toContain(analysis.recommendedAction);
    });

    it("debe generar explicación detallada", () => {
      const newsTexts = ["Mercado estable sin cambios"];
      const assets = ["SPY"];
      const analysis = analyzeMarketSentiment(newsTexts, assets);

      expect(analysis.explanation).toBeTruthy();
      expect(analysis.explanation).toContain("Sentimiento");
    });
  });

  describe("adjustMonteCarloParameters", () => {
    it("debe ajustar parámetros con sentimiento positivo", () => {
      const sentiment = {
        overallSentiment: 0.3,
        marketConfidence: 0.7,
        correlations: [],
        riskAdjustment: 0.9,
        recommendedAction: "comprar" as const,
        explanation: "test",
      };

      const adjusted = adjustMonteCarloParameters(0.1, 0.15, sentiment);

      expect(adjusted.expectedReturn).toBeGreaterThan(0.1);
      expect(adjusted.volatility).toBeLessThan(0.15);
    });

    it("debe ajustar parámetros con sentimiento negativo", () => {
      const sentiment = {
        overallSentiment: -0.4,
        marketConfidence: 0.8,
        correlations: [],
        riskAdjustment: 1.2,
        recommendedAction: "vender" as const,
        explanation: "test",
      };

      const adjusted = adjustMonteCarloParameters(0.1, 0.15, sentiment);

      expect(adjusted.expectedReturn).toBeLessThan(0.1);
      expect(adjusted.volatility).toBeGreaterThan(0.15);
    });
  });

  describe("calculateSentimentImpactMatrix", () => {
    it("debe calcular impacto de sentimiento por activo", () => {
      const assets = ["AAPL", "MSFT", "SPY"];
      const sentiments = [
        {
          overall: 0.5,
          confidence: 0.8,
          keywords: [],
          category: "positivo" as const,
        },
      ];

      const matrix = calculateSentimentImpactMatrix(assets, sentiments);

      expect(Object.keys(matrix)).toHaveLength(3);
      expect(matrix.AAPL).toBeTruthy();
      expect(matrix.MSFT).toBeTruthy();
      expect(matrix.SPY).toBeTruthy();
    });

    it("debe reflejar correlaciones históricas en el impacto", () => {
      const assets = ["AAPL", "GLD"];
      const sentiments = [
        {
          overall: 0.5,
          confidence: 0.8,
          keywords: [],
          category: "positivo" as const,
        },
      ];

      const matrix = calculateSentimentImpactMatrix(assets, sentiments);

      expect(Math.abs(matrix.AAPL)).toBeGreaterThan(Math.abs(matrix.GLD));
    });
  });
});
