/**
 * Servicio de Caché para Análisis de Sentimiento
 * Implementa caché en memoria con persistencia en base de datos y TTL configurable
 */

import { getDb } from "../db";
import { sentimentAnalysisCache } from "../../drizzle/schema";
import { eq, lt } from "drizzle-orm";

export interface CacheEntry {
  cacheKey: string;
  portfolioId?: number;
  userId: number;
  analysisData: any;
  newsCount: number;
  ttlSeconds: number;
  expiresAt: Date;
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  totalHits: number;
  averageHits: number;
  cacheSize: number;
}

// Caché en memoria
const memoryCache = new Map<string, CacheEntry>();

// Configuración de caché
const CACHE_CONFIG = {
  DEFAULT_TTL: 3600, // 1 hora
  MAX_MEMORY_SIZE: 100 * 1024 * 1024, // 100 MB
  CLEANUP_INTERVAL: 300000, // 5 minutos
};

/**
 * Genera una clave de caché basada en parámetros
 */
export function generateCacheKey(
  portfolioId: number | undefined,
  userId: number,
  newsKeywords: string[],
  assets: string[]
): string {
  const keyParts = [
    portfolioId ? `portfolio_${portfolioId}` : "global",
    `user_${userId}`,
    `news_${newsKeywords.sort().join(",")}`,
    `assets_${assets.sort().join(",")}`,
  ];
  return keyParts.join("::");
}

/**
 * Obtiene entrada de caché de memoria
 */
function getFromMemoryCache(cacheKey: string): CacheEntry | null {
  const entry = memoryCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  // Verificar si ha expirado
  if (new Date() > entry.expiresAt) {
    memoryCache.delete(cacheKey);
    return null;
  }

  // Incrementar contador de hits
  entry.hits++;

  return entry;
}

/**
 * Guarda entrada en caché de memoria
 */
function saveToMemoryCache(entry: CacheEntry): void {
  // Verificar tamaño de caché
  const currentSize = Array.from(memoryCache.values()).reduce(
    (sum, e) => sum + JSON.stringify(e).length,
    0
  );

  if (currentSize > CACHE_CONFIG.MAX_MEMORY_SIZE) {
    // Limpiar entradas con menos hits
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].hits - b[1].hits)
      .slice(0, Math.floor(memoryCache.size * 0.2));

    entries.forEach(([key]) => memoryCache.delete(key));
  }

  memoryCache.set(entry.cacheKey, entry);
}

/**
 * Obtiene análisis de caché (primero memoria, luego base de datos)
 */
export async function getCachedAnalysis(
  cacheKey: string,
  userId: number
): Promise<CacheEntry | null> {
  // Intentar obtener de caché en memoria
  const memoryEntry = getFromMemoryCache(cacheKey);
  if (memoryEntry) {
    return memoryEntry;
  }

  // Intentar obtener de base de datos
  const db = await getDb();
  if (!db) {
    return null;
  }

  const dbEntry = await db
    .select()
    .from(sentimentAnalysisCache)
    .where(eq(sentimentAnalysisCache.cacheKey, cacheKey))
    .limit(1)
    .then((results) => results[0] || null);

  if (!dbEntry) {
    return null;
  }

  // Verificar si ha expirado
  if (new Date() > dbEntry.expiresAt) {
    // Eliminar entrada expirada
    await db.delete(sentimentAnalysisCache).where(eq(sentimentAnalysisCache.cacheKey, cacheKey));
    return null;
  }

  // Cargar en caché de memoria
  const entry: CacheEntry = {
    cacheKey: dbEntry.cacheKey,
    portfolioId: dbEntry.portfolioId || undefined,
    userId: dbEntry.userId,
    analysisData: dbEntry.analysisData,
    newsCount: dbEntry.newsCount || 0,
    ttlSeconds: dbEntry.ttlSeconds || CACHE_CONFIG.DEFAULT_TTL,
    expiresAt: dbEntry.expiresAt,
    hits: (dbEntry.hits || 0) + 1,
  };

  saveToMemoryCache(entry);

  // Actualizar hits en base de datos
  await db
    .update(sentimentAnalysisCache)
    .set({ hits: entry.hits })
    .where(eq(sentimentAnalysisCache.cacheKey, cacheKey));

  return entry;
}

/**
 * Guarda análisis en caché
 */
export async function cacheAnalysis(
  cacheKey: string,
  userId: number,
  portfolioId: number | undefined,
  analysisData: any,
  newsCount: number,
  ttlSeconds: number = CACHE_CONFIG.DEFAULT_TTL
): Promise<CacheEntry> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const entry: CacheEntry = {
    cacheKey,
    portfolioId,
    userId,
    analysisData,
    newsCount,
    ttlSeconds,
    expiresAt,
    hits: 0,
  };

  // Guardar en caché de memoria
  saveToMemoryCache(entry);

  // Guardar en base de datos
  const db = await getDb();
  if (db) {
    try {
      await db
        .insert(sentimentAnalysisCache)
        .values({
          cacheKey,
          portfolioId: portfolioId || null,
          userId,
          analysisData,
          newsCount,
          ttlSeconds,
          expiresAt,
        })
        .onDuplicateKeyUpdate({
          set: {
            analysisData,
            newsCount,
            expiresAt,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error saving to cache database:", error);
    }
  }

  return entry;
}

/**
 * Invalida caché para un portafolio
 */
export async function invalidatePortfolioCache(portfolioId: number): Promise<void> {
  // Limpiar caché en memoria
  const keysToDelete: string[] = [];
  memoryCache.forEach((entry, key) => {
    if (entry.portfolioId === portfolioId) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => memoryCache.delete(key));

  // Limpiar base de datos
  const db = await getDb();
  if (db) {
    try {
      await db
        .delete(sentimentAnalysisCache)
        .where(eq(sentimentAnalysisCache.portfolioId, portfolioId));
    } catch (error) {
      console.error("Error invalidating portfolio cache:", error);
    }
  }
}

/**
 * Invalida caché para un usuario
 */
export async function invalidateUserCache(userId: number): Promise<void> {
  // Limpiar caché en memoria
  const keysToDelete: string[] = [];
  memoryCache.forEach((entry, key) => {
    if (entry.userId === userId) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => memoryCache.delete(key));

  // Limpiar base de datos
  const db = await getDb();
  if (db) {
    try {
      await db
        .delete(sentimentAnalysisCache)
        .where(eq(sentimentAnalysisCache.userId, userId));
    } catch (error) {
      console.error("Error invalidating user cache:", error);
    }
  }
}

/**
 * Limpia entradas de caché expiradas
 */
export async function cleanupExpiredCache(): Promise<number> {
  const now = new Date();

  // Limpiar caché en memoria
  let memoryCleanedCount = 0;
  const keysToDelete: string[] = [];
  memoryCache.forEach((entry, key) => {
    if (now > entry.expiresAt) {
      keysToDelete.push(key);
      memoryCleanedCount++;
    }
  });
  keysToDelete.forEach((key) => memoryCache.delete(key));

  // Limpiar base de datos
  let dbCleanedCount = 0;
  const db = await getDb();
  if (db) {
    try {
      await db
        .delete(sentimentAnalysisCache)
        .where(lt(sentimentAnalysisCache.expiresAt, now));
      dbCleanedCount = 0;
    } catch (error) {
      console.error("Error cleaning up cache database:", error);
    }
  }

  return memoryCleanedCount + dbCleanedCount;
}

/**
 * Obtiene estadísticas de caché
 */
export async function getCacheStats(): Promise<CacheStats> {
  const now = new Date();
  const memoryEntries = Array.from(memoryCache.values());

  let expiredCount = 0;
  let totalHits = 0;

  for (const entry of memoryEntries) {
    if (now > entry.expiresAt) {
      expiredCount++;
    }
    totalHits += entry.hits;
  }

  const cacheSize = memoryEntries.reduce((sum, e) => sum + JSON.stringify(e).length, 0);

  return {
    totalEntries: memoryEntries.length,
    expiredEntries: expiredCount,
    totalHits,
    averageHits: memoryEntries.length > 0 ? totalHits / memoryEntries.length : 0,
    cacheSize,
  };
}

/**
 * Limpia todo el caché
 */
export async function clearAllCache(): Promise<void> {
  // Limpiar caché en memoria
  memoryCache.clear();

  // Limpiar base de datos
  const db = await getDb();
  if (db) {
    try {
      await db.delete(sentimentAnalysisCache);
    } catch (error) {
      console.error("Error clearing cache database:", error);
    }
  }
}

/**
 * Inicia limpieza automática de caché expirado
 */
export function startCacheCleanupInterval(): NodeJS.Timeout {
  return setInterval(async () => {
    const cleanedCount = await cleanupExpiredCache();
    if (cleanedCount > 0) {
      console.log(`[Cache] Cleaned up ${cleanedCount} expired entries`);
    }
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
}

/**
 * Obtiene información de una entrada de caché
 */
export async function getCacheEntry(cacheKey: string): Promise<CacheEntry | null> {
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && new Date() <= memoryEntry.expiresAt) {
    return memoryEntry;
  }

  const db = await getDb();
  if (!db) {
    return null;
  }

  const dbEntry = await db
    .select()
    .from(sentimentAnalysisCache)
    .where(eq(sentimentAnalysisCache.cacheKey, cacheKey))
    .limit(1)
    .then((results) => results[0] || null);

  if (!dbEntry || new Date() > dbEntry.expiresAt) {
    return null;
  }

  return {
    cacheKey: dbEntry.cacheKey,
    portfolioId: dbEntry.portfolioId || undefined,
    userId: dbEntry.userId,
    analysisData: dbEntry.analysisData,
    newsCount: dbEntry.newsCount || 0,
    ttlSeconds: dbEntry.ttlSeconds || CACHE_CONFIG.DEFAULT_TTL,
    expiresAt: dbEntry.expiresAt,
    hits: dbEntry.hits || 0,
  };
}
