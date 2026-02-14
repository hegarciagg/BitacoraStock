import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  profilePicture: text("profilePicture"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  riskProfile: mysqlEnum("riskProfile", ["conservative", "moderate", "aggressive"]).default("moderate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


// Tabla para portafolios de inversión
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// Tabla para operaciones de inversión
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  assetName: varchar("assetName", { length: 255 }).notNull(),
  assetType: mysqlEnum("assetType", ["stock", "etf", "bond", "crypto", "commodity", "other"]).notNull(),
  action: mysqlEnum("action", ["buy", "sell", "dividend"]).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 18, scale: 8 }).notNull(),
  totalValue: decimal("totalValue", { precision: 18, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 18, scale: 2 }).default("0"),
  transactionDate: timestamp("transactionDate").notNull(),
  saleDate: datetime("saleDate"),
  salePrice: decimal("salePrice", { precision: 18, scale: 8 }),
  saleValue: decimal("saleValue", { precision: 18, scale: 2 }),
  saleCommission: decimal("saleCommission", { precision: 18, scale: 2 }).default("0"),
  dividend: decimal("dividend", { precision: 18, scale: 2 }).default("0"),
  comments: text("comments"), // General comments
  purchaseReason: text("purchaseReason"), // Specific reason for purchase
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

// Tabla para comentarios de mercado por fecha en inversiones
export const investmentMarketComments = mysqlTable("investmentMarketComments", {
  id: int("id").autoincrement().primaryKey(),
  investmentId: int("investmentId").notNull(),
  userId: int("userId").notNull(),
  comment: text("comment").notNull(),
  sentiment: mysqlEnum("sentiment", ["bullish", "bearish", "neutral"]).default("neutral"),
  date: datetime("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestmentMarketComment = typeof investmentMarketComments.$inferSelect;
export type InsertInvestmentMarketComment = typeof investmentMarketComments.$inferInsert;

// Tabla para activos en portafolios
export const portfolioAssets = mysqlTable("portfolioAssets", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  assetName: varchar("assetName", { length: 255 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 18, scale: 8 }),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  totalValue: decimal("totalValue", { precision: 18, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  averageCost: decimal("averageCost", { precision: 18, scale: 8 }),
  gainLoss: decimal("gainLoss", { precision: 18, scale: 2 }),
  gainLossPercent: decimal("gainLossPercent", { precision: 5, scale: 2 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioAsset = typeof portfolioAssets.$inferSelect;
export type InsertPortfolioAsset = typeof portfolioAssets.$inferInsert;

// Tabla para simulaciones de Monte Carlo
export const monteCarloSimulations = mysqlTable("monteCarloSimulations", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  numSimulations: int("numSimulations").notNull(),
  timeHorizonDays: int("timeHorizonDays").notNull(),
  initialCapital: decimal("initialCapital", { precision: 18, scale: 2 }).notNull(),
  expectedReturn: decimal("expectedReturn", { precision: 5, scale: 4 }),
  volatility: decimal("volatility", { precision: 5, scale: 4 }),
  sharpeRatio: decimal("sharpeRatio", { precision: 8, scale: 4 }),
  valueAtRisk95: decimal("valueAtRisk95", { precision: 18, scale: 2 }),
  valueAtRisk99: decimal("valueAtRisk99", { precision: 18, scale: 2 }),
  meanFinalValue: decimal("meanFinalValue", { precision: 18, scale: 2 }),
  medianFinalValue: decimal("medianFinalValue", { precision: 18, scale: 2 }),
  percentile5: decimal("percentile5", { precision: 18, scale: 2 }),
  percentile95: decimal("percentile95", { precision: 18, scale: 2 }),
  simulationData: json("simulationData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonteCarloSimulation = typeof monteCarloSimulations.$inferSelect;
export type InsertMonteCarloSimulation = typeof monteCarloSimulations.$inferInsert;

// Tabla para recomendaciones personalizadas
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  simulationId: int("simulationId"),
  recommendationType: mysqlEnum("recommendationType", ["rebalance", "diversify", "risk_alert", "opportunity", "optimization"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  suggestedActions: json("suggestedActions"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  status: mysqlEnum("status", ["active", "dismissed", "completed"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

// Tabla para reportes PDF
export const portfolioReports = mysqlTable("portfolioReports", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  reportType: mysqlEnum("reportType", ["analysis", "simulation", "recommendations", "comprehensive"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSizeBytes: int("fileSizeBytes"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioReport = typeof portfolioReports.$inferSelect;
export type InsertPortfolioReport = typeof portfolioReports.$inferInsert;

// Tabla para notificaciones
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  portfolioId: int("portfolioId"),
  type: mysqlEnum("type", ["rebalance_alert", "risk_alert", "opportunity", "report_ready", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: int("read").default(0),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Tabla para análisis de sentimiento de noticias
export const sentimentAnalysis = mysqlTable("sentimentAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  overallSentiment: decimal("overallSentiment", { precision: 3, scale: 2 }).notNull(),
  marketConfidence: decimal("marketConfidence", { precision: 3, scale: 2 }).notNull(),
  riskAdjustment: decimal("riskAdjustment", { precision: 5, scale: 2 }).notNull(),
  recommendedAction: mysqlEnum("recommendedAction", ["comprar", "vender", "mantener"]).notNull(),
  correlations: json("correlations"),
  newsCount: int("newsCount").default(0),
  analysisDate: timestamp("analysisDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SentimentAnalysis = typeof sentimentAnalysis.$inferSelect;
export type InsertSentimentAnalysis = typeof sentimentAnalysis.$inferInsert;

// Sentiment Analysis Cache Table
export const sentimentAnalysisCache = mysqlTable("sentimentAnalysisCache", {
  id: int("id").autoincrement().primaryKey(),
  cacheKey: varchar("cacheKey", { length: 255 }).notNull().unique(),
  portfolioId: int("portfolioId"),
  userId: int("userId").notNull(),
  analysisData: json("analysisData").notNull(),
  newsCount: int("newsCount").default(0),
  ttlSeconds: int("ttlSeconds").default(3600),
  expiresAt: timestamp("expiresAt").notNull(),
  hits: int("hits").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SentimentAnalysisCache = typeof sentimentAnalysisCache.$inferSelect;
export type InsertSentimentAnalysisCache = typeof sentimentAnalysisCache.$inferInsert;


// User Sessions Table
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  deviceType: varchar("deviceType", { length: 50 }), // "desktop", "mobile", "tablet"
  browserName: varchar("browserName", { length: 100 }),
  osName: varchar("osName", { length: 100 }),
  isCurrentSession: int("isCurrentSession").default(0),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// Portfolio History Table - Registro de cambios en portafolios
export const portfolioHistory = mysqlTable("portfolioHistory", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  changeType: mysqlEnum("changeType", ["created", "updated", "asset_added", "asset_removed", "asset_modified", "rebalanced", "deleted"]).notNull(),
  description: text("description"),
  previousValue: decimal("previousValue", { precision: 18, scale: 2 }),
  newValue: decimal("newValue", { precision: 18, scale: 2 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioHistory = typeof portfolioHistory.$inferSelect;
export type InsertPortfolioHistory = typeof portfolioHistory.$inferInsert;
