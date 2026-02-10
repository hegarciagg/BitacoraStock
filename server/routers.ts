import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { executeAndSaveSimulation } from "./services/simulationExecutor";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255).optional(),
        riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.name && !input.riskProfile) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
        }
        await db.updateUserProfile(ctx.user.id, {
          name: input.name,
          riskProfile: input.riskProfile,
        });
        return { success: true };
      }),
    getSessions: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserSessions(ctx.user.id);
      }),
    closeSession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserSession(input.sessionId);
        return { success: true };
      }),
  }),

  // Portfolio routers
  portfolio: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserPortfolios(ctx.user.id)
    ),
    
    get: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return portfolio;
      }),
    
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { createPortfolioWithCacheInvalidation } = await import("./services/crudWithCacheInvalidation");
        return createPortfolioWithCacheInvalidation(ctx.user.id, input.name, input.description);
      }),
    
    update: protectedProcedure
      .input(z.object({
        portfolioId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { updatePortfolioWithCacheInvalidation } = await import("./services/crudWithCacheInvalidation");
        return updatePortfolioWithCacheInvalidation(input.portfolioId, ctx.user.id, {
          name: input.name,
          description: input.description,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { deletePortfolioWithCacheInvalidation } = await import("./services/crudWithCacheInvalidation");
        return deletePortfolioWithCacheInvalidation(input.portfolioId, ctx.user.id);
      }),
    
    getHistory: protectedProcedure
      .input(z.object({ portfolioId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioHistory(input.portfolioId, input.limit || 50);
      }),
    
    getHistoryByDateRange: protectedProcedure
      .input(z.object({
        portfolioId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioHistoryByDateRange(input.portfolioId, input.startDate, input.endDate);
      }),
    
    exportHistoryCSV: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const history = await db.getPortfolioHistory(input.portfolioId, 1000);
        const { exportHistoryToCSV } = await import("./services/historyExportService");
        const csv = await exportHistoryToCSV(portfolio, history);
        const date = new Date().toISOString().split("T")[0];
        return { csv, filename: `historial-${portfolio.name}-${date}.csv` };
      }),
    
    exportHistoryPDF: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const history = await db.getPortfolioHistory(input.portfolioId, 1000);
        const { exportHistoryToPDF } = await import("./services/historyExportService");
        const pdfBuffer = await exportHistoryToPDF(portfolio, history);
        const date = new Date().toISOString().split("T")[0];
        return { pdf: pdfBuffer.toString("base64"), filename: `historial-${portfolio.name}-${date}.pdf` };
      }),
  }),

  // Investment routers
  investment: router({
    list: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioInvestments(input.portfolioId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        portfolioId: z.number(),
        symbol: z.string(),
        assetName: z.string(),
        assetType: z.enum(["stock", "etf", "bond", "crypto", "commodity", "other"]),
        action: z.enum(["buy", "sell", "dividend"]),
        quantity: z.string(),
        unitPrice: z.string(),
        totalValue: z.string(),
        commission: z.string().optional(),
        transactionDate: z.date(),
        saleDate: z.date().optional(),
        salePrice: z.string().optional(),
        saleValue: z.string().optional(),
        saleCommission: z.string().optional(),
        dividend: z.string().optional(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { createInvestmentWithCacheInvalidation } = await import("./services/crudWithCacheInvalidation");
        return createInvestmentWithCacheInvalidation(ctx.user.id, input.portfolioId, {
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        investmentId: z.number(),
        portfolioId: z.number(),
        symbol: z.string().optional(),
        quantity: z.string().optional(),
        unitPrice: z.string().optional(),
        totalValue: z.string().optional(),
        commission: z.string().optional(),
        saleDate: z.date().optional(),
        salePrice: z.string().optional(),
        saleValue: z.string().optional(),
        saleCommission: z.string().optional(),
        dividend: z.string().optional(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const investment = await db.getInvestmentById(input.investmentId);
        if (!investment || investment.portfolioId !== input.portfolioId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { updateInvestmentWithCacheInvalidation } = await import("./services/crudWithCacheInvalidation");
        return updateInvestmentWithCacheInvalidation(ctx.user.id, input.investmentId, input.portfolioId, {
          symbol: input.symbol,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalValue: input.totalValue,
          commission: input.commission,
          saleDate: input.saleDate,
          salePrice: input.salePrice,
          saleValue: input.saleValue,
          saleCommission: input.saleCommission,
          dividend: input.dividend,
          comments: input.comments,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({
        investmentId: z.number(),
        portfolioId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const investment = await db.getInvestmentById(input.investmentId);
        if (!investment || investment.portfolioId !== input.portfolioId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { deleteInvestmentWithCacheInvalidation } = await import("./services/crudWithCacheInvalidation");
        return deleteInvestmentWithCacheInvalidation(ctx.user.id, input.investmentId, input.portfolioId);
      }),
  }),

  // Portfolio Assets routers
  portfolioAsset: router({
    list: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioAssets(input.portfolioId);
      }),
  }),

  // Monte Carlo Simulation routers
  simulation: router({
    create: protectedProcedure
      .input(z.object({
        portfolioId: z.number(),
        numSimulations: z.number(),
        timeHorizonDays: z.number(),
        initialCapital: z.string(),
        expectedReturn: z.string().optional(),
        volatility: z.string().optional(),
        sharpeRatio: z.string().optional(),
        valueAtRisk95: z.string().optional(),
        valueAtRisk99: z.string().optional(),
        meanFinalValue: z.string().optional(),
        medianFinalValue: z.string().optional(),
        percentile5: z.string().optional(),
        percentile95: z.string().optional(),
        simulationData: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createMonteCarloSimulation({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    execute: protectedProcedure
      .input(z.object({
        portfolioId: z.number(),
        numSimulations: z.number().default(10000),
        timeHorizonDays: z.number().default(365),
        initialCapital: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        return executeAndSaveSimulation({
          portfolioId: input.portfolioId,
          userId: ctx.user.id,
          numSimulations: input.numSimulations,
          timeHorizonDays: input.timeHorizonDays,
          initialCapital: input.initialCapital,
        });
      }),
    
    getLatest: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getLatestSimulation(input.portfolioId);
      }),
    
    list: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioSimulations(input.portfolioId);
      }),
    
    exportPDF: protectedProcedure
      .input(z.object({ simulationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const simulation = await db.getMonteCarloSimulationById(input.simulationId);
        if (!simulation || simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const portfolio = await db.getPortfolioById(simulation.portfolioId);
        if (!portfolio) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
        }
        const { generateMonteCarloReport } = await import("./services/pdfReportService");
        const pdfBuffer = await generateMonteCarloReport({
          portfolioName: portfolio.name,
          simulationDate: simulation.createdAt,
          numSimulations: simulation.numSimulations,
          timeHorizonDays: simulation.timeHorizonDays,
          initialCapital: parseFloat(simulation.initialCapital.toString()),
          results: {
            expectedReturn: parseFloat(simulation.expectedReturn?.toString() || "0"),
            volatility: parseFloat(simulation.volatility?.toString() || "0"),
            sharpeRatio: parseFloat(simulation.sharpeRatio?.toString() || "0"),
            valueAtRisk95: parseFloat(simulation.valueAtRisk95?.toString() || "0"),
            valueAtRisk99: parseFloat(simulation.valueAtRisk99?.toString() || "0"),
            meanFinalValue: parseFloat(simulation.meanFinalValue?.toString() || "0"),
            medianFinalValue: parseFloat(simulation.medianFinalValue?.toString() || "0"),
            percentile5: parseFloat(simulation.percentile5?.toString() || "0"),
            percentile95: parseFloat(simulation.percentile95?.toString() || "0"),
            simulationPaths: [],
            finalValues: [],
          },
        });
        return {
          success: true,
          pdfBase64: pdfBuffer.toString("base64"),
          filename: `simulacion_${portfolio.name}_${new Date().toISOString().split("T")[0]}.pdf`,
        };
      }),
    
    exportPDFCustom: protectedProcedure
      .input(z.object({
        simulationId: z.number(),
        sections: z.object({
          generalInfo: z.boolean(),
          simulationParameters: z.boolean(),
          portfolioComposition: z.boolean(),
          mainMetrics: z.boolean(),
          riskAnalysis: z.boolean(),
          interpretation: z.boolean(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const simulation = await db.getMonteCarloSimulationById(input.simulationId);
        if (!simulation || simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const portfolio = await db.getPortfolioById(simulation.portfolioId);
        if (!portfolio) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
        }
        const { generateMonteCarloReport } = await import("./services/pdfReportService");
        const pdfBuffer = await generateMonteCarloReport({
          portfolioName: portfolio.name,
          simulationDate: simulation.createdAt,
          numSimulations: simulation.numSimulations,
          timeHorizonDays: simulation.timeHorizonDays,
          initialCapital: parseFloat(simulation.initialCapital.toString()),
          results: {
            expectedReturn: parseFloat(simulation.expectedReturn?.toString() || "0"),
            volatility: parseFloat(simulation.volatility?.toString() || "0"),
            sharpeRatio: parseFloat(simulation.sharpeRatio?.toString() || "0"),
            valueAtRisk95: parseFloat(simulation.valueAtRisk95?.toString() || "0"),
            valueAtRisk99: parseFloat(simulation.valueAtRisk99?.toString() || "0"),
            meanFinalValue: parseFloat(simulation.meanFinalValue?.toString() || "0"),
            medianFinalValue: parseFloat(simulation.medianFinalValue?.toString() || "0"),
            percentile5: parseFloat(simulation.percentile5?.toString() || "0"),
            percentile95: parseFloat(simulation.percentile95?.toString() || "0"),
            simulationPaths: [],
            finalValues: [],
          },
          sections: input.sections,
        });
        return {
          success: true,
          pdfBase64: pdfBuffer.toString("base64"),
          filename: `simulacion_${portfolio.name}_${new Date().toISOString().split("T")[0]}.pdf`,
        };
      })
  }),

  // Recommendations routers
  recommendation: router({
    list: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioRecommendations(input.portfolioId);
      }),
  }),

  // Portfolio Reports routers
  report: router({
    list: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getPortfolioReports(input.portfolioId);
      }),
  }),

  // Notifications routers
  notification: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserNotifications(ctx.user.id)
    ),
  }),

  // Sentiment Analysis routers
  sentiment: router({
    analyze: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const assets = await db.getPortfolioAssets(input.portfolioId);
        const portfolioAssets = assets.map(a => ({
          symbol: a.symbol,
          assetName: a.assetName,
        }));
        const { analyzeMarketSentimentWithLLM } = await import("./services/sentimentAnalysisService");
        const { generateCacheKey, getCachedAnalysis, cacheAnalysis } = await import("./services/sentimentCacheService");
        
        // Generate cache key
        const assetSymbols = portfolioAssets.map(a => a.symbol);
        const cacheKey = generateCacheKey(input.portfolioId, ctx.user.id, [], assetSymbols);
        
        // Try to get from cache
        const cachedEntry = await getCachedAnalysis(cacheKey, ctx.user.id);
        if (cachedEntry) {
          return cachedEntry.analysisData;
        }
        
        // If not in cache, perform analysis
        const analysis = await analyzeMarketSentimentWithLLM(portfolioAssets);
        const result = await db.createSentimentAnalysis({
          portfolioId: input.portfolioId,
          userId: ctx.user.id,
          overallSentiment: analysis.overallSentiment.toString(),
          marketConfidence: analysis.marketConfidence.toString(),
          riskAdjustment: analysis.riskAdjustment.toString(),
          recommendedAction: analysis.recommendedAction,
          correlations: analysis.correlations,
          newsCount: analysis.newsCount,
          analysisDate: analysis.analysisDate,
        });
        
        // Save to cache
        await cacheAnalysis(
          cacheKey,
          ctx.user.id,
          input.portfolioId,
          result,
          analysis.newsCount,
          3600
        );
        
        return result;
      }),
    getLatest: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ ctx, input }) => {
        const portfolio = await db.getPortfolioById(input.portfolioId);
        if (!portfolio || portfolio.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getLatestSentimentAnalysis(input.portfolioId);
      }),
    getCacheStats: protectedProcedure
      .query(async ({ ctx }) => {
        const { getCacheStats } = await import("./services/sentimentCacheService");
        return getCacheStats();
      }),
    invalidateCache: protectedProcedure
      .input(z.object({ portfolioId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { invalidatePortfolioCache, invalidateUserCache } = await import("./services/sentimentCacheService");
        if (input.portfolioId) {
          await invalidatePortfolioCache(input.portfolioId);
        } else {
          await invalidateUserCache(ctx.user.id);
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
