/**
 * Wrapper para operaciones CRUD con invalidación automática de caché
 * Proporciona funciones que ejecutan operaciones de base de datos
 * e invalidan el caché automáticamente después
 */

import * as db from "../db";
import { handleCacheInvalidation, createInvalidationContext } from "./cacheInvalidationService";
import type { InsertPortfolio, InsertInvestment, InsertPortfolioAsset } from "../../drizzle/schema";

/**
 * Crea un portafolio e invalida caché del usuario
 */
export async function createPortfolioWithCacheInvalidation(
  userId: number,
  name: string,
  description?: string
) {
  try {
    const result = await db.createPortfolio(userId, name, description);
    
    // Invalidar caché después de crear portafolio
    const context = createInvalidationContext(userId, "portfolio_created");
    await handleCacheInvalidation(context);
    
    return result;
  } catch (error) {
    console.error("[CRUD] Error creating portfolio:", error);
    throw error;
  }
}

/**
 * Actualiza un portafolio e invalida su caché
 * Nota: Requiere implementación de updatePortfolio en db.ts
 */
export async function updatePortfolioWithCacheInvalidation(
  portfolioId: number,
  userId: number,
  updates: Partial<InsertPortfolio>
) {
  try {
    // Obtener portafolio actual para verificar propiedad
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Invalidar caché del portafolio
    const context = createInvalidationContext(userId, "portfolio_updated", portfolioId);
    await handleCacheInvalidation(context);
    
    return portfolio;
  } catch (error) {
    console.error("[CRUD] Error updating portfolio:", error);
    throw error;
  }
}

/**
 * Elimina un portafolio e invalida caché del usuario
 * Nota: Requiere implementación de deletePortfolio en db.ts
 */
export async function deletePortfolioWithCacheInvalidation(
  portfolioId: number,
  userId: number
) {
  try {
    // Obtener portafolio actual para verificar propiedad
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Invalidar caché del portafolio y del usuario
    const context = createInvalidationContext(userId, "portfolio_deleted", portfolioId);
    await handleCacheInvalidation(context);
    
    return portfolio;
  } catch (error) {
    console.error("[CRUD] Error deleting portfolio:", error);
    throw error;
  }
}

/**
 * Crea una inversión e invalida caché del portafolio
 */
export async function createInvestmentWithCacheInvalidation(
  userId: number,
  portfolioId: number,
  data: InsertInvestment
) {
  try {
    // Verificar que el portafolio pertenece al usuario
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Crear inversión
    const result = await db.createInvestment(data);
    
    // Invalidar caché del portafolio
    const context = createInvalidationContext(userId, "investment_created", portfolioId);
    await handleCacheInvalidation(context);
    
    return result;
  } catch (error) {
    console.error("[CRUD] Error creating investment:", error);
    throw error;
  }
}

/**
 * Actualiza una inversión e invalida caché del portafolio
 * Nota: Requiere implementación de updateInvestment en db.ts
 */
export async function updateInvestmentWithCacheInvalidation(
  userId: number,
  investmentId: number,
  portfolioId: number,
  updates: Partial<InsertInvestment>
) {
  try {
    // Verificar que el portafolio pertenece al usuario
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Verificar que la inversión existe
    const investment = await db.getInvestmentById(investmentId);
    if (!investment || investment.portfolioId !== portfolioId) {
      throw new Error("Investment not found");
    }

    // Actualizar la inversión en la base de datos
    await db.updateInvestment(investmentId, updates);

    // Invalidar caché del portafolio
    const context = createInvalidationContext(userId, "investment_updated", portfolioId);
    await handleCacheInvalidation(context);
    
    // Devolvemos la inversión actualizada (con los updates aplicados)
    return { ...investment, ...updates };
  } catch (error) {
    console.error("[CRUD] Error updating investment:", error);
    throw error;
  }
}

/**
 * Elimina una inversión e invalida caché del portafolio
 * Nota: Requiere implementación de deleteInvestment en db.ts
 */
export async function deleteInvestmentWithCacheInvalidation(
  userId: number,
  investmentId: number,
  portfolioId: number
) {
  try {
    // Verificar que el portafolio pertenece al usuario
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Verificar que la inversión existe
    const investment = await db.getInvestmentById(investmentId);
    if (!investment || investment.portfolioId !== portfolioId) {
      throw new Error("Investment not found");
    }

    // Borrar la inversión en la base de datos
    await db.deleteInvestment(investmentId);

    // Invalidar caché del portafolio
    const context = createInvalidationContext(userId, "investment_deleted", portfolioId);
    await handleCacheInvalidation(context);
    
    return investment;
  } catch (error) {
    console.error("[CRUD] Error deleting investment:", error);
    throw error;
  }
}

/**
 * Actualiza un activo de portafolio e invalida caché del portafolio
 */
export async function updatePortfolioAssetWithCacheInvalidation(
  userId: number,
  assetId: number,
  portfolioId: number,
  updates: Partial<InsertPortfolioAsset>
) {
  try {
    // Verificar que el portafolio pertenece al usuario
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Actualizar activo
    const result = await db.updatePortfolioAsset(assetId, updates);
    
    // Invalidar caché del portafolio
    const context = createInvalidationContext(userId, "portfolio_asset_updated", portfolioId);
    await handleCacheInvalidation(context);
    
    return result;
  } catch (error) {
    console.error("[CRUD] Error updating portfolio asset:", error);
    throw error;
  }
}

/**
 * Elimina un activo de portafolio e invalida caché del portafolio
 * Nota: Requiere implementación de deletePortfolioAsset en db.ts
 */
export async function deletePortfolioAssetWithCacheInvalidation(
  userId: number,
  assetId: number,
  portfolioId: number
) {
  try {
    // Verificar que el portafolio pertenece al usuario
    const portfolio = await db.getPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found or unauthorized");
    }

    // Invalidar caché del portafolio
    const context = createInvalidationContext(userId, "portfolio_asset_updated", portfolioId);
    await handleCacheInvalidation(context);
    
    return { success: true };
  } catch (error) {
    console.error("[CRUD] Error deleting portfolio asset:", error);
    throw error;
  }
}

/**
 * Ejecuta una operación CRUD con invalidación automática de caché
 * Función genérica para operaciones personalizadas
 */
export async function executeCrudWithCacheInvalidation<T>(
  operation: () => Promise<T>,
  userId: number,
  event: "portfolio_created" | "portfolio_updated" | "portfolio_deleted" | "investment_created" | "investment_updated" | "investment_deleted" | "portfolio_asset_updated",
  portfolioId?: number
): Promise<T> {
  try {
    // Ejecutar operación
    const result = await operation();
    
    // Invalidar caché
    const context = createInvalidationContext(userId, event, portfolioId);
    await handleCacheInvalidation(context);
    
    return result;
  } catch (error) {
    console.error(`[CRUD] Error executing operation (${event}):`, error);
    throw error;
  }
}
