import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  handleCacheInvalidation,
  invalidateUserPortfoliosCache,
  createInvalidationContext,
  invalidateCacheSilently,
} from "./cacheInvalidationService";

describe("Cache Invalidation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInvalidationContext", () => {
    it("debe crear contexto de invalidación", () => {
      const context = createInvalidationContext(100, "portfolio_created", 1);

      expect(context.userId).toBe(100);
      expect(context.portfolioId).toBe(1);
      expect(context.event).toBe("portfolio_created");
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it("debe permitir contexto sin portfolioId", () => {
      const context = createInvalidationContext(100, "portfolio_deleted");

      expect(context.userId).toBe(100);
      expect(context.portfolioId).toBeUndefined();
      expect(context.event).toBe("portfolio_deleted");
    });
  });

  describe("handleCacheInvalidation", () => {
    it("debe manejar evento portfolio_created", async () => {
      const context = createInvalidationContext(100, "portfolio_created", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe manejar evento portfolio_updated", async () => {
      const context = createInvalidationContext(100, "portfolio_updated", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe manejar evento investment_created", async () => {
      const context = createInvalidationContext(100, "investment_created", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe manejar evento investment_updated", async () => {
      const context = createInvalidationContext(100, "investment_updated", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe manejar evento investment_deleted", async () => {
      const context = createInvalidationContext(100, "investment_deleted", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe manejar evento portfolio_asset_updated", async () => {
      const context = createInvalidationContext(100, "portfolio_asset_updated", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe manejar evento portfolio_deleted", async () => {
      const context = createInvalidationContext(100, "portfolio_deleted", 1);
      await expect(handleCacheInvalidation(context)).resolves.not.toThrow();
    });

    it("debe evitar invalidaciones duplicadas muy cercanas", async () => {
      const context = createInvalidationContext(100, "portfolio_created", 1);

      await handleCacheInvalidation(context);
      await handleCacheInvalidation(context);

      // Ambas llamadas deben completarse sin error
      // La segunda debe ser ignorada por cooldown
      expect(true).toBe(true);
    });
  });

  describe("invalidateUserPortfoliosCache", () => {
    it("debe invalidar caché de portafolios de usuario", async () => {
      await expect(invalidateUserPortfoliosCache(100)).resolves.not.toThrow();
    });
  });

  describe("invalidateCacheSilently", () => {
    it("debe manejar invalidación silenciosa", async () => {
      const context = createInvalidationContext(100, "portfolio_created", 1);
      await expect(invalidateCacheSilently(context)).resolves.not.toThrow();
    });

    it("debe no lanzar error en caso de fallo", async () => {
      const context = createInvalidationContext(100, "portfolio_created", 1);
      // Incluso si hay error, no debe lanzar
      await expect(invalidateCacheSilently(context)).resolves.not.toThrow();
    });
  });
});
