import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { executeAndSaveSimulation } from "./services/simulationExecutor";
import { hmmRouter } from "./routers.hmm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  hmm: hmmRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Email ya está en uso" });
        }
        
        const bcrypt = await import("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(input.password, salt);
        const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          loginMethod: "email",
        });

        const { users } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const dbClient = await getDb();
        if (dbClient) {
           const { eq } = await import("drizzle-orm");
           await dbClient.update(users)
              .set({ passwordHash, isEmailVerified: 0 })
              .where(eq(users.openId, openId));
        }

        const newUser = await db.getUserByEmail(input.email);
        if (!newUser) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al crear usuario" });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await db.createOtpCode(newUser.id, otpCode, "email_verification");
        
        // Mock email sending
        console.log(`\n======================================================`);
        console.log(`MOCK EMAIL SENT TO: ${input.email}`);
        console.log(`SUBJECT: Tu código de verificación`);
        console.log(`CODIGO OTP: ${otpCode}`);
        console.log(`======================================================\n`);

        return { success: true, message: "Usuario registrado. Revisa tu correo para el código OTP." };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales invalidas" });
        }

        const bcrypt = await import("bcryptjs");
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales invalidas" });
        }

        if (user.isEmailVerified === 0) {
          // Si no está verificado, generamos un nuevo OTP para que pueda verificar
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          await db.createOtpCode(user.id, otpCode, "email_verification");
          
          console.log(`\n======================================================`);
          console.log(`MOCK EMAIL SENT TO: ${user.email}`);
          console.log(`SUBJECT: Tu nuevo código de verificación`);
          console.log(`CODIGO OTP: ${otpCode}`);
          console.log(`======================================================\n`);

          return { success: false, requireVerification: true, message: "Debes verificar tu correo electrónico" };
        }

        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("../shared/const");
        
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

    verifyOtp: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
        }

        const validOtp = await db.getValidOtpCode(user.id, input.code, "email_verification");
        if (!validOtp) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido o expirado" });
        }

        await db.markOtpAsUsed(validOtp.id);
        await db.updateUserEmailVerified(user.id);

        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("../shared/const");
        
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

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
        purchaseReason: z.string().optional(),

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
        assetName: z.string().optional(),
        assetType: z.enum(["stock", "etf", "bond", "crypto", "commodity", "fund", "other"]).optional(),
        action: z.enum(["buy", "sell", "dividend"]).optional(),
        symbol: z.string().optional(),
        quantity: z.string().optional(),
        unitPrice: z.string().optional(),
        totalValue: z.string().optional(),
        commission: z.string().optional(),
        transactionDate: z.date().optional(),
        saleDate: z.date().optional(),
        salePrice: z.string().optional(),
        saleValue: z.string().optional(),
        saleCommission: z.string().optional(),
        dividend: z.string().optional(),
        comments: z.string().optional(),
        purchaseReason: z.string().optional(),

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
          assetName: input.assetName,
          assetType: input.assetType,
          action: input.action,
          symbol: input.symbol,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalValue: input.totalValue,
          commission: input.commission,
          transactionDate: input.transactionDate,
          saleDate: input.saleDate,
          salePrice: input.salePrice,
          saleValue: input.saleValue,
          saleCommission: input.saleCommission,
          comments: input.comments,
          purchaseReason: input.purchaseReason,
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


    addComment: protectedProcedure
      .input(z.object({
        investmentId: z.number(),
        comment: z.string(),
        sentiment: z.enum(["bullish", "bearish", "neutral"]).optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const investment = await db.getInvestmentById(input.investmentId);
        if (!investment || investment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.addInvestmentComment({
          investmentId: input.investmentId,
          userId: ctx.user.id,
          comment: input.comment,
          sentiment: input.sentiment,
          date: input.date,
        });
      }),

    getComments: protectedProcedure
      .input(z.object({ investmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const investment = await db.getInvestmentById(input.investmentId);
        if (!investment || investment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getInvestmentComments(input.investmentId);
      }),

    updateComment: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        comment: z.string().optional(),
        sentiment: z.enum(["bullish", "bearish", "neutral"]).optional(),
        date: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const comment = await db.getInvestmentCommentById(input.commentId);
        if (!comment || comment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.updateInvestmentComment(input.commentId, {
          comment: input.comment,
          sentiment: input.sentiment,
          date: input.date,
        });
      }),

    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const comment = await db.getInvestmentCommentById(input.commentId);
        return db.deleteInvestmentComment(input.commentId);
      }),

  }),

  market: router({
    getPrices: protectedProcedure
      .input(z.object({ symbols: z.array(z.string()) }))
      .query(async ({ input }) => {
        const { getCurrentPrices } = await import("./services/marketDataService");
        return getCurrentPrices(input.symbols);
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
