import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createPortfolioWithCacheInvalidation,
  createInvestmentWithCacheInvalidation,
  updatePortfolioAssetWithCacheInvalidation,
  executeCrudWithCacheInvalidation,
} from "./crudWithCacheInvalidation";
import * as db from "../db";
import * as cacheInvalidation from "./cacheInvalidationService";

// Mock database functions
vi.mock("../db", () => ({
  getPortfolioById: vi.fn(),
  getInvestmentById: vi.fn(),
  createPortfolio: vi.fn(),
  createInvestment: vi.fn(),
  updatePortfolioAsset: vi.fn(),
}));

// Mock cache invalidation
vi.mock("./cacheInvalidationService", () => ({
  handleCacheInvalidation: vi.fn(),
  createInvalidationContext: vi.fn((userId, event, portfolioId) => ({
    userId,
    event,
    portfolioId,
    timestamp: new Date(),
  })),
}));

describe("CRUD with Cache Invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPortfolioWithCacheInvalidation", () => {
    it("debe crear portafolio e invalidar caché", async () => {
      const mockResult = { insertId: 1 };
      vi.mocked(db.createPortfolio).mockResolvedValue(mockResult);

      const result = await createPortfolioWithCacheInvalidation(100, "Test Portfolio", "Description");

      expect(db.createPortfolio).toHaveBeenCalledWith(100, "Test Portfolio", "Description");
      expect(cacheInvalidation.handleCacheInvalidation).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("debe manejar errores de creación", async () => {
      const error = new Error("Database error");
      vi.mocked(db.createPortfolio).mockRejectedValue(error);

      await expect(
        createPortfolioWithCacheInvalidation(100, "Test Portfolio")
      ).rejects.toThrow("Database error");

      expect(cacheInvalidation.handleCacheInvalidation).not.toHaveBeenCalled();
    });
  });

  describe("createInvestmentWithCacheInvalidation", () => {
    it("debe crear inversión e invalidar caché del portafolio", async () => {
      const mockPortfolio = { id: 1, userId: 100, name: "Portfolio" };
      const mockResult = { insertId: 1 };

      vi.mocked(db.getPortfolioById).mockResolvedValue(mockPortfolio);
      vi.mocked(db.createInvestment).mockResolvedValue(mockResult);

      const investmentData = {
        portfolioId: 1,
        symbol: "AAPL",
        assetName: "Apple",
        assetType: "stock" as const,
        action: "buy" as const,
        quantity: "100",
        unitPrice: "150",
        totalValue: "15000",
        transactionDate: new Date(),
        userId: 100,
      };

      const result = await createInvestmentWithCacheInvalidation(100, 1, investmentData);

      expect(db.getPortfolioById).toHaveBeenCalledWith(1);
      expect(db.createInvestment).toHaveBeenCalledWith(investmentData);
      expect(cacheInvalidation.handleCacheInvalidation).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("debe rechazar si el portafolio no pertenece al usuario", async () => {
      const mockPortfolio = { id: 1, userId: 200, name: "Portfolio" };
      vi.mocked(db.getPortfolioById).mockResolvedValue(mockPortfolio);

      const investmentData = {
        portfolioId: 1,
        symbol: "AAPL",
        assetName: "Apple",
        assetType: "stock" as const,
        action: "buy" as const,
        quantity: "100",
        unitPrice: "150",
        totalValue: "15000",
        transactionDate: new Date(),
        userId: 100,
      };

      await expect(
        createInvestmentWithCacheInvalidation(100, 1, investmentData)
      ).rejects.toThrow("Portfolio not found or unauthorized");

      expect(cacheInvalidation.handleCacheInvalidation).not.toHaveBeenCalled();
    });

    it("debe rechazar si el portafolio no existe", async () => {
      vi.mocked(db.getPortfolioById).mockResolvedValue(undefined);

      const investmentData = {
        portfolioId: 1,
        symbol: "AAPL",
        assetName: "Apple",
        assetType: "stock" as const,
        action: "buy" as const,
        quantity: "100",
        unitPrice: "150",
        totalValue: "15000",
        transactionDate: new Date(),
        userId: 100,
      };

      await expect(
        createInvestmentWithCacheInvalidation(100, 1, investmentData)
      ).rejects.toThrow("Portfolio not found or unauthorized");

      expect(cacheInvalidation.handleCacheInvalidation).not.toHaveBeenCalled();
    });
  });

  describe("updatePortfolioAssetWithCacheInvalidation", () => {
    it("debe actualizar activo e invalidar caché", async () => {
      const mockPortfolio = { id: 1, userId: 100, name: "Portfolio" };
      const mockResult = { success: true };

      vi.mocked(db.getPortfolioById).mockResolvedValue(mockPortfolio);
      vi.mocked(db.updatePortfolioAsset).mockResolvedValue(mockResult);

      const updates = { quantity: "200" };
      const result = await updatePortfolioAssetWithCacheInvalidation(100, 1, 1, updates);

      expect(db.getPortfolioById).toHaveBeenCalledWith(1);
      expect(db.updatePortfolioAsset).toHaveBeenCalledWith(1, updates);
      expect(cacheInvalidation.handleCacheInvalidation).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("debe rechazar si el portafolio no pertenece al usuario", async () => {
      const mockPortfolio = { id: 1, userId: 200, name: "Portfolio" };
      vi.mocked(db.getPortfolioById).mockResolvedValue(mockPortfolio);

      await expect(
        updatePortfolioAssetWithCacheInvalidation(100, 1, 1, { quantity: "200" })
      ).rejects.toThrow("Portfolio not found or unauthorized");

      expect(cacheInvalidation.handleCacheInvalidation).not.toHaveBeenCalled();
    });
  });

  describe("executeCrudWithCacheInvalidation", () => {
    it("debe ejecutar operación e invalidar caché", async () => {
      const operation = vi.fn().mockResolvedValue({ success: true });

      const result = await executeCrudWithCacheInvalidation(
        operation,
        100,
        "portfolio_created",
        1
      );

      expect(operation).toHaveBeenCalled();
      expect(cacheInvalidation.handleCacheInvalidation).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("debe manejar errores de operación", async () => {
      const error = new Error("Operation failed");
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        executeCrudWithCacheInvalidation(operation, 100, "portfolio_created", 1)
      ).rejects.toThrow("Operation failed");

      expect(cacheInvalidation.handleCacheInvalidation).not.toHaveBeenCalled();
    });

    it("debe trabajar sin portfolioId", async () => {
      const operation = vi.fn().mockResolvedValue({ success: true });

      const result = await executeCrudWithCacheInvalidation(
        operation,
        100,
        "portfolio_created"
      );

      expect(operation).toHaveBeenCalled();
      expect(cacheInvalidation.handleCacheInvalidation).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
