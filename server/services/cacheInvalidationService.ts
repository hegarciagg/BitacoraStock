/**
 * Servicio de Invalidación de Caché
 * Coordina la invalidación de caché cuando ocurren cambios en portafolios
 */

import { invalidatePortfolioCache, invalidateUserCache } from "./sentimentCacheService";

export type CacheInvalidationEvent = 
  | "portfolio_created"
  | "portfolio_updated"
  | "portfolio_deleted"
  | "investment_created"
  | "investment_updated"
  | "investment_deleted"
  | "portfolio_asset_updated";

export interface CacheInvalidationContext {
  userId: number;
  portfolioId?: number;
  event: CacheInvalidationEvent;
  timestamp: Date;
}

// Registro de invalidaciones recientes para evitar duplicados
const recentInvalidations = new Map<string, Date>();
const INVALIDATION_COOLDOWN = 5000; // 5 segundos

/**
 * Genera clave de invalidación para deduplicación
 */
function generateInvalidationKey(context: CacheInvalidationContext): string {
  return `${context.userId}:${context.portfolioId || "user"}:${context.event}`;
}

/**
 * Verifica si una invalidación fue realizada recientemente
 */
function wasRecentlyInvalidated(key: string): boolean {
  const lastInvalidation = recentInvalidations.get(key);
  if (!lastInvalidation) {
    return false;
  }

  const timeSinceLastInvalidation = Date.now() - lastInvalidation.getTime();
  return timeSinceLastInvalidation < INVALIDATION_COOLDOWN;
}

/**
 * Registra una invalidación reciente
 */
function recordInvalidation(key: string): void {
  recentInvalidations.set(key, new Date());

  // Limpiar registros antiguos
  if (recentInvalidations.size > 1000) {
    const oldestKey = Array.from(recentInvalidations.entries())
      .sort((a, b) => a[1].getTime() - b[1].getTime())[0][0];
    recentInvalidations.delete(oldestKey);
  }
}

/**
 * Maneja invalidación de caché basada en eventos
 */
export async function handleCacheInvalidation(
  context: CacheInvalidationContext
): Promise<void> {
  const key = generateInvalidationKey(context);

  // Evitar invalidaciones duplicadas muy cercanas
  if (wasRecentlyInvalidated(key)) {
    console.log(`[Cache] Skipping recent invalidation: ${key}`);
    return;
  }

  recordInvalidation(key);

  try {
    switch (context.event) {
      case "portfolio_created":
      case "portfolio_updated":
      case "investment_created":
      case "investment_updated":
      case "investment_deleted":
      case "portfolio_asset_updated":
        if (context.portfolioId) {
          await invalidatePortfolioCache(context.portfolioId);
          console.log(
            `[Cache] Invalidated portfolio cache: ${context.portfolioId} (${context.event})`
          );
        }
        break;

      case "portfolio_deleted":
        if (context.portfolioId) {
          await invalidatePortfolioCache(context.portfolioId);
        }
        await invalidateUserCache(context.userId);
        console.log(
          `[Cache] Invalidated user cache: ${context.userId} (portfolio deleted)`
        );
        break;
    }
  } catch (error) {
    console.error(`[Cache] Error handling invalidation for ${key}:`, error);
  }
}

/**
 * Invalida caché para múltiples portafolios de un usuario
 */
export async function invalidateUserPortfoliosCache(userId: number): Promise<void> {
  try {
    await invalidateUserCache(userId);
    console.log(`[Cache] Invalidated all caches for user: ${userId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating user cache for ${userId}:`, error);
  }
}

/**
 * Crea un contexto de invalidación
 */
export function createInvalidationContext(
  userId: number,
  event: CacheInvalidationEvent,
  portfolioId?: number
): CacheInvalidationContext {
  return {
    userId,
    portfolioId,
    event,
    timestamp: new Date(),
  };
}

/**
 * Invalida caché con manejo de errores silencioso
 */
export async function invalidateCacheSilently(
  context: CacheInvalidationContext
): Promise<void> {
  try {
    await handleCacheInvalidation(context);
  } catch (error) {
    console.error(`[Cache] Silent invalidation error:`, error);
    // No lanzar error para no interrumpir operaciones principales
  }
}
