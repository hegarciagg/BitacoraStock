/**
 * routers.hmm.ts
 * tRPC router for the HMM Regime-Based Trading System.
 * All procedures accept an optional { symbol } input (default: "BTC-USD")
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import { ALL_SYMBOLS, ASSET_CATALOG } from "./services/hmmFeatureService";

const HMM_SERVICE_URL = process.env.HMM_SERVICE_URL ?? "http://localhost:8000";

// Zod schema reused in every procedure that accepts a symbol
const symbolInput = z.object({
  symbol: z.string().refine(s => ALL_SYMBOLS.includes(s), {
    message: "Symbol not in allowed asset list",
  }).default("BTC-USD"),
});

// ── Python HMM client ─────────────────────────────────────────────────────────
async function callHMMService(features: {
  returns:       number[];
  range:         number[];
  volVolatility: number[];
}) {
  try {
    const { data } = await axios.post(`${HMM_SERVICE_URL}/detect-regimes`, features, {
      timeout: 60_000,
    });
    return data as {
      states:              number[];
      bullState:           number;
      bearState:           number;
      meanReturnsByState:  number[];
    };
  } catch (err: any) {
    const msg = err?.response?.data?.detail ?? err?.message ?? "Unknown error";
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `HMM service unreachable: ${msg}. Ensure hmm-service is running on ${HMM_SERVICE_URL}`,
    });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
export const hmmRouter = router({

  /** List of all supported assets, grouped by category */
  getAssets: protectedProcedure.query(() => ASSET_CATALOG),

  /**
   * Run full backtest for a given symbol.
   */
  runBacktest: protectedProcedure
    .input(symbolInput.optional())
    .mutation(async ({ input }) => {
      const symbol = input?.symbol ?? "BTC-USD";

      const { fetchAndComputeFeatures } = await import("./services/hmmFeatureService");
      const { runBacktest }             = await import("./services/hmmRiskService");
      const {
        saveTrades,
        saveEquityCurve,
        clearTrades,
        clearEquityCurve,
      } = await import("./services/hmmPersistenceService");

      const { candles, hmm, indicators } = await fetchAndComputeFeatures(symbol);

      if (candles.length < 50) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Insufficient data for ${symbol}` });
      }

      const hmmResult      = await callHMMService(hmm);
      const backtestResult = runBacktest(candles, hmmResult.states, hmmResult.bullState, hmmResult.bearState, indicators);

      await clearEquityCurve();
      await clearTrades();
      await saveTrades(backtestResult.trades);
      await saveEquityCurve(backtestResult.equityCurve);

      return {
        success:    true,
        symbol,
        metrics:    backtestResult.metrics,
        bullState:  hmmResult.bullState,
        bearState:  hmmResult.bearState,
        tradeCount: backtestResult.trades.length,
      };
    }),

  /**
   * Get the current market signal for the most recent candle of a symbol.
   */
  getCurrentSignal: protectedProcedure
    .input(symbolInput.optional())
    .query(async ({ input }) => {
      const symbol = input?.symbol ?? "BTC-USD";

      const { fetchAndComputeFeatures } = await import("./services/hmmFeatureService");
      const { evaluateVoting, generateSignal, getCooldownUntil } = await import("./services/hmmStrategyService");

      const { candles, hmm, indicators } = await fetchAndComputeFeatures(symbol);
      const hmmResult  = await callHMMService(hmm);
      const lastIdx    = candles.length - 1;
      const lastBar    = candles[lastIdx];
      const lastState  = hmmResult.states[hmmResult.states.length - 1];
      const voting     = evaluateVoting(lastIdx, lastBar.close, indicators);
      const decision   = generateSignal(lastState, hmmResult.bullState, hmmResult.bearState, voting);

      return {
        ...decision,
        symbol,
        lastPrice: lastBar.close,
        lastTime:  lastBar.time,
        meanReturnsByState: hmmResult.meanReturnsByState,
      };
    }),

  /**
   * Get performance metrics from the last persisted backtest.
   */
  getPerformanceMetrics: protectedProcedure
    .query(async () => {
      const { getPersistedMetrics } = await import("./services/hmmPersistenceService");
      return getPersistedMetrics();
    }),

  /**
   * Get equity curve (last backtest).
   */
  getEquityCurve: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(10000).default(2000) }).optional())
    .query(async ({ input }) => {
      const { getEquityCurve } = await import("./services/hmmPersistenceService");
      return getEquityCurve(input?.limit ?? 2000);
    }),

  /**
   * Get recent trades (last backtest).
   */
  getTrades: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(50) }).optional())
    .query(async ({ input }) => {
      const { getRecentTrades } = await import("./services/hmmPersistenceService");
      return getRecentTrades(input?.limit ?? 50);
    }),

  /**
   * Health check for the Python microservice.
   */
  hmmServiceHealth: protectedProcedure
    .query(async () => {
      try {
        const { data } = await axios.get(`${HMM_SERVICE_URL}/health`, { timeout: 5000 });
        return { online: true, ...data };
      } catch {
        return { online: false, status: "unreachable" };
      }
    }),
});

export type HmmRouter = typeof hmmRouter;
