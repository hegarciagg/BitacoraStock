import { Express } from "express";
import { createContext } from "./_core/context";
import * as db from "./db";

export function registerSyncRoutes(app: Express) {
  // Sync Stock Monte Carlo results
  app.post("/api/sync/stock", async (req, res) => {
    try {
      const ctx = await createContext({ req, res });
      if (!ctx.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { results, portfolioName } = req.body;

      // Ensure a portfolio exists for this user (or use a default one)
      let portfolio = (await db.getUserPortfolios(ctx.user.id))[0];
      if (!portfolio) {
        portfolio = await db.createPortfolio(ctx.user.id, portfolioName || "Main Stock Portfolio", "Sincronizado desde MainStock");
      }

      const simulation = await db.createMonteCarloSimulation({
        userId: ctx.user.id,
        portfolioId: portfolio.id,
        numSimulations: results.simulations?.length || 0,
        timeHorizonDays: 365, // Default or from body
        initialCapital: results.maxSharpe?.return?.toString() || "0", // Map appropriately
        expectedReturn: results.maxSharpe?.return?.toString(),
        volatility: results.maxSharpe?.volatility?.toString(),
        sharpeRatio: results.maxSharpe?.sharpe?.toString(),
        simulationData: results,
      });

      res.json({ success: true, simulationId: simulation.id });
    } catch (error: any) {
      console.error("Sync Stock Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sync LP Analysis results
  app.post("/api/sync/lp", async (req, res) => {
    try {
      const ctx = await createContext({ req, res });
      if (!ctx.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { symbol, results, capital } = req.body;

      // Find or create portfolio for LP
      let portfolio = (await db.getUserPortfolios(ctx.user.id)).find(p => p.name === "Liquid Profits");
      if (!portfolio) {
        portfolio = await db.createPortfolio(ctx.user.id, "Liquid Profits", "Sincronizado desde LP Web");
      }

      // Record in history or create a specific record
      await db.recordPortfolioChange(portfolio.id, ctx.user.id, "updated", 
        `Análisis de LP para ${symbol}. APY: ${(results.apy * 100).toFixed(2)}%`,
        undefined,
        capital,
        results
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Sync LP Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
