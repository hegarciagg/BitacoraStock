import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, portfolios, investments, portfolioAssets, monteCarloSimulations, recommendations, portfolioReports, notifications, portfolioHistory, InsertPortfolio, InsertInvestment, InsertPortfolioAsset, InsertMonteCarloSimulation, InsertRecommendation, InsertPortfolioReport, InsertNotification, InsertPortfolioHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      // Asegurar un usuario por defecto para el bypass de OAuth
      const db = _db;
      setTimeout(async () => {
        try {
          const result = await db.select().from(users).where(eq(users.id, 1)).limit(1);
          if (result.length === 0) {
            await db.insert(users).values({
              id: 1,
              openId: "invitado_local",
              name: "Usuario Hegarciagg",
              email: "hegarciagg@local.com",
              loginMethod: "local",
              role: "admin",
            });
            console.log("[Database] Default user created for local access.");
          }
        } catch (e) {
          console.warn("[Database] Could not seed default user:", e);
        }
      }, 1000);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Portfolio queries
export async function getUserPortfolios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.userId, userId));
}

export async function getPortfolioById(portfolioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPortfolio(userId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(portfolios).values({ userId, name, description });
  return result;
}

// Investment queries
export async function getPortfolioInvestments(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investments).where(eq(investments.portfolioId, portfolioId));
}

export async function createInvestment(data: InsertInvestment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(investments).values(data);
}

export async function getInvestmentById(investmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(investments).where(eq(investments.id, investmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Portfolio Assets queries
export async function getPortfolioAssets(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, portfolioId));
}

export async function updatePortfolioAsset(assetId: number, data: Partial<InsertPortfolioAsset>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(portfolioAssets).set(data).where(eq(portfolioAssets.id, assetId));
}

// Monte Carlo Simulation queries
export async function createMonteCarloSimulation(data: InsertMonteCarloSimulation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(monteCarloSimulations).values(data);
}

export async function getLatestSimulation(portfolioId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(monteCarloSimulations)
    .where(eq(monteCarloSimulations.portfolioId, portfolioId))
    .orderBy((t) => desc(t.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPortfolioSimulations(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(monteCarloSimulations)
    .where(eq(monteCarloSimulations.portfolioId, portfolioId))
    .orderBy((t) => desc(t.createdAt));
}

export async function getMonteCarloSimulationById(simulationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(monteCarloSimulations)
    .where(eq(monteCarloSimulations.id, simulationId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// Recommendations queries
export async function createRecommendation(data: InsertRecommendation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(recommendations).values(data);
}

export async function getPortfolioRecommendations(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recommendations).where(eq(recommendations.portfolioId, portfolioId));
}

// Portfolio Reports queries
export async function createPortfolioReport(data: InsertPortfolioReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(portfolioReports).values(data);
}

export async function getPortfolioReports(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioReports).where(eq(portfolioReports.portfolioId, portfolioId));
}

// Notifications queries
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId));
}


// Sentiment Analysis functions
export async function createSentimentAnalysis(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { sentimentAnalysis } = await import("../drizzle/schema");
  return db.insert(sentimentAnalysis).values({
    userId: data.userId,
    portfolioId: data.portfolioId,
    overallSentiment: data.overallSentiment,
    marketConfidence: data.marketConfidence,
    riskAdjustment: data.riskAdjustment,
    recommendedAction: data.recommendedAction,
    correlations: data.correlations,
    newsCount: data.newsCount,
    analysisDate: data.analysisDate,
  });
}

export async function getLatestSentimentAnalysis(portfolioId: number) {
  const db = await getDb();
  if (!db) return null;
  const { sentimentAnalysis } = await import("../drizzle/schema");
  const { desc, eq } = await import("drizzle-orm");
  return db
    .select()
    .from(sentimentAnalysis)
    .where(eq(sentimentAnalysis.portfolioId, portfolioId))
    .orderBy(desc(sentimentAnalysis.createdAt))
    .limit(1)
    .then(results => results[0] || null);
}

export async function getSentimentAnalysisHistory(portfolioId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const { sentimentAnalysis } = await import("../drizzle/schema");
  const { desc, eq } = await import("drizzle-orm");
  return db
    .select()
    .from(sentimentAnalysis)
    .where(eq(sentimentAnalysis.portfolioId, portfolioId))
    .orderBy(desc(sentimentAnalysis.createdAt))
    .limit(limit);
}


// Portfolio update and delete operations
export async function updatePortfolio(portfolioId: number, data: Partial<InsertPortfolio>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { eq } = await import("drizzle-orm");
  return db.update(portfolios).set(data).where(eq(portfolios.id, portfolioId));
}

export async function deletePortfolio(portfolioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { eq } = await import("drizzle-orm");
  return db.delete(portfolios).where(eq(portfolios.id, portfolioId));
}

// Investment update and delete operations
export async function updateInvestment(investmentId: number, data: Partial<InsertInvestment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { eq } = await import("drizzle-orm");
  return db.update(investments).set(data).where(eq(investments.id, investmentId));
}

export async function deleteInvestment(investmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { eq } = await import("drizzle-orm");
  return db.delete(investments).where(eq(investments.id, investmentId));
}

// Portfolio Asset delete operation
export async function deletePortfolioAsset(assetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { eq } = await import("drizzle-orm");
  return db.delete(portfolioAssets).where(eq(portfolioAssets.id, assetId));
}


// User profile update operation
export async function updateUserProfile(userId: number, data: { name?: string | null; riskProfile?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { eq } = await import("drizzle-orm");
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.riskProfile !== undefined) updateData.riskProfile = data.riskProfile;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }
  
  return db.update(users).set(updateData).where(eq(users.id, userId));
}


// User Sessions management
export async function createUserSession(
  userId: number,
  sessionId: string,
  userAgent?: string,
  ipAddress?: string,
  deviceType?: string,
  browserName?: string,
  osName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { userSessions } = await import("../drizzle/schema");
  
  return db.insert(userSessions).values({
    userId,
    sessionId,
    userAgent,
    ipAddress,
    deviceType,
    browserName,
    osName,
    isCurrentSession: 1,
  });
}

export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { userSessions } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, userId))
    .orderBy(userSessions.createdAt);
}

export async function deleteUserSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { userSessions } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
}

export async function updateSessionActivity(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { userSessions } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return db
    .update(userSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(userSessions.sessionId, sessionId));
}

export async function clearOldSessions(userId: number, keepSessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { userSessions } = await import("../drizzle/schema");
  const { and, ne, eq } = await import("drizzle-orm");
  
  return db
    .delete(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        ne(userSessions.sessionId, keepSessionId)
      )
    );
}


// Portfolio History Functions
export async function recordPortfolioChange(
  portfolioId: number,
  userId: number,
  changeType: "created" | "updated" | "asset_added" | "asset_removed" | "asset_modified" | "rebalanced" | "deleted",
  description?: string,
  previousValue?: number,
  newValue?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record portfolio change: database not available");
    return;
  }

  try {
    const historyRecord: InsertPortfolioHistory = {
      portfolioId,
      userId,
      changeType,
      description: description || null,
      previousValue: previousValue ? previousValue.toString() : null,
      newValue: newValue ? newValue.toString() : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };
    await db.insert(portfolioHistory).values(historyRecord);
  } catch (error) {
    console.error("[Database] Error recording portfolio change:", error);
  }
}

export async function getPortfolioHistory(portfolioId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get portfolio history: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(portfolioHistory)
      .where(eq(portfolioHistory.portfolioId, portfolioId))
      .orderBy(desc(portfolioHistory.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Error getting portfolio history:", error);
    return [];
  }
}

export async function getPortfolioHistoryByDateRange(
  portfolioId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get portfolio history: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(portfolioHistory)
      .where(
        and(
          eq(portfolioHistory.portfolioId, portfolioId),
          gte(portfolioHistory.createdAt, startDate),
          lte(portfolioHistory.createdAt, endDate)
        )
      )
      .orderBy(desc(portfolioHistory.createdAt));
  } catch (error) {
    console.error("[Database] Error getting portfolio history by date range:", error);
    return [];
  }
}
