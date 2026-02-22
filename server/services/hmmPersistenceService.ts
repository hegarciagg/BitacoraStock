/**
 * hmmPersistenceService.ts
 * Reads and writes HMM trades + equity curve to MySQL via Drizzle ORM.
 */

import { getDb } from "../db";
import { hmmTrades, hmmEquityCurve, type HmmTrade, type HmmEquityPoint } from "../../drizzle/schema";
import type { SimulatedTrade, EquityPoint } from "./hmmRiskService";
import { desc } from "drizzle-orm";

// ── Trades ────────────────────────────────────────────────────────────────────
export async function saveTrades(trades: SimulatedTrade[]): Promise<void> {
  if (trades.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = trades.map((t: SimulatedTrade) => ({
    entryPrice:    t.entryPrice.toFixed(8),
    exitPrice:     t.exitPrice.toFixed(8),
    pnl:           t.pnl.toFixed(4),
    leverage:      "2.50",
    entryTime:     t.entryTime,
    exitTime:      t.exitTime,
    regime:        t.regime,
    confirmations: t.confirmations,
    isOpen:        0,
    capitalBefore: t.capitalBefore.toFixed(4),
    capitalAfter:  t.capitalAfter.toFixed(4),
  }));

  await db.insert(hmmTrades).values(rows);
}

export async function getRecentTrades(limit = 50): Promise<HmmTrade[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hmmTrades)
    .orderBy(desc(hmmTrades.createdAt))
    .limit(limit);
}

export async function clearTrades(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(hmmTrades);
}

// ── Equity Curve ──────────────────────────────────────────────────────────────
export async function saveEquityCurve(points: EquityPoint[]): Promise<void> {
  if (points.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert in chunks of 500 to avoid MySQL packet size limits
  const CHUNK = 500;
  for (let i = 0; i < points.length; i += CHUNK) {
    const chunk = points.slice(i, i + CHUNK).map((p: EquityPoint) => ({
      timestamp: p.timestamp,
      equity:    p.equity.toFixed(4),
      drawdown:  p.drawdown.toFixed(6),
      regime:    p.regime,
    }));
    await db.insert(hmmEquityCurve).values(chunk);
  }
}

export async function getEquityCurve(limit = 2000): Promise<HmmEquityPoint[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hmmEquityCurve)
    .orderBy(hmmEquityCurve.timestamp)
    .limit(limit);
}

export async function clearEquityCurve(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(hmmEquityCurve);
}

// ── Metrics (derived from persisted data) ──────────────────────────────────────
export async function getPersistedMetrics() {
  const trades = await getRecentTrades(10000);
  const curve  = await getEquityCurve(10000);

  if (trades.length === 0 || curve.length === 0) return null;

  const pnls      = trades.map((t: HmmTrade) => parseFloat(t.pnl?.toString() ?? "0"));
  const equities  = curve.map((e: HmmEquityPoint) => parseFloat(e.equity.toString()));
  const drawdowns = curve.map((e: HmmEquityPoint) => parseFloat(e.drawdown?.toString() ?? "0"));

  const finalEquity = equities[equities.length - 1];
  const totalReturn = (finalEquity - 10000) / 10000 * 100;
  const wins        = pnls.filter((p: number) => p > 0).length;
  const winRate     = trades.length > 0 ? wins / trades.length * 100 : 0;
  const maxDrawdown = Math.min(...drawdowns) * 100;

  return {
    totalReturn,
    winRate,
    maxDrawdown,
    totalTrades:  trades.length,
    finalCapital: finalEquity,
  };
}
