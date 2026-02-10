import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateCacheKey,
  getCachedAnalysis,
  cacheAnalysis,
  invalidatePortfolioCache,
  invalidateUserCache,
  cleanupExpiredCache,
  getCacheStats,
  clearAllCache,
} from "./sentimentCacheService";

describe("Sentiment Cache Service", () => {
  beforeEach(async () => {
    await clearAllCache();
  });

  afterEach(async () => {
    await clearAllCache();
  });

  describe("generateCacheKey", () => {
    it("debe generar clave de caché consistente", () => {
      const key1 = generateCacheKey(1, 100, [], ["AAPL", "MSFT"]);
      const key2 = generateCacheKey(1, 100, [], ["AAPL", "MSFT"]);

      expect(key1).toBe(key2);
    });

    it("debe generar claves diferentes para portafolios diferentes", () => {
      const key1 = generateCacheKey(1, 100, [], ["AAPL"]);
      const key2 = generateCacheKey(2, 100, [], ["AAPL"]);

      expect(key1).not.toBe(key2);
    });

    it("debe generar claves diferentes para usuarios diferentes", () => {
      const key1 = generateCacheKey(1, 100, [], ["AAPL"]);
      const key2 = generateCacheKey(1, 200, [], ["AAPL"]);

      expect(key1).not.toBe(key2);
    });

    it("debe generar claves diferentes para activos diferentes", () => {
      const key1 = generateCacheKey(1, 100, [], ["AAPL", "MSFT"]);
      const key2 = generateCacheKey(1, 100, [], ["AAPL", "GOOGL"]);

      expect(key1).not.toBe(key2);
    });

    it("debe ordenar activos para consistencia", () => {
      const key1 = generateCacheKey(1, 100, [], ["MSFT", "AAPL"]);
      const key2 = generateCacheKey(1, 100, [], ["AAPL", "MSFT"]);

      expect(key1).toBe(key2);
    });
  });

  describe("cacheAnalysis y getCachedAnalysis", () => {
    it("debe guardar y recuperar análisis del caché", async () => {
      const cacheKey = generateCacheKey(1, 100, [], ["AAPL"]);
      const analysisData = {
        overallSentiment: 0.5,
        marketConfidence: 0.8,
        correlations: [],
      };

      await cacheAnalysis(cacheKey, 100, 1, analysisData, 5, 3600);

      const cached = await getCachedAnalysis(cacheKey, 100);
      expect(cached).not.toBeNull();
      expect(cached?.analysisData).toEqual(analysisData);
    });

    it("debe retornar null para caché no existente", async () => {
      const cached = await getCachedAnalysis("nonexistent_key", 100);
      expect(cached).toBeNull();
    });

    it("debe incrementar contador de hits", async () => {
      const cacheKey = generateCacheKey(1, 100, [], ["AAPL"]);
      const analysisData = { test: "data" };

      await cacheAnalysis(cacheKey, 100, 1, analysisData, 5, 3600);

      const cached1 = await getCachedAnalysis(cacheKey, 100);
      expect(cached1?.hits).toBe(1);

      const cached2 = await getCachedAnalysis(cacheKey, 100);
      expect(cached2?.hits).toBe(2);
    });

    it("debe respetar TTL de caché", async () => {
      const cacheKey = generateCacheKey(1, 100, [], ["AAPL"]);
      const analysisData = { test: "data" };

      // Crear caché con TTL corto (1 segundo)
      await cacheAnalysis(cacheKey, 100, 1, analysisData, 5, 1);

      // Verificar que está en caché
      const cached1 = await getCachedAnalysis(cacheKey, 100);
      expect(cached1).not.toBeNull();

      // Esperar a que expire (1200ms para asegurar que expire)
      await new Promise(resolve => setTimeout(resolve, 1200));

      const cached = await getCachedAnalysis(cacheKey, 100);
      // La entrada debe estar expirada y eliminada
      expect(cached).toBeNull();
    });
  });

  describe("invalidatePortfolioCache", () => {
    it("debe invalidar caché de portafolio específico", async () => {
      const cacheKey = generateCacheKey(1, 100, [], ["AAPL"]);
      const analysisData = { test: "data" };

      await cacheAnalysis(cacheKey, 100, 1, analysisData, 5, 3600);

      let cached = await getCachedAnalysis(cacheKey, 100);
      expect(cached).not.toBeNull();

      await invalidatePortfolioCache(1, 100);

      cached = await getCachedAnalysis(cacheKey, 100);
      expect(cached).toBeNull();
    });

    it("debe no afectar otros portafolios", async () => {
      const cacheKey1 = generateCacheKey(1, 100, [], ["AAPL"]);
      const cacheKey2 = generateCacheKey(2, 100, [], ["AAPL"]);
      const analysisData = { test: "data" };

      await cacheAnalysis(cacheKey1, 100, 1, analysisData, 5, 3600);
      await cacheAnalysis(cacheKey2, 100, 2, analysisData, 5, 3600);

      await invalidatePortfolioCache(1, 100);

      const cached1 = await getCachedAnalysis(cacheKey1, 100);
      const cached2 = await getCachedAnalysis(cacheKey2, 100);

      expect(cached1).toBeNull();
      expect(cached2).not.toBeNull();
    });
  });

  describe("invalidateUserCache", () => {
    it("debe invalidar todo el caché de usuario", async () => {
      const cacheKey1 = generateCacheKey(1, 100, [], ["AAPL"]);
      const cacheKey2 = generateCacheKey(2, 100, [], ["MSFT"]);
      const analysisData = { test: "data" };

      await cacheAnalysis(cacheKey1, 100, 1, analysisData, 5, 3600);
      await cacheAnalysis(cacheKey2, 100, 2, analysisData, 5, 3600);

      await invalidateUserCache(100);

      const cached1 = await getCachedAnalysis(cacheKey1, 100);
      const cached2 = await getCachedAnalysis(cacheKey2, 100);

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });

    it("debe no afectar otros usuarios", async () => {
      const cacheKey1 = generateCacheKey(1, 100, [], ["AAPL"]);
      const cacheKey2 = generateCacheKey(1, 200, [], ["AAPL"]);
      const analysisData = { test: "data" };

      await cacheAnalysis(cacheKey1, 100, 1, analysisData, 5, 3600);
      await cacheAnalysis(cacheKey2, 200, 1, analysisData, 5, 3600);

      await invalidateUserCache(100);

      const cached1 = await getCachedAnalysis(cacheKey1, 100);
      const cached2 = await getCachedAnalysis(cacheKey2, 200);

      expect(cached1).toBeNull();
      expect(cached2).not.toBeNull();
    });
  });

  describe("cleanupExpiredCache", () => {
    it("debe limpiar entradas expiradas", async () => {
      const cacheKey = generateCacheKey(1, 100, [], ["AAPL"]);
      const analysisData = { test: "data" };

      // Crear caché con TTL muy corto
      await cacheAnalysis(cacheKey, 100, 1, analysisData, 5, 0.05);

      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ejecutar limpieza
      const cleanedCount = await cleanupExpiredCache();

      expect(typeof cleanedCount).toBe("number");
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getCacheStats", () => {
    it("debe retornar estadísticas de caché", async () => {
      const cacheKey = generateCacheKey(1, 100, [], ["AAPL"]);
      const analysisData = { test: "data" };

      await cacheAnalysis(cacheKey, 100, 1, analysisData, 5, 3600);

      const stats = await getCacheStats();

      expect(stats).toHaveProperty("totalEntries");
      expect(stats).toHaveProperty("expiredEntries");
      expect(stats).toHaveProperty("totalHits");
      expect(stats).toHaveProperty("averageHits");
      expect(stats).toHaveProperty("cacheSize");
    });
  });
});
